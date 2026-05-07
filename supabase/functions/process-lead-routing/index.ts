import { processLeadRoutingSchema } from "../_shared/admin-schemas.ts";
import {
  applyRoutingRule,
  findRoutingRuleForLead,
  rankAttorneysForLead,
} from "../_shared/attorney-routing.ts";
import { requireAdminOrInternal } from "../_shared/auth.ts";
import {
  claimBackendJobs,
  completeBackendJob,
  failBackendJob,
  refreshAssignmentRollups,
} from "../_shared/db-utils.ts";
import { logLeadTimeline } from "../_shared/events.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { enqueueAttorneyForward } from "../_shared/outbound.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Actor = Awaited<ReturnType<typeof requireAdminOrInternal>>;

async function routeLead(
  supabase: SupabaseClient,
  input: { leadId: string; forward: boolean; actor: Actor },
) {
  const { leadId, forward, actor } = input;
  const { matches } = await rankAttorneysForLead(supabase, leadId);
  const rule = await findRoutingRuleForLead(supabase, leadId);
  const selected = applyRoutingRule(matches, rule);

  if (rule?.route_mode === "manual") {
    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update({ intake_status: "manual_review" })
      .eq("id", leadId);
    if (leadUpdateError) throw new Error("lead manual review update failed");
    await logLeadTimeline(supabase, {
      leadId,
      action: "routing_manual_review",
      source: "process-lead-routing",
      actor,
      details: { routing_rule_id: rule.id, routing_rule_name: rule.name },
    });
    return {
      routed: false,
      reason: "manual routing rule",
      routingRuleId: rule.id,
      candidates: matches,
    };
  }

  if (!selected) {
    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update({ intake_status: "manual_review" })
      .eq("id", leadId);
    if (leadUpdateError) throw new Error("lead no-match update failed");
    await logLeadTimeline(supabase, {
      leadId,
      action: "routing_no_match",
      source: "process-lead-routing",
      actor,
      details: { candidates: matches.slice(0, 10), routing_rule_id: rule?.id },
    });
    return {
      routed: false,
      reason: "no eligible attorney",
      routingRuleId: rule?.id ?? null,
      candidates: matches,
    };
  }

  const { data: existing } = await supabase
    .from("lead_assignments")
    .select("*")
    .eq("lead_id", leadId)
    .eq("attorney_id", selected.attorney.id)
    .maybeSingle();

  let assignment = existing;
  if (!assignment) {
    const { data, error } = await supabase
      .from("lead_assignments")
      .insert({
        lead_id: leadId,
        attorney_id: selected.attorney.id,
        outcome: "pending",
        assignment_status: "assigned",
        routing_reason: selected.reasons.join("; "),
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
  if (leadUpdateError) throw new Error("lead routing status update failed");

  const { error: attorneyUpdateError } = await supabase
    .from("attorney_partners")
    .update({ last_assigned_at: new Date().toISOString() })
    .eq("id", selected.attorney.id);
  if (attorneyUpdateError) throw new Error("attorney assignment timestamp update failed");

  await refreshAssignmentRollups(supabase, {
    leadId,
    attorneyId: selected.attorney.id,
  });

  await logLeadTimeline(supabase, {
    leadId,
    action: "routing_assigned",
    source: "process-lead-routing",
    actor,
    details: {
      assignment_id: assignment.id,
      attorney_id: selected.attorney.id,
      score: selected.score,
      reasons: selected.reasons,
      routing_rule_id: rule?.id ?? null,
      routing_rule_name: rule?.name ?? null,
      reused_assignment: Boolean(existing),
    },
  });

  const message = forward && selected.attorney.auto_forward_enabled
    ? await enqueueAttorneyForward(supabase, {
      leadId,
      attorneyId: selected.attorney.id,
      assignmentId: assignment.id,
    })
    : null;

  return {
    routed: true,
    assignmentId: assignment.id,
    attorneyId: selected.attorney.id,
    outboundMessageId: message?.id ?? null,
    routingRuleId: rule?.id ?? null,
    reused: Boolean(existing),
  };
}

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    const actor = await requireAdminOrInternal(req, supabase);
    const parsed = processLeadRoutingSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);

    const { leadId, forward, limit } = parsed.data;
    if (leadId) {
      return json(await routeLead(supabase, { leadId, forward, actor }));
    }

    const jobs = await claimBackendJobs(supabase, {
      jobType: "process_lead_routing",
      limit,
      lockedBy: Deno.env.get("SB_EXECUTION_ID") ?? "process-lead-routing",
    });

    const results = [];
    for (const job of jobs) {
      if (!job.lead_id) {
        await failBackendJob(supabase, job.id, "routing job missing lead_id");
        results.push({
          jobId: job.id,
          routed: false,
          error: "missing lead_id",
        });
        continue;
      }
      try {
        const result = await routeLead(supabase, {
          leadId: job.lead_id,
          forward: typeof job.payload?.forward === "boolean"
            ? job.payload.forward
            : forward,
          actor,
        });
        await completeBackendJob(supabase, job.id, result);
        results.push({ jobId: job.id, leadId: job.lead_id, ...result });
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "routing failed";
        await failBackendJob(supabase, job.id, message);
        results.push({
          jobId: job.id,
          leadId: job.lead_id,
          routed: false,
          error: message,
        });
      }
    }

    return json({ processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("process-lead-routing failed", error);
    return json({ error: "routing failed" }, 500);
  }
});
