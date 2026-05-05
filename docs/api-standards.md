# API Standards

## Edge Function Convention

All backend logic runs through Supabase edge functions (Deno/TypeScript).
`submit-lead` is the only public function. Admin, routing, forwarding, retry,
and attorney-profile updates run through authenticated Supabase Edge Functions.

**No direct anon writes to the DB.** All mutations go through edge functions using the service role key server-side.

## Request / Response Format

- All requests and responses are JSON (`content-type: application/json`)
- Edge functions handle CORS preflight (`OPTIONS`) before any logic
- Use the `json(body, status)` helper for all responses — never construct `Response` manually
- Check Supabase write errors before returning success for required side effects

## Error Responses

| Situation | Status | Body |
|-----------|--------|------|
| Bad JSON | 400 | `{ "error": "invalid json" }` |
| Public schema validation failure | 400 | `{ "error": "invalid submission" }` |
| Admin/internal validation failure | 400 | `{ "error": "invalid request" }` |
| Rate limited | 429 | `{ "error": "rate limited", "reason": "..." }` |
| DB insert failure | 500 | `{ "error": "insert failed" }` |
| Wrong HTTP method | 405 | `{ "error": "method not allowed" }` |

**Never expose Zod `issues` arrays in 400 responses** — these leak schema details publicly.

## Schema Validation

Public submission validation is defined in `supabase/functions/_shared/schema.ts`
using Zod. Admin/internal request validation is defined in
`supabase/functions/_shared/admin-schemas.ts`. Use `safeParse` — never `parse`
(throws).

The honeypot field (`website`) must be an empty string or omitted. Any non-empty value is a bot.

## Form Key → Schema Key Mapping

The frontend form uses different key names than the schema. `src/lib/submit-lead.js` owns this mapping. Do not bypass it.

| Form key | Schema key |
|----------|-----------|
| `type` | `accidentType` |
| `zip` | `zipCode` |
| `description` | `caseDescription` |
| `hiredLawyer` | `hasLawyer` |
| `adjuster` | `adjusterContacted` |

`evInvolved` and `commercialVehicle` "Not sure" values map to `undefined` (not passed to schema).

## Rate Limiting

5 submissions/hr and 20/day per IP. IPs are SHA-256 hashed with a server-side pepper (`IP_HASH_PEPPER`) before storage — raw IPs are never persisted.

## Shared Logic

`supabase/functions/_shared/calc-settlement.ts` is the canonical settlement calculator. It is also imported client-side via `src/lib/calc-settlement.js`. Keep them in sync — do not fork the logic.
