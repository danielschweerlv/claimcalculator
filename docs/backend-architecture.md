# ClaimCalculator.ai Backend Architecture

Last updated: 2026-05-02

## Posture

This backend is a Supabase-first serverless system. Supabase Postgres remains
the source of truth, and Supabase Edge Functions are the API/workflow layer.
There is no separate monolith server.

The upgrade is intentionally additive. Existing tables and frontend contracts
remain live while normalized tables, event logs, audit logs, and retryable
outbound messaging are introduced beside them.

## Current Compatibility Layer

These legacy/current surfaces remain supported:

- Public intake calls `submit-lead`.
- Admin dashboard reads and writes `leads`, `attorney_partners`,
  `lead_assignments`, and `lead_activity` directly under RLS.
- `attorney_partners.firm_name`, `price_per_lead`, `max_leads_per_month`,
  `case_types_accepted`, and `zip_codes_covered` remain available.
- `lead_activity` remains readable for the existing admin timeline.

## New Data Model

`20260502224537_backend_architecture_upgrade.sql` adds:

- `lead_events`: canonical append-only lead timeline.
- `audit_logs`: append-only sensitive admin action log.
- `attorney_case_types`: normalized attorney case-type acceptance.
- `attorney_coverage`: normalized state/ZIP/county coverage.
- `attorney_capacity`: monthly cap, pause, and assigned-count data.
- `routing_rules`: admin-managed routing rules.
- `outbound_messages`: durable Resend/email delivery log with idempotency and
  retry state.
- `backend_jobs`: queue-like table for retryable backend work.

It also extends:

- `leads` with intake, validation, duplicate, normalized case/ZIP/state,
  attribution, IP hash, assignment, and forwarding fields.
- `attorney_partners` with priority, auto-forward, current-month count, and
  compatibility fields for future naming.
- `lead_assignments` with assignment status, routing reason, and forwarded
  timestamp.

`20260503084822_backend_database_utilities.sql` adds database utility functions
and triggers for:

- Normalizing lead source, case type, ZIP, state, and validation status.
- Refreshing attorney capacity and lead assignment summaries.
- Backfilling legacy `lead_activity` rows into `lead_events`.
- Claiming/completing/failing `backend_jobs` safely.
- Claiming and marking outbound messages for retry-safe workers.

## Edge Functions

Public:

- `submit-lead`: validates the calculator payload, rate-limits by hashed IP,
  inserts the lead, writes `lead_activity` and `lead_events`, queues routing
  work, records outbound notification, and returns the existing
  `{ leadId, estimate }` response.

Admin/internal:

- `match-attorneys`: ranks candidate attorneys for a lead using active status,
  case type, coverage, capacity, priority, and auto-forward settings.
- `process-lead-routing`: can process a single `leadId` or claim queued
  `backend_jobs`; it applies active `routing_rules`, chooses the best eligible
  attorney, creates or reuses an assignment, refreshes rollups, logs timeline
  events, completes/fails jobs, and optionally queues forwarding.
- `admin-assign-lead`: manual admin override for assigning a lead to an
  attorney; refreshes assignment/capacity rollups and writes audit logs.
- `forward-lead`: creates an idempotent outbound attorney-forward message and
  can process it immediately.
- `process-outbound-queue`: claims queued/failed outbound messages and processes
  them safely.
- `retry-message`: lets an admin retry a failed outbound message.
- `update-attorney-profile`: admin-only attorney profile update that writes both
  compatibility fields and normalized tables.

## Frontend Changes Required

None are required immediately for the public calculator. Its existing
`submit-lead` response remains `{ leadId, estimate }`.

The current admin dashboard can keep using direct table reads/writes during the
transition. To take advantage of the upgraded backend, the admin UI should move
these flows to Edge Functions when ready:

- Read timelines from `lead_events` instead of only `lead_activity`.
- Show outbound email history from `outbound_messages`.
- Show audit history from `audit_logs`.
- Move manual assignment to `admin-assign-lead`.
- Move attorney CRUD to `update-attorney-profile`.
- Use `match-attorneys` in `AssignLeadModal` instead of client-side filtering.
- Add controls for normalized coverage, case types, pause state, caps,
  auto-forward, and routing rules.

## Testing Checklist

Local/code:

- Run Deno tests for shared function modules.
- Run `npm run build`.
- Run targeted ESLint for touched frontend files if frontend changes are made.
- Run `supabase db push --dry-run` before applying migrations to production.

Production validation:

- Submit a lead through the public calculator and confirm the existing response
  shape.
- Confirm rows in `leads`, `lead_activity`, `lead_events`, `backend_jobs`, and
  `outbound_messages`.
- Confirm no raw IP address is stored.
- Confirm invalid submissions still return `{ "error": "invalid submission" }`
  without Zod issues.
- Run `match-attorneys` for the smoke lead.
- Run `process-lead-routing` with a direct `leadId`.
- Run `process-lead-routing` without `leadId` and confirm it claims a queued
  `backend_jobs` row.
- Run `admin-assign-lead` with a test attorney and confirm assignment, lead
  status, `lead_events`, and `audit_logs`.
- Run `forward-lead` or `process-outbound-queue` and confirm
  `outbound_messages.delivery_status`, assignment `forwarded_at`, and lead
  `forwarded_at`.
- Clean up smoke-test data only after confirming evidence.

## Rollback Notes

This upgrade is additive. If production rollback is needed, stop
deploying/invoking new Edge Functions first. Keep compatibility columns and
legacy tables until the frontend is fully migrated. Do not drop `lead_activity`,
old attorney array fields, or existing assignment/payout fields during this
transition.
