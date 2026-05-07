# ClaimCalculator.ai Agent Context

Read this before editing the ClaimCalculator.ai repo.

## Canonical Path

This nested directory is the canonical local project root:

`/Users/daniel/Desktop/Claude Attic/antigrav-claimcalc/antigrav-claimcalc`

Other observed ClaimCalculator paths may be stale clones or mirrors. Inspect before editing outside this directory.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Supabase edge functions:

```bash
supabase functions deploy submit-lead
supabase functions deploy match-attorneys
supabase functions deploy process-lead-routing
supabase functions deploy admin-assign-lead
supabase functions deploy forward-lead
supabase functions deploy process-outbound-queue
supabase functions deploy retry-message
supabase functions deploy update-attorney-profile
supabase functions serve
```

## Local Mobile Preview

Vite dev/preview can print LAN URLs that work on `127.0.0.1` but return an empty reply or connection closed on the Mac LAN IP. For real-phone UI review, prefer a production build served through a Python static SPA fallback:

```bash
npm run build
cd dist
python3 -m http.server 4175 --bind 0.0.0.0
```

If deep routes like `/calculator` need SPA fallback, use a small Python fallback server or another static server that rewrites unknown paths to `index.html`. Real-phone QA is the source of truth for mobile submission and WebGL behavior.

## Stack

- React 19 + Vite.
- Tailwind CSS.
- Radix/shadcn-style primitives.
- Framer Motion.
- React Three Fiber / Three.js for the hero animation.
- Supabase Postgres and Edge Functions.
- React Router v7.

## Architecture Rules

- All lead submissions go through the single Supabase edge function at `supabase/functions/submit-lead/`.
- Do not allow direct anonymous database writes.
- `src/lib/calc-settlement.js` is shared by the frontend and edge function; keep it shared.
- `src/lib/submit-lead.js` owns form-key to database-schema mapping.
- Public validation errors must not expose raw Zod issues.
- Admin routes now exist for leads, attorneys, payouts, and analytics. Preserve their Supabase RLS/auth boundaries and keep workflow enum/database changes in migrations.

## Current Backend Boundary

As of 2026-05-05, production Supabase is migrated through
`20260505120000_backend_activity_type_compat.sql`. `submit-lead` is deployed as
v16 with `verify_jwt=false`; the new admin/internal functions are deployed as
v2 and keep JWT verification enabled through Supabase platform defaults. Treat
post-deploy admin/routing/outbound smoke tests as mandatory when changing that
suite.

## Design Context

Read `DESIGN.md` before frontend work. The locked direction is "Neon Nocturne / Digital Concierge": dark, cinematic, data-confident, glassy, and precise. Use the existing palette, font roles, surface hierarchy, and button/input patterns.

When verifying public mobile UI locally, headless Chrome with GPU disabled can fail React Three Fiber canvas creation and make screenshots look blank unless a virtual-time budget is used. Prefer a real browser or device for final visual/mobile-submission confidence.

## Project IDs

- Supabase: project `claimcalculator.ai`, ref `uawtkzzyeydfgnpiaqfb`, region `us-east-1`.
- Vercel: project `antigrav-claimcalc`, ID `prj_Ndmgm1URg1V3aFUnjVI8WGJFzWWV`.

## Local Safety

This repo may have unrelated dirty files. Check `git status --short` before editing and preserve existing work.
