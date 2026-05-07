import { matchAttorneysSchema } from "../_shared/admin-schemas.ts";
import { requireAdminOrInternal } from "../_shared/auth.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { rankAttorneysForLead } from "../_shared/attorney-routing.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    await requireAdminOrInternal(req, supabase);
    const parsed = matchAttorneysSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const { lead, matches } = await rankAttorneysForLead(
      supabase,
      parsed.data.leadId,
    );
    return json({
      leadId: lead.id,
      candidates: matches.map((match) => ({
        attorney: {
          id: match.attorney.id,
          name: match.attorney.name,
          firm: match.attorney.firm ?? match.attorney.firm_name ?? null,
          email: match.attorney.email,
          autoForwardEnabled: Boolean(match.attorney.auto_forward_enabled),
        },
        score: match.score,
        eligible: !match.excluded,
        reasons: match.reasons,
        exclusionReasons: match.exclusionReasons,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("match-attorneys failed", error);
    return json({ error: "match failed" }, 500);
  }
});
