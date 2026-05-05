# Testing Guidelines

## Current State

The backend has Deno tests for shared settlement, schema, mapper, and rate-limit
logic. Frontend testing is currently lint/build plus browser or device smoke
checks.

```bash
npm run lint
npm run build
deno check supabase/functions/*/index.ts
deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts
```

## What to Test Before Any PR

### Settlement Calculator (`src/lib/calc-settlement.js`)

This is the most critical path. Manually verify:

- `withAvg` is always >= 4.5x `withoutAvg` (structural retune constraint)
- `estimated_value_low` = withoutAvg midpoint
- `estimated_value_high` = withAvg midpoint
- All case types return non-zero estimates

### Lead Submission Flow

- Happy path: valid form → 200 response with `leadId` + `estimate`
- Honeypot trip: non-empty `website` field → 400
- Rate limit: >5 submissions same IP within an hour → 429
- Non-NV zip: accepted, `notes` column = `'non-NV zip'`
- Invalid schema: missing required fields → 400 with
  `{ "error": "invalid submission" }` only (no Zod issues)

### Edge Function Local Testing

```bash
supabase functions serve
curl -X POST http://localhost:54321/functions/v1/submit-lead \
  -H "Content-Type: application/json" \
  -d '{ ...payload }'
```

## Adding Tests

If adding a test runner, prefer **Vitest** (already aligned with Vite). Place
unit tests next to the file they test (`calc-settlement.test.js` beside
`calc-settlement.js`).

For edge function tests, use Deno's built-in test runner (`deno test`).

## Backend Upgrade Verification Checklist

Run this checklist after applying database migrations and deploying Edge
Functions. Use clearly marked smoke data and clean it up only after evidence is
captured.

### submit-lead

- Valid calculator payload returns HTTP 200 with `{ leadId, estimate }`.
- `leads` row has normalized fields: `intake_status`, `validation_status`,
  `normalized_case_type`, `normalized_zip`, `state`, `ip_hash`, `duplicate_key`.
- `lead_activity` has a `created` row.
- `lead_events` has a `created` event and, when email sends, an outbound event.
- `backend_jobs` has a `process_lead_routing` job for the lead.
- `outbound_messages` has an `internal_notification` row when `RESEND_API_KEY`
  is configured.
- Invalid payload returns `{ "error": "invalid submission" }` without Zod
  details.

### attorney matching

- `match-attorneys` requires admin or internal auth.
- Matching attorney appears eligible when active, case type matches, coverage
  matches, and capacity is available.
- Paused or capped attorneys are returned with exclusion reasons.
- Legacy arrays and normalized tables both remain usable during transition.

### routing and queue processing

- `process-lead-routing` with `{ leadId }` creates or reuses a
  `lead_assignments` row.
- `process-lead-routing` without `leadId` claims queued `backend_jobs` rows and
  marks them completed or failed.
- Matching `routing_rules` can force manual review or target an eligible
  attorney.
- Lead timeline records `routing_assigned`, `routing_no_match`, or
  `routing_manual_review`.
- Attorney capacity and lead assignment summary fields are refreshed.

### forwarding and outbound retry

- `forward-lead` creates one idempotent `outbound_messages` row per
  assignment/template.
- `process-outbound-queue` claims queued/failed messages and does not
  double-send already sent messages.
- Successful attorney forwarding sets
  `outbound_messages.delivery_status = 'sent'`.
- Successful attorney forwarding updates assignment/lead `forwarded_at`.
- `retry-message` resets a failed message and writes an audit log.

### audit logs and admin override

- `admin-assign-lead` creates or reuses a lead assignment.
- Lead status becomes `sent_to_attorney`; intake status becomes `assigned`.
- `lead_events` and `lead_activity` include `assigned_to_attorney`.
- `audit_logs` includes assignment create/reuse with actor and metadata.
- Cleanup removes only smoke artifacts and confirms zero remaining smoke rows.
