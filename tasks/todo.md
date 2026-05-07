# ClaimCalculator.ai — Task Tracker

## Done This Session (2026-04-21, wrap 3)

- [x] Removed Zod issues payload from `submit-lead` validation error log — redeployed as v13 (`a797f4d`)
- [x] Deleted 8 stale remote branches (claude/*, feat/*, text/*)
- [x] Deleted orphaned `notify-new-lead` Supabase function
- [x] Fixed hero left panel blank on load (`c12180b`) — React 19 StrictMode + lazy/Suspense caused IntersectionObserver to miss above-fold `AnimatedGroup`; added `animateOnMount` prop
- [x] Deleted `feature/homepage-redesign` worktree + local branch (gold scheme rejected, never pushed)

## Done This Session (2026-04-30, setup continuation)

- [x] Canonicalized ClaimCalculator path in global context and project-local context: `/Users/daniel/Desktop/Claude Attic/antigrav-claimcalc/antigrav-claimcalc`
- [x] Added project-local `AGENTS.md` and `.agents/product-marketing-context.md`
- [x] Added docs for API standards, deployment rules, and testing guidelines
- [x] Found admin workflow/schema drift: assignment UI wrote `status` to `lead_assignments`, but schema uses `outcome`
- [x] Added migration `0004_admin_workflow_compat.sql` for admin activity enum values and `assigned_by`
- [x] Updated assignment insert to write `outcome: 'pending'`
- [x] Applied `0004_admin_workflow_compat.sql` to production Supabase project `uawtkzzyeydfgnpiaqfb`
- [x] Verified production lead submission through `submit-lead` v14 and confirmed lead/activity/rate-limit rows plus edge-function 200 log
- [x] Ran admin workflow smoke with a temporary admin and attorney: view lead, assign attorney, change outcome, update payout, confirm activity log
- [x] Cleaned up all smoke-test records: lead, activity, assignment, attorney, temporary admin profile/auth user, and matching rate-limit row
- [x] Confirmed `submit-lead` redeploy was not needed because no function files changed and deployed v14 was already active with `verify_jwt=false`
- [x] Defined and completed first aesthetics-polish target: mobile width containment on public header, home hero copy, and calculator intro/card spacing
- [x] Ran production `submit-lead` mobile-user-agent smoke through the live edge function; HTTP 200 returned a lead ID and server estimate
- [x] Cleaned up the mobile smoke artifacts: lead, created activity row, and matching rate-limit row; follow-up lead query returned 0 matching rows
- [x] Completed second narrow mobile polish pass on `/calculator`: fixed fixed-header spacing, restored intro mount animation, tightened title/body wrapping, constrained the form/card width, and reduced phone card padding
- [x] Verified `npm run build`, targeted public mobile lint, and Deno shared-function tests after the pass

## Done This Session (2026-05-03, wrap push)

- [x] Read global/project setup context and verified ClaimCalculator canonical path, RepDoctors context, CFN context, and lightweight memory loop
- [x] Updated global durable context so ClaimCalculator is described as an existing backend/admin system to continue, not a greenfield backend to restart
- [x] Started Vite preview bound to LAN at `http://192.168.0.90:4175/`; confirmed `/` and `/calculator` return HTTP 200
- [x] Ran `npm run build` successfully after lint cleanup
- [x] Ran `npm run lint` successfully after scoped cleanup/config updates
- [x] Ran `deno check supabase/functions/*/index.ts` successfully
- [x] Ran `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts` successfully: 14 passed
- [x] Ran `supabase db lint --linked --schema public --fail-on error`: no schema errors found
- [x] Ran `supabase db push --dry-run`: only `20260503084822_backend_database_utilities.sql` remains pending
- [x] Applied `20260503084822_backend_database_utilities.sql` to production Supabase after approval
- [x] Re-ran `supabase db push --dry-run`: remote database is up to date
- [x] Re-ran `supabase migration list`: local and remote both include `20260503084822`
- [x] Browser plugin was attempted first, but no in-app browser backend was discovered in this session; used HTTP checks plus phone-ready LAN preview instead
- [x] Vite preview reproduced the known LAN issue: `127.0.0.1` worked but `192.168.0.90` returned empty reply / connection closed
- [x] Switched to a Python static SPA fallback bound to `0.0.0.0:4175`; confirmed `http://192.168.0.90:4175/calculator` returns HTTP 200 and loads on the phone
- [x] Daniel confirmed the real-phone calculator flow/submission works
- [x] Full-project lint cleanup is no longer pending; `npm run lint` passes

## Done This Session (2026-05-03, aesthetics continuation)

- [x] Selected `/calculator` lower-page polish as the next narrow aesthetics target after real-phone calculator confirmation
- [x] Refined comparison cards into a clearer "estimate vs carrier lens" section using the existing Neon Nocturne surface hierarchy
- [x] Tightened `FaqAccordion` active state, animation cleanup, and `aria-expanded` behavior
- [x] Verified with `npm run lint` and `npm run build`
- [x] Render-checked `/calculator` through the Python static SPA fallback with Chrome screenshots at mobile and desktop widths

## Done This Session (2026-05-05, wrap)

- [x] Confirmed no process is currently listening on the prior local phone-preview port `8091`
- [x] Re-read current handoff state and preserved the dirty worktree without reverting user or prior-agent changes
- [x] Added the Vite LAN caveat and Python static preview workaround to `AGENTS.md`
- [x] Updated the implementation map to reflect the May 5 wrap state and current lint caveat

## Done This Session (2026-05-05, backend safety continuation)

- [x] Used read-only subagents for backend contract review, design-flow target selection, and dirty-tree cleanup grouping
- [x] Fixed attorney-forward email estimate formatting so lead estimate values are rendered as dollars, not cents
- [x] Added pending migration `20260505120000_backend_activity_type_compat.sql` for new routing/outbound legacy `lead_activity` actions
- [x] Verified `deno check supabase/functions/*/index.ts`
- [x] Verified `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts`: 14 passed
- [x] Verified `supabase db push --dry-run` sees exactly one pending migration: `20260505120000_backend_activity_type_compat.sql`

## Done This Session (2026-05-05, resume completion pass)

- [x] Used read-only subagents for backend deploy/JWT review, homepage design target selection, and dirty-tree grouping
- [x] Completed homepage credibility/trust spine polish under the locked Neon Nocturne / Digital Concierge direction
- [x] Replaced unsupported recognition/logo-marquee language with a safer Nevada estimate model, privacy/legal guardrails, and backend handoff trust cards
- [x] Tightened mobile containment for the hero trust bar, home explanation cards, and new credibility spine after screenshot review
- [x] Recorded the backend JWT decision in `docs/deploy.md`: keep JWT verification on for admin/internal functions; only `submit-lead` is public
- [x] Verified `npm run lint`
- [x] Verified `npm run build`
- [x] Verified `git diff --check`

## Done This Session (2026-05-05, Ruflo/backend deploy/site completion pass)

- [x] Initialized local Ruflo runtime/memory/swarm for this repo and stored the current ClaimCalculator goal
- [x] Added ignore rules for local Ruflo/Claude runtime artifacts so generated memory DBs, swarm state, and half-installed hook settings stay out of project commits
- [x] Hardened required backend writes in the deployed function suite: lead status updates, timeline/audit writes, queue inserts, outbound sent events, and attorney child-table/capacity writes now fail loudly instead of silently returning success
- [x] Applied production migration `20260505120000_backend_activity_type_compat.sql`
- [x] Verified local/remote migration parity through `20260505120000`
- [x] Deployed `submit-lead` v16 and backend upgrade functions v2: `match-attorneys`, `process-lead-routing`, `admin-assign-lead`, `forward-lead`, `process-outbound-queue`, `retry-message`, and `update-attorney-profile`
- [x] Confirmed the seven admin/internal functions reject unauthenticated requests with platform 401s
- [x] Ran a production `submit-lead` smoke; HTTP 200 returned lead `5c31d855-49f2-41e7-a551-a6f59e0a6b6d` with normalized lead fields, routing job, outbound message, hashed IP, duplicate key, and append-only events
- [x] Cleaned mutable smoke artifacts and scrubbed/rejected the smoke lead; `lead_events` remains by design because production audit events are append-only
- [x] Tightened public-site claims, deepened `/injury-values`, loosened cramped mobile card containment, and improved header/menu resource behavior
- [x] Updated API/testing docs for the multi-function backend and current Deno test coverage
- [x] Verified `npm run lint`, `npm run build`, `deno check supabase/functions/*/index.ts`, `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts`, `supabase db lint --linked --schema public --fail-on error`, and `git diff --check`
- [x] Recorded final caveats: later `supabase db push --dry-run` retry hit temporary-role auth throttling after parity was already confirmed; headless Chrome mobile screenshots remained unreliable, so real-phone QA is still the visual gate

## Done This Session (2026-05-05, authenticated backend smoke)

- [x] Confirmed `supabase functions list --project-ref uawtkzzyeydfgnpiaqfb` still shows `submit-lead` active at v16 and the backend upgrade function suite active at v2
- [x] Confirmed `supabase migration list` still shows local/remote parity through `20260505120000`
- [x] Verified `npm run lint`, `npm run build`, `deno check supabase/functions/*/index.ts`, `deno test --allow-env --allow-net supabase/functions/_shared/*.test.ts`, and `git diff --check`
- [x] Fixed the credential-safe `/tmp/claimcalc-auth-smoke.mjs` runner payload to match the deployed public `submit-lead` schema shape before rerunning it
- [x] Ran authenticated backend upgrade smoke with a real admin session: attorney profile update, lead submit, matching, routing, admin assignment, forwarding, outbound queue processing, retry, evidence reads, and mutable PII scrub
- [x] Confirmed the runner finished with append-only `lead_events`/`audit_logs` left by design and mutable PII scrubbed where admin RLS allowed

## Pending — Next Session

- [x] **Public mobile visual/LAN retest** — `/calculator` loads on a real phone through the Python static SPA fallback
- [x] **Authenticated backend upgrade smoke** — real admin-session runner exercised matching, routing, admin assign, forwarding, queue processing, retry, evidence reads, and cleanup/scrub
- [ ] **Homepage and resource-page real-phone polish retest** — confirm the revised home trust spine, header/menu, success snapshots, and `/injury-values` page on a real phone
- [ ] **Commit/PR cleanup** — review the intentionally broad dirty tree and split it into sensible commits/PRs; do not include local Ruflo runtime artifacts
