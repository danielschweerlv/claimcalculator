# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference Docs

- For API conventions, read `docs/api-standards.md`
- For testing guidelines, read `docs/testing.md`
- For deployment rules, read `docs/deploy.md`

## Commands

```bash
npm run dev        # start dev server (Vite)
npm run build      # production build
npm run lint       # ESLint
npm run preview    # preview production build locally
```

Supabase edge functions:
```bash
supabase functions deploy submit-lead   # deploy edge function
supabase functions serve                # run edge functions locally
```

## Architecture

**Frontend:** React 19 + Vite, Tailwind CSS, Radix UI, Framer Motion, React Three Fiber (hero animation)

**Backend:** Single Supabase edge function (`supabase/functions/submit-lead/`) — no direct anon writes to the DB. All lead submissions go through this function.

**Shared logic:** `src/lib/calc-settlement.js` is imported by both the frontend (live estimate display) and the edge function (server-side validation). Do not split these.

**Key lib files:**
- `src/lib/calc-settlement.js` — settlement estimate logic (shared client/server)
- `src/lib/submit-lead.js` — form → schema key mapping and submission wrapper
- `src/lib/supabase.js` — Supabase client
- `src/lib/utils.js` — shared utilities

**Pages live in** `src/pages/`, **components in** `src/components/`.

**Plans and specs** are in `docs/superpowers/plans/` and `docs/superpowers/specs/`.

## Locked Design Decisions

Do not re-brainstorm these — they are settled:

- Single `submit-lead` edge function handles all lead writes (no direct anon DB access)
- `calc-settlement.js` must remain shared between client and server
- Structural retune enforces `withAvg >= 4.5 * withoutAvg`
- `estimated_value_low` = withoutAvg midpoint, `estimated_value_high` = withAvg midpoint
- Honeypot + IP rate limit (5/hr, 20/day) with SHA-256 hashed IPs + server pepper
- Non-NV zip codes are accepted with `notes = 'non-NV zip'`
- Form keys differ from DB schema keys — `src/lib/submit-lead.js` owns that mapping
- Public 400 responses must NOT expose Zod `issues` array (security requirement)

## Project IDs

- **Supabase:** project `claimcalculator.ai`, ref `uawtkzzyeydfgnpiaqfb`, region `us-east-1`
- **Vercel:** project `antigrav-claimcalc`, ID `prj_Ndmgm1URg1V3aFUnjVI8WGJFzWWV`
- **Repo path:** `/Users/daniel/Desktop/Claude Attic/antigrav-claimcalc/antigrav-claimcalc/` (nested — inner dir is the project root)

## Tech Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, Radix UI primitives, Framer Motion
- **Backend:** Supabase (Postgres + Edge Functions in TypeScript)
- **Routing:** react-router-dom v7
- **3D:** react-three-fiber + three.js

## Environment Variables

| Variable | Where |
|----------|-------|
| `VITE_SUPABASE_URL` | Vercel (Production + Preview) |
| `VITE_SUPABASE_ANON_KEY` | Vercel (Production + Preview) |
| `IP_HASH_PEPPER` | Supabase function secrets |

## Out of Scope (Future Cycles)

Admin dashboard, attorney routing, email notifications, payout tracking, analytics.
