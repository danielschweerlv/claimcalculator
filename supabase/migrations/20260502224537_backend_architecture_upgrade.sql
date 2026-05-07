-- Backend architecture upgrade.
--
-- This is an in-place production upgrade. Keep existing tables and UI-facing
-- columns intact, add normalized/event-driven structures beside them, and
-- backfill from current data where possible.

-- ── Extensions ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp" with schema extensions;

-- ── Enums ──────────────────────────────────────────────────────────────
do $$ begin
  create type public.lead_intake_status as enum ('received','validated','queued','processing','assigned','forwarded','manual_review','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_validation_status as enum ('pending','valid','invalid','duplicate','spam','manual_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.routing_route_mode as enum ('manual','best_match','round_robin_ready');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_status as enum ('pending','assigned','forwarded','accepted','rejected','converted','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.outbound_delivery_status as enum ('queued','sending','sent','failed','delivered','bounced','skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.outbound_message_type as enum ('internal_notification','attorney_forward','admin_notification','retry_notice');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.queue_job_status as enum ('queued','processing','completed','failed','cancelled');
exception when duplicate_object then null; end $$;

-- ── Generic timestamp trigger ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Append-only guard for event/audit tables ───────────────────────────
create or replace function public.prevent_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

-- ── leads compatibility extensions ─────────────────────────────────────
alter table public.leads
  add column if not exists intake_status public.lead_intake_status not null default 'received',
  add column if not exists source text,
  add column if not exists gclid text,
  add column if not exists click_id text,
  add column if not exists ip_hash text,
  add column if not exists duplicate_key text,
  add column if not exists spam_score numeric(5,2) not null default 0,
  add column if not exists validation_status public.lead_validation_status not null default 'pending',
  add column if not exists normalized_case_type text,
  add column if not exists normalized_zip text,
  add column if not exists state text,
  add column if not exists consent_to_contact boolean,
  add column if not exists preferred_contact_method text,
  add column if not exists assigned_at timestamptz,
  add column if not exists forwarded_at timestamptz;

update public.attorney_partners
set
  case_types_accepted = coalesce(case_types_accepted, array['motor_vehicle'::public.case_type]),
  zip_codes_covered = coalesce(zip_codes_covered, array[]::text[]),
  price_per_lead = coalesce(price_per_lead, 2000)
where case_types_accepted is null
   or zip_codes_covered is null
   or price_per_lead is null;

update public.lead_assignments
set
  outcome = coalesce(outcome, 'pending'::public.assignment_outcome),
  payout_status = coalesce(payout_status, 'unpaid'::public.payout_status)
where outcome is null
   or payout_status is null;

update public.lead_activity
set details = '{}'::jsonb
where details is null;

alter table public.leads
  add constraint leads_spam_score_range
  check (spam_score >= 0 and spam_score <= 100)
  not valid;

alter table public.leads
  add constraint leads_state_format
  check (state is null or state ~ '^[A-Z]{2}$')
  not valid;

update public.leads
set
  source = coalesce(source, utm_source, 'website'),
  normalized_case_type = coalesce(normalized_case_type, case_type::text),
  normalized_zip = coalesce(normalized_zip, zip_code),
  state = coalesce(state, case when zip_code ~ '^(889|890|891|893|894|895|897|898)' then 'NV' end),
  validation_status = case
    when validation_status = 'pending' and notes = 'non-NV zip' then 'manual_review'::public.lead_validation_status
    when validation_status = 'pending' then 'valid'::public.lead_validation_status
    else validation_status
  end,
  intake_status = case
    when status = 'sent_to_attorney' then 'assigned'::public.lead_intake_status
    when status = 'converted' then 'forwarded'::public.lead_intake_status
    else intake_status
  end
where true;

create index if not exists leads_intake_status_created_at_idx
  on public.leads (intake_status, created_at desc);
create index if not exists leads_validation_status_created_at_idx
  on public.leads (validation_status, created_at desc);
create index if not exists leads_normalized_case_type_idx
  on public.leads (normalized_case_type);
create index if not exists leads_normalized_zip_idx
  on public.leads (normalized_zip);
create index if not exists leads_state_idx
  on public.leads (state);
create index if not exists leads_duplicate_key_idx
  on public.leads (duplicate_key)
  where duplicate_key is not null;
create index if not exists leads_ip_hash_created_at_idx
  on public.leads (ip_hash, created_at desc)
  where ip_hash is not null;
create index if not exists leads_status_created_at_idx
  on public.leads (status, created_at desc);
create index if not exists leads_case_type_created_at_idx
  on public.leads (case_type, created_at desc);

-- ── attorney_partners compatibility extensions ─────────────────────────
alter table public.attorney_partners
  add column if not exists firm text,
  add column if not exists priority integer not null default 0,
  add column if not exists default_price_per_lead integer,
  add column if not exists monthly_lead_cap integer,
  add column if not exists current_month_lead_count integer not null default 0,
  add column if not exists auto_forward_enabled boolean not null default false,
  add column if not exists last_assigned_at timestamptz;

update public.attorney_partners
set
  firm = coalesce(firm, firm_name),
  default_price_per_lead = coalesce(default_price_per_lead, price_per_lead),
  monthly_lead_cap = coalesce(monthly_lead_cap, max_leads_per_month)
where true;

alter table public.attorney_partners
  add constraint attorney_partners_priority_range
  check (priority >= 0)
  not valid;

alter table public.attorney_partners
  add constraint attorney_partners_monthly_cap_nonnegative
  check (monthly_lead_cap is null or monthly_lead_cap >= 0)
  not valid;

alter table public.attorney_partners
  add constraint attorney_partners_price_per_lead_nonnegative
  check (price_per_lead is null or price_per_lead >= 0)
  not valid;

alter table public.attorney_partners
  add constraint attorney_partners_max_leads_positive
  check (max_leads_per_month is null or max_leads_per_month > 0)
  not valid;

create index if not exists attorney_partners_active_priority_idx
  on public.attorney_partners (is_active, priority desc, last_assigned_at asc nulls first);
create index if not exists attorney_partners_active_name_idx
  on public.attorney_partners (is_active, name);
create index if not exists attorney_partners_case_types_gin_idx
  on public.attorney_partners using gin (case_types_accepted);
create index if not exists attorney_partners_zip_codes_gin_idx
  on public.attorney_partners using gin (zip_codes_covered);

-- ── Normalized attorney matching data ──────────────────────────────────
create table if not exists public.attorney_case_types (
  id uuid primary key default extensions.uuid_generate_v4(),
  attorney_id uuid not null references public.attorney_partners(id) on delete cascade,
  case_type public.case_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attorney_id, case_type)
);

create table if not exists public.attorney_coverage (
  id uuid primary key default extensions.uuid_generate_v4(),
  attorney_id uuid not null references public.attorney_partners(id) on delete cascade,
  state text,
  zip_code text,
  county text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state is not null or zip_code is not null or county is not null),
  check (state is null or state ~ '^[A-Z]{2}$'),
  check (zip_code is null or zip_code ~ '^\d{5}$')
);

create unique index if not exists attorney_coverage_unique_zip_idx
  on public.attorney_coverage (attorney_id, coalesce(state, ''), coalesce(zip_code, ''), coalesce(county, ''));

create table if not exists public.attorney_capacity (
  id uuid primary key default extensions.uuid_generate_v4(),
  attorney_id uuid not null references public.attorney_partners(id) on delete cascade,
  period_month date not null,
  lead_cap integer,
  assigned_count integer not null default 0,
  is_paused boolean not null default false,
  pause_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attorney_id, period_month),
  check (period_month = date_trunc('month', period_month)::date),
  check (lead_cap is null or lead_cap >= 0),
  check (assigned_count >= 0)
);

insert into public.attorney_case_types (attorney_id, case_type, is_active)
select ap.id, unnest(ap.case_types_accepted), ap.is_active
from public.attorney_partners ap
where ap.case_types_accepted is not null
on conflict (attorney_id, case_type) do update
set is_active = excluded.is_active,
    updated_at = now();

insert into public.attorney_coverage (attorney_id, state, zip_code, is_active)
select ap.id,
       case when zip.zip_code ~ '^(889|890|891|893|894|895|897|898)' then 'NV' end,
       zip.zip_code,
       ap.is_active
from public.attorney_partners ap
cross join lateral unnest(coalesce(ap.zip_codes_covered, array[]::text[])) as zip(zip_code)
where zip.zip_code ~ '^\d{5}$'
on conflict do nothing;

insert into public.attorney_capacity (attorney_id, period_month, lead_cap, assigned_count, is_paused)
select
  ap.id,
  date_trunc('month', now())::date,
  coalesce(ap.monthly_lead_cap, ap.max_leads_per_month),
  count(la.id)::integer,
  false
from public.attorney_partners ap
left join public.lead_assignments la
  on la.attorney_id = ap.id
 and la.assigned_at >= date_trunc('month', now())
group by ap.id, ap.monthly_lead_cap, ap.max_leads_per_month
on conflict (attorney_id, period_month) do update
set lead_cap = excluded.lead_cap,
    assigned_count = greatest(public.attorney_capacity.assigned_count, excluded.assigned_count),
    updated_at = now();

create index if not exists attorney_case_types_lookup_idx
  on public.attorney_case_types (case_type, is_active, attorney_id);
create index if not exists attorney_coverage_state_lookup_idx
  on public.attorney_coverage (state, is_active, attorney_id);
create index if not exists attorney_coverage_zip_lookup_idx
  on public.attorney_coverage (zip_code, is_active, attorney_id);
create index if not exists attorney_capacity_lookup_idx
  on public.attorney_capacity (period_month, is_paused, attorney_id);

-- ── Routing rules ──────────────────────────────────────────────────────
create table if not exists public.routing_rules (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  is_active boolean not null default true,
  case_type public.case_type,
  state text,
  zip_code text,
  min_score numeric(5,2),
  priority integer not null default 0,
  route_mode public.routing_route_mode not null default 'best_match',
  target_attorney_id uuid references public.attorney_partners(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state is null or state ~ '^[A-Z]{2}$'),
  check (zip_code is null or zip_code ~ '^\d{5}$'),
  check (min_score is null or (min_score >= 0 and min_score <= 100)),
  check (priority >= 0)
);

create index if not exists routing_rules_active_lookup_idx
  on public.routing_rules (is_active, priority desc, case_type, state, zip_code);

-- ── lead_assignments compatibility extensions ──────────────────────────
alter table public.lead_assignments
  add column if not exists routing_reason text,
  add column if not exists assignment_status public.assignment_status not null default 'pending',
  add column if not exists forwarded_at timestamptz;

alter table public.lead_assignments
  add constraint lead_assignments_payout_amount_nonnegative
  check (payout_amount is null or payout_amount >= 0)
  not valid;

update public.lead_assignments
set assignment_status = case
  when payout_status = 'paid' then 'converted'::public.assignment_status
  when outcome = 'converted' then 'converted'::public.assignment_status
  when outcome = 'accepted' then 'accepted'::public.assignment_status
  when outcome = 'rejected' then 'rejected'::public.assignment_status
  else assignment_status
end
where true;

create index if not exists lead_assignments_status_assigned_at_idx
  on public.lead_assignments (assignment_status, assigned_at desc);
create index if not exists lead_assignments_payout_status_date_idx
  on public.lead_assignments (payout_status, payout_date desc);
create index if not exists lead_assignments_outcome_assigned_at_idx
  on public.lead_assignments (outcome, assigned_at desc);
create index if not exists lead_activity_lead_id_created_at_idx
  on public.lead_activity (lead_id, created_at desc);
create index if not exists lead_activity_action_created_at_idx
  on public.lead_activity (action, created_at desc);

-- ── Canonical lead events ──────────────────────────────────────────────
create table if not exists public.lead_events (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  event_source text not null default 'system',
  actor_type text not null default 'system',
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.lead_events (lead_id, event_type, event_source, actor_type, actor_id, metadata, created_at)
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
    select 1 from public.lead_events le
    where le.lead_id = la.lead_id
      and le.event_type = la.action::text
      and le.created_at = coalesce(la.created_at, now())
      and le.event_source = 'legacy_lead_activity'
  );

create index if not exists lead_events_lead_id_created_at_idx
  on public.lead_events (lead_id, created_at desc);
create index if not exists lead_events_type_created_at_idx
  on public.lead_events (event_type, created_at desc);
create index if not exists lead_events_actor_idx
  on public.lead_events (actor_type, actor_id)
  where actor_id is not null;

drop trigger if exists lead_events_prevent_update on public.lead_events;
create trigger lead_events_prevent_update
  before update or delete on public.lead_events
  for each row execute function public.prevent_append_only_mutation();

-- ── Outbound email/message logging ─────────────────────────────────────
create table if not exists public.outbound_messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  idempotency_key text,
  lead_id uuid references public.leads(id) on delete set null,
  assignment_id uuid references public.lead_assignments(id) on delete set null,
  attorney_id uuid references public.attorney_partners(id) on delete set null,
  message_type public.outbound_message_type not null,
  provider text not null default 'resend',
  recipient text not null,
  subject text,
  template_key text,
  provider_message_id text,
  delivery_status public.outbound_delivery_status not null default 'queued',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempt_count >= 0)
);

create unique index if not exists outbound_messages_idempotency_key_idx
  on public.outbound_messages (idempotency_key)
  where idempotency_key is not null;
create unique index if not exists outbound_messages_provider_message_id_idx
  on public.outbound_messages (provider, provider_message_id)
  where provider_message_id is not null;
create index if not exists outbound_messages_lead_created_at_idx
  on public.outbound_messages (lead_id, created_at desc);
create index if not exists outbound_messages_status_created_at_idx
  on public.outbound_messages (delivery_status, created_at);
create index if not exists outbound_messages_ready_idx
  on public.outbound_messages (delivery_status, next_attempt_at, created_at)
  where delivery_status in ('queued','failed');

-- ── Admin audit logs ───────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_created_at_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_created_at_idx
  on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

drop trigger if exists audit_logs_prevent_update on public.audit_logs;
create trigger audit_logs_prevent_update
  before update or delete on public.audit_logs
  for each row execute function public.prevent_append_only_mutation();

-- ── Queue-like jobs table ──────────────────────────────────────────────
create table if not exists public.backend_jobs (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_type text not null,
  status public.queue_job_status not null default 'queued',
  lead_id uuid references public.leads(id) on delete set null,
  assignment_id uuid references public.lead_assignments(id) on delete set null,
  outbound_message_id uuid references public.outbound_messages(id) on delete set null,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempts >= 0),
  check (max_attempts > 0)
);

create index if not exists backend_jobs_ready_idx
  on public.backend_jobs (status, run_after, created_at)
  where status in ('queued','failed');
create index if not exists backend_jobs_lead_idx
  on public.backend_jobs (lead_id, created_at desc)
  where lead_id is not null;

-- ── updated_at triggers ────────────────────────────────────────────────
drop trigger if exists attorney_partners_set_updated_at on public.attorney_partners;
create trigger attorney_partners_set_updated_at
  before update on public.attorney_partners
  for each row execute function public.set_updated_at();

drop trigger if exists attorney_case_types_set_updated_at on public.attorney_case_types;
create trigger attorney_case_types_set_updated_at
  before update on public.attorney_case_types
  for each row execute function public.set_updated_at();

drop trigger if exists attorney_coverage_set_updated_at on public.attorney_coverage;
create trigger attorney_coverage_set_updated_at
  before update on public.attorney_coverage
  for each row execute function public.set_updated_at();

drop trigger if exists attorney_capacity_set_updated_at on public.attorney_capacity;
create trigger attorney_capacity_set_updated_at
  before update on public.attorney_capacity
  for each row execute function public.set_updated_at();

drop trigger if exists routing_rules_set_updated_at on public.routing_rules;
create trigger routing_rules_set_updated_at
  before update on public.routing_rules
  for each row execute function public.set_updated_at();

drop trigger if exists outbound_messages_set_updated_at on public.outbound_messages;
create trigger outbound_messages_set_updated_at
  before update on public.outbound_messages
  for each row execute function public.set_updated_at();

drop trigger if exists backend_jobs_set_updated_at on public.backend_jobs;
create trigger backend_jobs_set_updated_at
  before update on public.backend_jobs
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.attorney_case_types enable row level security;
alter table public.attorney_coverage enable row level security;
alter table public.attorney_capacity enable row level security;
alter table public.routing_rules enable row level security;
alter table public.lead_events enable row level security;
alter table public.outbound_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.backend_jobs enable row level security;

drop policy if exists attorney_case_types_admin_all on public.attorney_case_types;
create policy attorney_case_types_admin_all on public.attorney_case_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists attorney_coverage_admin_all on public.attorney_coverage;
create policy attorney_coverage_admin_all on public.attorney_coverage
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists attorney_capacity_admin_all on public.attorney_capacity;
create policy attorney_capacity_admin_all on public.attorney_capacity
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists routing_rules_admin_all on public.routing_rules;
create policy routing_rules_admin_all on public.routing_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists lead_events_admin_select on public.lead_events;
create policy lead_events_admin_select on public.lead_events
  for select to authenticated using (public.is_admin());

drop policy if exists lead_events_admin_insert on public.lead_events;
create policy lead_events_admin_insert on public.lead_events
  for insert to authenticated with check (public.is_admin());

drop policy if exists outbound_messages_admin_select on public.outbound_messages;
create policy outbound_messages_admin_select on public.outbound_messages
  for select to authenticated using (public.is_admin());

drop policy if exists outbound_messages_admin_update on public.outbound_messages;
create policy outbound_messages_admin_update on public.outbound_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated using (public.is_admin());

drop policy if exists backend_jobs_admin_select on public.backend_jobs;
create policy backend_jobs_admin_select on public.backend_jobs
  for select to authenticated using (public.is_admin());

-- Rollback notes:
-- - This migration is additive. If rollback is needed, stop new edge-function
--   deployments first, then drop the new policies/tables/enums in reverse
--   dependency order after confirming no production workflow depends on them.
-- - Do not drop compatibility columns or legacy lead_activity until the admin UI
--   has fully moved to lead_events/outbound_messages/audit_logs.
