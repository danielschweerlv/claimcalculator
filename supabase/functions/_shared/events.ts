import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { Actor } from "./auth.ts";

function assertWrite(error: unknown, message: string) {
  if (error) {
    console.error(message, error);
    throw new Error(message);
  }
}

export async function logLeadEvent(
  supabase: SupabaseClient,
  input: {
    leadId: string;
    eventType: string;
    eventSource: string;
    actor?: Actor;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("lead_events").insert({
    lead_id: input.leadId,
    event_type: input.eventType,
    event_source: input.eventSource,
    actor_type: input.actor?.actorType ?? "system",
    actor_id: input.actor?.userId ?? null,
    metadata: input.metadata ?? {},
  });
  assertWrite(error, "lead event insert failed");
}

export async function logLegacyActivity(
  supabase: SupabaseClient,
  input: {
    leadId: string;
    action: string;
    actor?: Actor;
    details?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("lead_activity").insert({
    lead_id: input.leadId,
    action: input.action,
    performed_by: input.actor?.userId ?? null,
    details: input.details ?? {},
  });
  assertWrite(error, "lead activity insert failed");
}

export async function logLeadTimeline(
  supabase: SupabaseClient,
  input: {
    leadId: string;
    action: string;
    source: string;
    actor?: Actor;
    details?: Record<string, unknown>;
  },
) {
  await Promise.all([
    logLegacyActivity(supabase, {
      leadId: input.leadId,
      action: input.action,
      actor: input.actor,
      details: input.details,
    }),
    logLeadEvent(supabase, {
      leadId: input.leadId,
      eventType: input.action,
      eventSource: input.source,
      actor: input.actor,
      metadata: input.details,
    }),
  ]);
}

export async function logAudit(
  supabase: SupabaseClient,
  input: {
    entityType: string;
    entityId?: string | null;
    action: string;
    actor?: Actor;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("audit_logs").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    actor_user_id: input.actor?.userId ?? null,
    actor_email: input.actor?.email ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    metadata: input.metadata ?? {},
  });
  assertWrite(error, "audit log insert failed");
}
