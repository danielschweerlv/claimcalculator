# Deployment Rules

## Frontend — Vercel

**Project:** `antigrav-claimcalc` (`prj_Ndmgm1URg1V3aFUnjVI8WGJFzWWV`) **Team:**
`team_8TE9898hK0CMKCkBV3AKp9h7`

Vercel deploys automatically on push to `main`. Preview deployments are created
for all branches.

`vercel.json` contains a single SPA rewrite rule — all routes fall through to
`index.html`. Do not add rewrites that conflict with this.

### Environment Variables

Set via Vercel dashboard or CLI for both Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

To add a new env var to all preview branches (CLI non-interactive workaround):

```bash
# Use the REST API — vercel env add refuses --yes for "all preview branches"
vercel env add VAR_NAME production
# For preview, use the Vercel dashboard or REST API
```

## Edge Functions — Supabase

**Project:** `claimcalculator.ai` (ref `uawtkzzyeydfgnpiaqfb`, region
`us-east-1`)

```bash
supabase functions deploy submit-lead
```

Backend upgrade functions are deployed individually:

```bash
supabase functions deploy match-attorneys
supabase functions deploy process-lead-routing
supabase functions deploy admin-assign-lead
supabase functions deploy forward-lead
supabase functions deploy process-outbound-queue
supabase functions deploy retry-message
supabase functions deploy update-attorney-profile
```

Keep JWT verification enabled for every admin/internal backend upgrade function.
Only `submit-lead` is public (`verify_jwt=false` in `supabase/config.toml`).
For internal worker-style calls, send both a valid Supabase bearer token and
`x-internal-secret`; do not expose `INTERNAL_FUNCTION_SECRET` to browser code.

Deploy order for the backend upgrade:

1. `supabase db push --dry-run`
2. `supabase db push`
3. Deploy `submit-lead`
4. Deploy the admin/internal functions listed above
5. Run the backend upgrade verification checklist in `docs/testing.md`

Function secrets (set once via Supabase dashboard or CLI, not in code):

- `IP_HASH_PEPPER`
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected by Supabase)
- `RESEND_API_KEY`
- `RESEND_FROM` (optional; defaults to
  `ClaimCalculator.ai <frontdesk@claimcalculator.ai>`)
- `INTERNAL_FUNCTION_SECRET` (optional; for cron/worker-style calls that still
  send a valid Supabase bearer token)

## Branch / PR Rules

- `main` is the production branch — Vercel deploys to prod on every push
- Use feature branches for all work, open PRs against `main`
- Squash merge PRs (keeps `main` history clean)
- Delete remote branch after merge

## Database Migrations

Migrations live in `supabase/migrations/`. Apply via:

```bash
supabase db push
```

Never modify existing migration files — always create a new one.
