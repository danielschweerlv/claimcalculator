import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { claimOutboundMessages, refreshAssignmentRollups } from "./db-utils.ts";

type LeadForEmail = {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  case_type: string;
  zip_code?: string | null;
  estimated_value_low?: number | null;
  estimated_value_high?: number | null;
  case_description?: string | null;
};

type AttorneyForEmail = {
  id: string;
  name: string;
  firm_name?: string | null;
  firm?: string | null;
  email: string;
};

function dollars(amount?: number | null): string {
  if (amount == null) return "unknown";
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

export async function enqueueAttorneyForward(
  supabase: SupabaseClient,
  input: {
    leadId: string;
    attorneyId: string;
    assignmentId?: string | null;
    templateKey?: string;
  },
) {
  const templateKey = input.templateKey ?? "attorney-lead-forward";
  const idempotencyKey = `forward:${
    input.assignmentId ?? `${input.leadId}:${input.attorneyId}`
  }:email:${templateKey}`;

  const { data: existing } = await supabase
    .from("outbound_messages")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) return existing;

  const { data: attorney, error: attorneyError } = await supabase
    .from("attorney_partners")
    .select("id,name,firm_name,firm,email")
    .eq("id", input.attorneyId)
    .single();
  if (attorneyError || !attorney) throw new Error("attorney not found");

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(
      "id,contact_name,contact_email,contact_phone,case_type,zip_code,estimated_value_low,estimated_value_high,case_description",
    )
    .eq("id", input.leadId)
    .single();
  if (leadError || !lead) throw new Error("lead not found");

  const { subject, text } = renderAttorneyForwardEmail(lead, attorney);

  const { data: message, error } = await supabase
    .from("outbound_messages")
    .insert({
      idempotency_key: idempotencyKey,
      lead_id: input.leadId,
      assignment_id: input.assignmentId ?? null,
      attorney_id: input.attorneyId,
      message_type: "attorney_forward",
      provider: "resend",
      recipient: attorney.email,
      subject,
      template_key: templateKey,
      delivery_status: "queued",
      payload: { text },
    })
    .select("*")
    .single();

  if (error || !message) throw new Error("outbound enqueue failed");
  return message;
}

export function renderAttorneyForwardEmail(
  lead: LeadForEmail,
  attorney: AttorneyForEmail,
) {
  const subject =
    `New ClaimCalculator Lead: ${lead.contact_name} — ${lead.case_type}`;
  const text = [
    `New lead from ClaimCalculator.ai`,
    ``,
    `Attorney: ${attorney.name}${
      attorney.firm_name || attorney.firm
        ? ` (${attorney.firm_name ?? attorney.firm})`
        : ""
    }`,
    ``,
    `Name:    ${lead.contact_name}`,
    `Email:   ${lead.contact_email}`,
    `Phone:   ${lead.contact_phone ?? "—"}`,
    `Case:    ${lead.case_type}`,
    `Zip:     ${lead.zip_code ?? "—"}`,
    `Estimate: ${dollars(lead.estimated_value_low)} – ${
      dollars(lead.estimated_value_high)
    }`,
    lead.case_description ? `\nDescription: ${lead.case_description}` : "",
    ``,
    `Lead ID: ${lead.id}`,
  ].join("\n");

  return { subject, text };
}

export async function sendOutboundMessage(
  supabase: SupabaseClient,
  messageId: string,
) {
  const { data: message, error: messageError } = await supabase
    .from("outbound_messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (messageError || !message) throw new Error("message not found");
  if (
    message.delivery_status === "sent" ||
    message.delivery_status === "delivered"
  ) {
    return { message, skipped: true };
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ??
    "ClaimCalculator.ai <frontdesk@claimcalculator.ai>";

  if (message.delivery_status !== "sending") {
    await supabase
      .from("outbound_messages")
      .update({
        delivery_status: "sending",
        locked_at: new Date().toISOString(),
        locked_by: Deno.env.get("SB_EXECUTION_ID") ?? "edge-function",
        attempt_count: (message.attempt_count ?? 0) + 1,
        error_message: null,
      })
      .eq("id", message.id);
  }

  if (!resendKey) {
    const { data: failed } = await supabase
      .from("outbound_messages")
      .update({
        delivery_status: "failed",
        error_message: "RESEND_API_KEY is not configured",
        next_attempt_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", message.id)
      .select("*")
      .single();
    return { message: failed ?? message, skipped: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.recipient],
        cc: Array.isArray(message.payload?.cc) ? message.payload.cc : undefined,
        subject: message.subject,
        text: message.payload?.text ?? "",
      }),
    });

    const providerBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        providerBody?.message ?? `Resend HTTP ${response.status}`,
      );
    }

    const { data: sent } = await supabase
      .from("outbound_messages")
      .update({
        delivery_status: "sent",
        provider_message_id: providerBody?.id ?? null,
        sent_at: new Date().toISOString(),
        error_message: null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", message.id)
      .select("*")
      .single();

    if (message.message_type === "attorney_forward") {
      const forwardedAt = new Date().toISOString();
      if (message.assignment_id) {
        await supabase
          .from("lead_assignments")
          .update({
            assignment_status: "forwarded",
            forwarded_at: forwardedAt,
          })
          .eq("id", message.assignment_id);
      }
      if (message.lead_id) {
        const { error: leadUpdateError } = await supabase
          .from("leads")
          .update({
            intake_status: "forwarded",
            forwarded_at: forwardedAt,
          })
          .eq("id", message.lead_id);
        if (leadUpdateError) throw new Error("lead forwarded update failed");
      }
      await refreshAssignmentRollups(supabase, {
        leadId: message.lead_id,
        attorneyId: message.attorney_id,
      });
    }

    if (message.lead_id) {
      const { error: eventError } = await supabase.from("lead_events").insert({
        lead_id: message.lead_id,
        event_type: "outbound_message_sent",
        event_source: "process-outbound-queue",
        actor_type: "system",
        metadata: {
          outbound_message_id: message.id,
          attorney_id: message.attorney_id,
          recipient: message.recipient,
          provider_message_id: providerBody?.id ?? null,
        },
      });
      if (eventError) throw new Error("outbound sent event insert failed");
    }

    return { message: sent ?? message, skipped: false };
  } catch (error) {
    const delayMinutes = Math.min(
      240,
      15 * Math.max(1, (message.attempt_count ?? 0) + 1),
    );
    const { data: failed } = await supabase
      .from("outbound_messages")
      .update({
        delivery_status: "failed",
        error_message: error instanceof Error ? error.message : "send failed",
        next_attempt_at: new Date(Date.now() + delayMinutes * 60 * 1000)
          .toISOString(),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", message.id)
      .select("*")
      .single();

    return { message: failed ?? message, skipped: false };
  }
}

export async function processOutboundQueue(
  supabase: SupabaseClient,
  limit: number,
) {
  const messages = await claimOutboundMessages(supabase, {
    limit,
    lockedBy: Deno.env.get("SB_EXECUTION_ID") ?? "process-outbound-queue",
  });

  const results = [];
  for (const message of messages) {
    results.push(await sendOutboundMessage(supabase, message.id));
  }
  return results;
}
