import { adminAssignLeadSchema } from "../_shared/admin-schemas.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { refreshAssignmentRollups } from "../_shared/db-utils.ts";
import { logAudit, logLeadTimeline } from "../_shared/events.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { enqueueAttorneyForward } from "../_shared/outbound.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    const actor = await requireAdmin(req, supabase);
    const parsed = adminAssignLeadSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const { leadId, attorneyId, routingReason, forward } = parsed.data;

    const { data: existing } = await supabase
      .from("lead_assignments")
      .select("*")
      .eq("lead_id", leadId)
      .eq("attorney_id", attorneyId)
      .maybeSingle();

    let assignment = existing;
    if (!assignment) {
      const { data, error } = await supabase
        .from("lead_assignments")
        .insert({
          lead_id: leadId,
          attorney_id: attorneyId,
          assigned_by: actor.userId,
          outcome: "pending",
          assignment_status: "assigned",
          routing_reason: routingReason ?? "manual admin assignment",
        })
        .select("*")
        .single();
      if (error || !data) throw new Error("assignment insert failed");
      assignment = data;
    }

    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update({
        status: "sent_to_attorney",
        intake_status: "assigned",
        assigned_at: assignment.assigned_at,
      })
      .eq("id", leadId);
    if (leadUpdateError) throw new Error("lead assignment status update failed");

    await refreshAssignmentRollups(supabase, { leadId, attorneyId });

    await logLeadTimeline(supabase, {
      leadId,
      action: "assigned_to_attorney",
      source: "admin-assign-lead",
      actor,
      details: {
        attorney_id: attorneyId,
        assignment_id: assignment.id,
        routing_reason: routingReason ?? "manual admin assignment",
        reused_assignment: Boolean(existing),
      },
    });

    await logAudit(supabase, {
      entityType: "lead_assignment",
      entityId: assignment.id,
      action: existing ? "assignment_reused" : "assignment_created",
      actor,
      afterState: assignment,
      metadata: { lead_id: leadId, attorney_id: attorneyId },
    });

    const message = forward
      ? await enqueueAttorneyForward(supabase, {
        leadId,
        attorneyId,
        assignmentId: assignment.id,
      })
      : null;

    return json({
      assignmentId: assignment.id,
      reused: Boolean(existing),
      outboundMessageId: message?.id ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("admin-assign-lead failed", error);
    return json({ error: "assignment failed" }, 500);
  }
});
