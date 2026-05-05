import { retryMessageSchema } from "../_shared/admin-schemas.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { logAudit } from "../_shared/events.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { sendOutboundMessage } from "../_shared/outbound.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    const actor = await requireAdmin(req, supabase);
    const parsed = retryMessageSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const { data: before } = await supabase
      .from("outbound_messages")
      .select("*")
      .eq("id", parsed.data.messageId)
      .single();

    const { data: message, error } = await supabase
      .from("outbound_messages")
      .update({
        delivery_status: "queued",
        next_attempt_at: new Date().toISOString(),
        locked_at: null,
        locked_by: null,
        error_message: null,
      })
      .eq("id", parsed.data.messageId)
      .select("*")
      .single();

    if (error || !message) throw new Error("message retry failed");

    await logAudit(supabase, {
      entityType: "outbound_message",
      entityId: message.id,
      action: "message_retry_requested",
      actor,
      beforeState: before,
      afterState: message,
    });

    const result = parsed.data.processNow
      ? await sendOutboundMessage(supabase, message.id)
      : null;

    return json({
      outboundMessageId: message.id,
      deliveryStatus: result?.message.delivery_status ??
        message.delivery_status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("retry-message failed", error);
    return json({ error: "retry failed" }, 500);
  }
});
