-- Align admin workflow UI with the database contract.
-- The admin dashboard records assignment, outcome, and payout events that were
-- added after the baseline activity enum.

alter type public.activity_type add value if not exists 'assigned_to_attorney';
alter type public.activity_type add value if not exists 'outcome_changed';
alter type public.activity_type add value if not exists 'payout_status_changed';

alter table public.lead_assignments
  add column if not exists assigned_by uuid references auth.users(id);

create index if not exists lead_assignments_lead_id_assigned_at_idx
  on public.lead_assignments (lead_id, assigned_at desc);

create index if not exists lead_assignments_attorney_id_assigned_at_idx
  on public.lead_assignments (attorney_id, assigned_at desc);
