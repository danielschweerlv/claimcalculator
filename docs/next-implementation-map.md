# ClaimCalculator.ai Next Implementation Map

*Last updated: 2026-05-05*

## Current State

The repo is farther along than the old "backend/admin TBD" note suggests.

- Public calculator already calls `submit-lead`.
- Supabase migrations exist for leads, admin profiles, attorney partners, assignments, activity, RLS, and rate limiting.
- The `submit-lead` edge function validates payloads, computes server-side estimates, writes `leads`, writes `lead_activity`, rate-limits by hashed IP, accepts non-NV ZIPs with a note, and optionally sends Resend notifications.
- Admin routes already exist at `/admin`, `/admin/leads`, `/admin/attorneys`, `/admin/payouts`, and `/admin/analytics`.
- Deno tests exist for shared settlement logic, schema, mappers, and rate limiting.
- Production Supabase has migration `0004_admin_workflow_compat` applied.
- `submit-lead` is deployed as v16 with `verify_jwt=false`.
- The backend upgrade function suite is deployed as v2: `match-attorneys`, `process-lead-routing`, `admin-assign-lead`, `forward-lead`, `process-outbound-queue`, `retry-message`, and `update-attorney-profile`.
- First mobile aesthetics polish target is done: public header/logo containment, home hero copy wrapping, calculator intro wrapping, and reduced calculator card padding on phone-width viewports.
- A live production `submit-lead` smoke using a mobile Safari user agent returned HTTP 200 and a server estimate; the smoke lead, created activity, and matching rate-limit row were cleaned up afterward.
- A second narrow `/calculator` mobile polish pass is done: fixed-header spacing, intro mount animation, mobile title/body wrapping, form/card width containment, and phone card padding.
- Full-project `npm run lint` now passes after the 2026-05-03 wrap push. The cleanup used scoped ESLint config exceptions for legacy React Compiler/admin/canvas patterns plus small dead-code removals; it was not a deep React Compiler refactor.
- Vite preview reproduced the known LAN issue on 2026-05-03: `127.0.0.1:4175/calculator` worked, but `192.168.0.90:4175/calculator` returned empty reply / connection closed.
- The working phone-ready local preview path is a Python static SPA fallback bound to `0.0.0.0:4175`, then open `http://192.168.0.90:4175/` or `/calculator` on the phone.
- Browser plugin was attempted on 2026-05-03, but no Codex in-app browser backend was discovered in that session. Use real-phone QA as the source of truth.
- `20260503084822_backend_database_utilities.sql` was applied to production Supabase on 2026-05-03 after approval.
- Post-push `supabase db push --dry-run` reports the remote database is up to date, and `supabase migration list` shows local/remote parity through `20260505120000`.
- 2026-05-05 wrap check: no local preview process was listening on the previous phone-preview port. The worktree remains intentionally dirty with backend architecture/function work, admin/UI polish, docs, and migrations; inspect `git status --short` before choosing the next edit.
- 2026-05-05 completion applied `20260505120000_backend_activity_type_compat.sql` so routing/outbound functions can write compatibility rows to legacy `lead_activity`.
- 2026-05-05 continuation fixed attorney-forward email estimate formatting in `supabase/functions/_shared/outbound.ts`; lead estimates are stored as dollar-like integers, not cents.
- 2026-05-05 continuation completed the home-page credibility/trust spine polish: replaced unsupported recognition/logo-marquee language with a safer Nevada estimate model section, privacy/legal guardrails, and backend handoff trust cards.
- 2026-05-05 completion hardened required backend writes so the new functions do not report success after failed lead status, timeline/audit, queue, outbound-event, or attorney child-table writes.
- 2026-05-05 completion tightened public-site claims, deepened `/injury-values`, loosened cramped mobile card widths, and improved header resource/menu behavior.
- Backend function JWT decision: keep JWT verification enabled for the new admin/internal function suite; only `submit-lead` stays public. Internal worker calls should use a valid Supabase bearer token; add `INTERNAL_FUNCTION_SECRET` if cron/worker callers need a second shared-secret check.
- Authenticated backend upgrade smoke passed on 2026-05-05 using a real admin session after updating the external `/tmp/claimcalc-auth-smoke.mjs` runner to submit the browser-shaped public payload. The smoke exercised attorney profile update, public lead submit, attorney matching, lead routing, admin assignment, forwarding, outbound queue processing, retry, authenticated evidence reads, and mutable PII scrub. Append-only `lead_events` and `audit_logs` remain by design.

## Glaring Fix Found

The admin UI had drifted ahead of the database contract:

- `AssignLeadModal` inserted `status: 'pending'` into `lead_assignments`, but the table uses `outcome`.
- Admin activity logs used `assigned_to_attorney`, `outcome_changed`, and `payout_status_changed`, but the baseline `activity_type` enum did not include them.
- The UI sent `assigned_by`, but `lead_assignments` did not define that column.

Fix added and production-verified:

- `supabase/migrations/0004_admin_workflow_compat.sql`
- `src/components/admin/AssignLeadModal.jsx`
- `src/components/admin/ActivityLog.jsx`

## Completed Verification

- `supabase db push` applied `0004_admin_workflow_compat.sql` to project `uawtkzzyeydfgnpiaqfb`.
- Remote schema was checked for `lead_assignments.assigned_by`, new admin workflow enum values, and the new assignment indexes.
- Production `submit-lead` smoke returned HTTP 200 and created the expected lead, `created` activity, and hashed-only `rate_limits` row.
- Production mobile-user-agent `submit-lead` smoke returned HTTP 200 for lead `b76cf017-125b-4a43-b9a5-d2e3ecffeb56`; cleanup deleted 1 activity row, 1 lead row, and 1 rate-limit row, and a follow-up query returned 0 matching lead rows.
- Admin workflow smoke used a temporary admin and attorney to view a lead, assign attorney, change assignment outcome, update payout status, and confirm activity log entries.
- All smoke-test artifacts were cleaned up after confirmation.
- `npm run build` passes after the mobile containment polish.
- `npm run lint` passes as of 2026-05-03.
- `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts` passes with 14 tests.
- `deno check supabase/functions/*/index.ts` passes.
- `supabase db lint --linked --schema public --fail-on error` reports no schema errors.
- `supabase db push --dry-run` reports the remote database is up to date after applying `20260503084822_backend_database_utilities.sql`.
- `deno check supabase/functions/*/index.ts` passes after the pending activity enum compatibility migration and outbound estimate formatter fix.
- `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts` passes after the pending activity enum compatibility migration and outbound estimate formatter fix: 14 tests.
- `supabase db push` applied `20260505120000_backend_activity_type_compat.sql`; follow-up `supabase db push --dry-run` reports the remote database is up to date.
- `supabase migration list` shows local/remote parity through `20260505120000`.
- `supabase functions list --project-ref uawtkzzyeydfgnpiaqfb` shows `submit-lead` active at v16 and the backend upgrade suite active at v2.
- Production `submit-lead` smoke returned HTTP 200 for lead `5c31d855-49f2-41e7-a551-a6f59e0a6b6d` with normalized lead fields, a routing job, outbound message, hashed IP, and append-only events present.
- Production smoke cleanup deleted mutable artifacts: 1 activity row, 1 backend job, 1 outbound message, and 1 rate-limit row; the lead row was scrubbed/rejected because `lead_events` is append-only and intentionally prevents deletion.
- Unauthenticated calls to the seven admin/internal functions returned Supabase platform 401s for missing authorization headers.
- A later final `supabase db push --dry-run` retry hit Supabase CLI temporary-role auth failures and then an `ECIRCUITBREAKER` throttle. Do not treat that as schema drift; the earlier post-migration dry-run and migration list already confirmed parity through `20260505120000`.
- `http://192.168.0.90:4175/calculator` returned HTTP 200 through the Python static SPA fallback and loaded on Daniel's phone.
- Daniel confirmed the real-phone calculator flow/submission works.
- Authenticated backend upgrade smoke passed with a real admin session on 2026-05-05 after the external runner payload was corrected to match `submit-lead`'s deployed schema. The run completed attorney update, lead submit, matching, routing, admin assignment, forwarding, outbound queue processing, retry, evidence reads, and mutable PII scrub; append-only `lead_events`/`audit_logs` remain by design.
- A narrow `/calculator` lower-page aesthetics pass is done: the comparison cards now read as an "estimate vs carrier lens" section, and the FAQ accordion has cleaner active styling, exit animation, and `aria-expanded`.
- The `/calculator` aesthetics pass was verified with `npm run lint`, `npm run build`, and Chrome screenshots against the Python static SPA fallback at mobile and desktop widths.
- Headless Chrome screenshots with `--disable-gpu` initially showed blank page body until a virtual-time budget was used; dev-server logs showed React Three Fiber failing to create a WebGL context in that headless environment. Treat that as a local screenshot harness caveat unless reproduced in a real browser/device.
- 2026-05-05 final headless screenshots were still flaky for mobile proof: one pass caught the home hero after disabling the fragile above-fold animation, but `/injury-values` captures showed cropped/blank artifacts inconsistent with normal layout constraints. Real-phone QA remains the source of truth.
- Mobile screenshots were saved under `/Users/daniel/Documents/Codex/2026-04-30/resume-claimcalculator-ai-from-the-canonical-2/screenshots/`; use them as local layout evidence, not a substitute for a real phone.

## Recommended Next Order

1. Retest the polished public mobile screens on a real phone.

Check `/`, `/calculator`, and the calculator submission path. The desktop/mobile screenshot harness was useful for layout, but it is not a substitute for a real mobile device because the reported mobile issue was backend/submission-related and the WebGL/canvas background can make headless screenshots noisy.

2. Retest the polished home-page credibility spine and `/injury-values` page on a real phone.

Avoid broad redesign churn; the locked design direction is still "Neon Nocturne / Digital Concierge". The `/calculator` lower-page comparison/FAQ pass is done, and the home-page credibility spine now needs real-phone confirmation after local screenshot/build checks.

3. Retest authenticated backend upgrade smoke only after backend/schema changes.

The 2026-05-05 real-admin smoke passed. Reuse the credential-safe external runner and keep its `submit-lead` payload aligned with the browser/public schema shape before relying on it.

4. Run local verification when touching backend or public funnel files.

```bash
npm run build
npm run lint
deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts
```

5. Deploy `submit-lead` only when function code changes.

```bash
supabase functions deploy submit-lead
```

## Important Risks

- Do not expose raw Zod validation issues publicly.
- Do not reintroduce direct anonymous database writes.
- Keep settlement calculation logic synchronized between frontend and edge-function shared code.
- Treat admin activity enum additions as database migrations, not UI-only changes.
- Full-project lint passed as of the 2026-05-03 cleanup, but keep using targeted checks when touching risky areas so regressions are easy to isolate.
- Smoke tests can trigger production notifications; use clearly marked test data and clean up only after explicit confirmation.
- `lead_events` is append-only in production. Do not expect smoke cleanup to delete audit events; scrub mutable PII instead.
- `INTERNAL_FUNCTION_SECRET` was not present in `supabase secrets list` on 2026-05-05. That is acceptable while JWT remains enabled and callers use a valid bearer token, but add it before relying on secret-based internal worker calls.
