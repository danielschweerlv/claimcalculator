-- Backend database utilities.
--
-- Additive follow-up to the backend architecture migration. This keeps legacy
-- tables and frontend contracts intact while adding database-side helpers for
-- normalization, capacity backfills, assignment summaries, and safe queue
-- leasing. No old tables are removed.

-- ── Lead normalization helpers ─────────────────────────────────────────
create or replace function public.normalize_us_zip(p_zip text)
returns text
language sql
immutable
as $$
  select case
    when p_zip is null then null
    when length(regexp_replace(p_zip, '\D', '', 'g')) >= 5
      then substring(regexp_replace(p_zip, '\D', '', 'g') from 1 for 5)
    else null
  end;
$$;

create or replace function public.infer_us_state_from_zip(p_zip text)
returns text
language sql
immutable
as $$
  select case
    when public.normalize_us_zip(p_zip) ~ '^(889|890|891|893|894|895|897|898)' then 'NV'
    else null
  end;
$$;

create or replace function public.set_lead_normalized_fields()
returns trigger
language plpgsql
as $$
begin
  new.source := coalesce(nullif(new.source, ''), nullif(new.utm_source, ''), 'website');
  new.normalized_case_type := coalesce(nullif(new.normalized_case_type, ''), new.case_type::text);
  new.normalized_zip := coalesce(nullif(new.normalized_zip, ''), public.normalize_us_zip(new.zip_code));
  new.state := coalesce(nullif(new.state, ''), public.infer_us_state_from_zip(new.normalized_zip));

  if new.validation_status = 'pending'::public.lead_validation_status then
    new.validation_status := case
      when new.notes = 'non-NV zip' then 'manual_review'::public.lead_validation_status
      else 'valid'::public.lead_validation_status
    end;
  end if;

  if new.status = 'sent_to_attorney'::public.lead_status
     and new.intake_status in (
       'received'::public.lead_intake_status,
       'validated'::public.lead_intake_status,
       'queued'::public.lead_intake_status,
       'processing'::public.lead_intake_status
     ) then
    new.intake_status := 'assigned'::public.lead_intake_status;
  end if;

  if new.status = 'converted'::public.lead_status
     and new.intake_status <> 'forwarded'::public.lead_intake_status then
    new.intake_status := 'forwarded'::public.lead_intake_status;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_set_normalized_fields on public.leads;
create trigger leads_set_normalized_fields
  before insert or update of
    source,
    utm_source,
    case_type,
    zip_code,
    normalized_case_type,
    normalized_zip,
    state,
    validation_status,
    notes,
    status,
    intake_status
  on public.leads
  for each row execute function public.set_lead_normalized_fields();

update public.leads
set
  source = coalesce(nullif(source, ''), nullif(utm_source, ''), 'website'),
  normalized_case_type = coalesce(nullif(normalized_case_type, ''), case_type::text),
  normalized_zip = coalesce(nullif(normalized_zip, ''), public.normalize_us_zip(zip_code)),
  state = coalesce(nullif(state, ''), public.infer_us_state_from_zip(coalesce(normalized_zip, zip_code))),
  validation_status = case
    when validation_status = 'pending'::public.lead_validation_status and notes = 'non-NV zip'
      then 'manual_review'::public.lead_validation_status
    when validation_status = 'pending'::public.lead_validation_status
      then 'valid'::public.lead_validation_status
    else validation_status
  end
where source is null
   or source = ''
   or normalized_case_type is null
   or normalized_case_type = ''
   or normalized_zip is null
   or normalized_zip = ''
   or (state is null and public.infer_us_state_from_zip(coalesce(normalized_zip, zip_code)) is not null)
   or validation_status = 'pending'::public.lead_validation_status;

-- ── Attorney capacity and assignment-summary utilities ────────────────
create or replace function public.month_start(p_value timestamptz)
returns date
language sql
stable
as $$
  select date_trunc('month', p_value)::date;
$$;

create or replace function public.refresh_attorney_capacity(
  p_attorney_id uuid default null,
  p_period_month date default date_trunc('month', now())::date
)
returns void
language plpgsql
as $$
begin
  insert into public.attorney_capacity (
    attorney_id,
    period_month,
    lead_cap,
    assigned_count,
    is_paused
  )
  select
    ap.id,
    date_trunc('month', p_period_month)::date,
    coalesce(ap.monthly_lead_cap, ap.max_leads_per_month),
    count(la.id)::integer,
    false
  from public.attorney_partners ap
  left join public.lead_assignments la
    on la.attorney_id = ap.id
   and la.assigned_at >= date_trunc('month', p_period_month)::date
   and la.assigned_at < (date_trunc('month', p_period_month)::date + interval '1 month')
  where p_attorney_id is null
     or ap.id = p_attorney_id
  group by ap.id, ap.monthly_lead_cap, ap.max_leads_per_month
  on conflict (attorney_id, period_month) do update
  set
    lead_cap = excluded.lead_cap,
    assigned_count = excluded.assigned_count,
    updated_at = now();

  update public.attorney_partners ap
  set current_month_lead_count = coalesce(ac.assigned_count, 0)
  from public.attorney_capacity ac
  where ac.attorney_id = ap.id
    and ac.period_month = date_trunc('month', now())::date
    and (p_attorney_id is null or ap.id = p_attorney_id);
end;
$$;

create or replace function public.refresh_lead_assignment_summary(p_lead_id uuid)
returns void
language plpgsql
as $$
begin
  if p_lead_id is null then
    return;
  end if;

  update public.leads l
  set
    assigned_at = summary.first_assigned_at,
    forwarded_at = summary.last_forwarded_at,
    intake_status = case
      when summary.last_forwarded_at is not null then 'forwarded'::public.lead_intake_status
      when summary.first_assigned_at is not null
        and l.intake_status in (
          'received'::public.lead_intake_status,
          'validated'::public.lead_intake_status,
          'queued'::public.lead_intake_status,
          'processing'::public.lead_intake_status
        ) then 'assigned'::public.lead_intake_status
      else l.intake_status
    end
  from (
    select
      min(assigned_at) as first_assigned_at,
      max(forwarded_at) as last_forwarded_at
    from public.lead_assignments
    where lead_id = p_lead_id
  ) summary
  where l.id = p_lead_id;
end;
$$;

create or replace function public.sync_assignment_rollups()
returns trigger
language plpgsql
as $$
declare
  old_month date;
  new_month date;
begin
  if tg_op = 'DELETE' then
    old_month := public.month_start(coalesce(old.assigned_at, now()));
    perform public.refresh_attorney_capacity(old.attorney_id, old_month);
    perform public.refresh_lead_assignment_summary(old.lead_id);
    return null;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_month := public.month_start(coalesce(new.assigned_at, now()));
    perform public.refresh_attorney_capacity(new.attorney_id, new_month);
    perform public.refresh_lead_assignment_summary(new.lead_id);
  end if;

  if tg_op = 'UPDATE' then
    old_month := public.month_start(coalesce(old.assigned_at, now()));
    if old.attorney_id is distinct from new.attorney_id
       or old_month is distinct from new_month then
      perform public.refresh_attorney_capacity(old.attorney_id, old_month);
    end if;

    if old.lead_id is distinct from new.lead_id then
      perform public.refresh_lead_assignment_summary(old.lead_id);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists lead_assignments_sync_rollups on public.lead_assignments;
drop trigger if exists lead_assignments_sync_rollups_insert on public.lead_assignments;
drop trigger if exists lead_assignments_sync_rollups_update on public.lead_assignments;
drop trigger if exists lead_assignments_sync_rollups_delete on public.lead_assignments;

create trigger lead_assignments_sync_rollups_insert
  after insert on public.lead_assignments
  for each row execute function public.sync_assignment_rollups();

create trigger lead_assignments_sync_rollups_update
  after update of attorney_id, lead_id, assigned_at, forwarded_at, assignment_status
  on public.lead_assignments
  for each row execute function public.sync_assignment_rollups();

create trigger lead_assignments_sync_rollups_delete
  after delete on public.lead_assignments
  for each row execute function public.sync_assignment_rollups();

select public.refresh_attorney_capacity(null, date_trunc('month', now())::date);

with assignment_leads as (
  select distinct lead_id
  from public.lead_assignments
  where lead_id is not null
)
select public.refresh_lead_assignment_summary(lead_id)
from assignment_leads;

-- ── Repeatable backfill from legacy activity to canonical events ───────
create or replace function public.backfill_lead_events_from_activity()
returns integer
language plpgsql
as $$
declare
  inserted_count integer;
begin
  with inserted as (
    insert into public.lead_events (
      lead_id,
      event_type,
      event_source,
      actor_type,
      actor_id,
      metadata,
      created_at
    )
    select
      la.lead_id,
      la.action::text,
      'legacy_lead_activity',
      case when la.performed_by is null then 'system' else 'admin' end,
      la.performed_by,
      coalesce(la.details, '{}'::jsonb),
      coalesce(la.created_at, now())
    from public.lead_activity la
    where la.lead_id is not null
      and not exists (
        select 1
        from public.lead_events le
        where le.lead_id = la.lead_id
          and le.event_type = la.action::text
          and le.event_source = 'legacy_lead_activity'
          and le.created_at = coalesce(la.created_at, now())
      )
    returning 1
  )
  select count(*) into inserted_count
  from inserted;

  return inserted_count;
end;
$$;

select public.backfill_lead_events_from_activity();

-- ── Queue/message leasing helpers for retry-safe workers ───────────────
create or replace function public.claim_backend_jobs(
  p_job_type text default null,
  p_limit integer default 10,
  p_locked_by text default 'database-worker'
)
returns setof public.backend_jobs
language sql
as $$
  with candidates as (
    select id
    from public.backend_jobs
    where status in ('queued'::public.queue_job_status, 'failed'::public.queue_job_status)
      and run_after <= now()
      and attempts < max_attempts
      and (locked_at is null or locked_at < now() - interval '15 minutes')
      and (p_job_type is null or job_type = p_job_type)
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 100))
  )
  update public.backend_jobs bj
  set
    status = 'processing'::public.queue_job_status,
    locked_at = now(),
    locked_by = coalesce(nullif(p_locked_by, ''), 'database-worker'),
    attempts = attempts + 1,
    updated_at = now()
  from candidates
  where bj.id = candidates.id
  returning bj.*;
$$;

create or replace function public.complete_backend_job(
  p_job_id uuid,
  p_payload jsonb default null
)
returns public.backend_jobs
language sql
as $$
  update public.backend_jobs
  set
    status = 'completed'::public.queue_job_status,
    locked_at = null,
    locked_by = null,
    last_error = null,
    payload = coalesce(p_payload, payload),
    updated_at = now()
  where id = p_job_id
  returning *;
$$;

create or replace function public.fail_backend_job(
  p_job_id uuid,
  p_error text,
  p_retry_after interval default interval '15 minutes'
)
returns public.backend_jobs
language sql
as $$
  update public.backend_jobs
  set
    status = 'failed'::public.queue_job_status,
    locked_at = null,
    locked_by = null,
    last_error = left(coalesce(p_error, 'job failed'), 2000),
    run_after = case
      when attempts >= max_attempts then now() + interval '100 years'
      else now() + coalesce(p_retry_after, interval '15 minutes')
    end,
    updated_at = now()
  where id = p_job_id
  returning *;
$$;

create or replace function public.claim_outbound_messages(
  p_limit integer default 10,
  p_locked_by text default 'database-worker'
)
returns setof public.outbound_messages
language sql
as $$
  with candidates as (
    select id
    from public.outbound_messages
    where delivery_status in (
        'queued'::public.outbound_delivery_status,
        'failed'::public.outbound_delivery_status
      )
      and next_attempt_at <= now()
      and (locked_at is null or locked_at < now() - interval '15 minutes')
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 100))
  )
  update public.outbound_messages om
  set
    delivery_status = 'sending'::public.outbound_delivery_status,
    locked_at = now(),
    locked_by = coalesce(nullif(p_locked_by, ''), 'database-worker'),
    attempt_count = attempt_count + 1,
    error_message = null,
    updated_at = now()
  from candidates
  where om.id = candidates.id
  returning om.*;
$$;

create or replace function public.mark_outbound_message_sent(
  p_message_id uuid,
  p_provider_message_id text default null
)
returns public.outbound_messages
language sql
as $$
  update public.outbound_messages
  set
    delivery_status = 'sent'::public.outbound_delivery_status,
    provider_message_id = coalesce(p_provider_message_id, provider_message_id),
    sent_at = coalesce(sent_at, now()),
    error_message = null,
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_message_id
  returning *;
$$;

create or replace function public.mark_outbound_message_failed(
  p_message_id uuid,
  p_error text,
  p_retry_after interval default interval '30 minutes'
)
returns public.outbound_messages
language sql
as $$
  update public.outbound_messages
  set
    delivery_status = 'failed'::public.outbound_delivery_status,
    error_message = left(coalesce(p_error, 'message send failed'), 2000),
    next_attempt_at = now() + coalesce(p_retry_after, interval '30 minutes'),
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_message_id
  returning *;
$$;

revoke all on function public.claim_backend_jobs(text, integer, text) from public, anon, authenticated;
revoke all on function public.complete_backend_job(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fail_backend_job(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.claim_outbound_messages(integer, text) from public, anon, authenticated;
revoke all on function public.mark_outbound_message_sent(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_outbound_message_failed(uuid, text, interval) from public, anon, authenticated;

grant execute on function public.claim_backend_jobs(text, integer, text) to service_role;
grant execute on function public.complete_backend_job(uuid, jsonb) to service_role;
grant execute on function public.fail_backend_job(uuid, text, interval) to service_role;
grant execute on function public.claim_outbound_messages(integer, text) to service_role;
grant execute on function public.mark_outbound_message_sent(uuid, text) to service_role;
grant execute on function public.mark_outbound_message_failed(uuid, text, interval) to service_role;

-- ── Performance indexes for queue/admin surfaces ───────────────────────
create index if not exists backend_jobs_type_ready_idx
  on public.backend_jobs (job_type, status, run_after, created_at)
  where status in ('queued','failed');

create index if not exists outbound_messages_attorney_created_at_idx
  on public.outbound_messages (attorney_id, created_at desc)
  where attorney_id is not null;

create index if not exists audit_logs_metadata_lead_id_idx
  on public.audit_logs ((metadata->>'lead_id'), created_at desc)
  where metadata ? 'lead_id';

-- Rollback notes:
-- - Drop triggers first: leads_set_normalized_fields and
--   lead_assignments_sync_rollups.
-- - Then drop the helper functions and added indexes.
-- - This migration does not remove tables or legacy columns.
