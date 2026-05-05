import { forwardLeadSchema } from "../_shared/admin-schemas.ts";
import { requireAdminOrInternal } from "../_shared/auth.ts";
import { logLeadTimeline } from "../_shared/events.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import {
  enqueueAttorneyForward,
  sendOutboundMessage,
} from "../_shared/outbound.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    const actor = await requireAdminOrInternal(req, supabase);
    const parsed = forwardLeadSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const message = await enqueueAttorneyForward(supabase, parsed.data);
    await logLeadTimeline(supabase, {
      leadId: parsed.data.leadId,
      action: "outbound_message_queued",
      source: "forward-lead",
      actor,
      details: {
        outbound_message_id: message.id,
        attorney_id: parsed.data.attorneyId,
        assignment_id: parsed.data.assignmentId ?? null,
      },
    });

    const result = parsed.data.processNow
      ? await sendOutboundMessage(supabase, message.id)
      : null;

    return json({
      outboundMessageId: message.id,
      deliveryStatus: result?.message?.delivery_status ??
        message.delivery_status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("forward-lead failed", error);
    return json({ error: "forward failed" }, 500);
  }
});
