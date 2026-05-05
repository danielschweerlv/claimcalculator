import { processOutboundQueueSchema } from "../_shared/admin-schemas.ts";
import { requireAdminOrInternal } from "../_shared/auth.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { processOutboundQueue } from "../_shared/outbound.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    await requireAdminOrInternal(req, supabase);
    const parsed = processOutboundQueueSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const results = await processOutboundQueue(supabase, parsed.data.limit);
    return json({
      processed: results.length,
      messages: results.map((result) => ({
        id: result.message.id,
        deliveryStatus: result.message.delivery_status,
        skipped: result.skipped,
        error: result.message.error_message ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("process-outbound-queue failed", error);
    return json({ error: "queue processing failed" }, 500);
  }
});
