import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { submitLeadSchema } from "../_shared/schema.ts";
import { calcSettlement } from "../_shared/calc-settlement.ts";
import { isNonNvZip, mapCaseType, mapFault } from "../_shared/mappers.ts";
import { checkAndRecord, hashIp } from "../_shared/rate-limit.ts";
import { sendOutboundMessage } from "../_shared/outbound.ts";

declare const EdgeRuntime:
  | { waitUntil: (promise: Promise<unknown>) => void }
  | undefined;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

async function hashDuplicateKey(
  parts: Array<string | undefined>,
): Promise<string> {
  const normalized = parts
    .map((part) => part?.trim().toLowerCase() ?? "")
    .join("|");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function stateFromZip(zip: string | undefined): string | null {
  if (!zip) return null;
  return /^(889|890|891|893|894|895|897|898)/.test(zip) ? "NV" : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const parsed = submitLeadSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("schema validation failed");
    return json({ error: "invalid submission" }, 400);
  }
  const body = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  const pepper = Deno.env.get("IP_HASH_PEPPER") ?? "dev-pepper";
  const ipHash = await hashIp(ip, pepper);
  const rl = await checkAndRecord(supabase, ipHash);
  if (!rl.ok) {
    return json({ error: "rate limited", reason: rl.reason }, 429);
  }

  const estimate = calcSettlement({
    caseType: body.caseType,
    injuries: body.injuries,
    fault: body.fault,
    faultAtFault: body.faultAtFault,
    evInvolved: body.evInvolved,
    commercialVehicle: body.commercialVehicle,
    when: body.when,
    otherInsurer: body.otherInsurer,
    cameras: body.cameras,
    witnesses: body.witnesses,
    surface: body.surface,
    lighting: body.lighting,
    onTheJob: body.onTheJob,
  });

  const withAvg = Math.round((estimate.withLow + estimate.withHigh) / 2);
  const withoutAvg = Math.round(
    (estimate.withoutLow + estimate.withoutHigh) / 2,
  );
  const dbCaseType = mapCaseType(body.caseType);
  const duplicateKey = await hashDuplicateKey([
    body.email,
    body.phone,
    body.zipCode,
    dbCaseType,
  ]);
  const nonNvZip = isNonNvZip(body.zipCode);

  const row = {
    case_type: dbCaseType,
    accident_type: body.accidentType ?? null,
    injury_types: body.injuries,
    fault_status: mapFault(body.fault),
    ev_involved: body.evInvolved === "Yes",
    commercial_vehicle: body.commercialVehicle === "Yes",
    rideshare_involved: body.rideshareInvolved === "Yes",
    accident_timeframe: body.when ?? null,
    report_filed: body.reportedTo ?? [],
    cameras_witnesses: body.cameras === "Yes" || body.witnesses === "Yes",
    surface_conditions: body.surface ?? null,
    lighting_conditions: body.lighting ?? null,
    has_own_insurance: body.hasOwnInsurance === "Yes",
    own_insurance_company: body.myInsurer ?? null,
    other_party_insurance: body.otherInsurer ?? null,
    adjuster_contacted: body.adjusterContacted === "Yes",
    has_lawyer: body.hasLawyer === "Yes",
    case_description: body.caseDescription ?? null,
    zip_code: body.zipCode ?? null,
    contact_name: `${body.firstName} ${body.lastName}`,
    contact_email: body.email,
    contact_phone: body.phone,
    estimated_value_low: withoutAvg,
    estimated_value_high: withAvg,
    intake_status: "queued",
    source: body.utm.source ?? "website",
    utm_source: body.utm.source ?? null,
    utm_medium: body.utm.medium ?? null,
    utm_campaign: body.utm.campaign ?? null,
    referrer: body.referrer ?? null,
    ip_hash: ipHash,
    duplicate_key: duplicateKey,
    spam_score: 0,
    validation_status: nonNvZip ? "manual_review" : "valid",
    normalized_case_type: dbCaseType,
    normalized_zip: body.zipCode ?? null,
    state: stateFromZip(body.zipCode),
    consent_to_contact: true,
    preferred_contact_method: "phone",
    notes: nonNvZip ? "non-NV zip" : null,
  };

  const { data: leadRow, error: insertErr } = await supabase
    .from("leads")
    .insert(row)
    .select("id")
    .single();

  if (insertErr || !leadRow) {
    console.error("lead insert failed", insertErr);
    return json({ error: "insert failed" }, 500);
  }

  const { error: activityError } = await supabase.from("lead_activity").insert({
    lead_id: leadRow.id,
    action: "created",
    details: { utm: body.utm, referrer: body.referrer, ip_hash: ipHash },
  });
  if (activityError) {
    console.error("lead activity insert failed", activityError);
    return json({ error: "timeline failed" }, 500);
  }

  const { error: eventError } = await supabase.from("lead_events").insert({
    lead_id: leadRow.id,
    event_type: "created",
    event_source: "submit-lead",
    actor_type: "public_user",
    metadata: {
      utm: body.utm,
      referrer: body.referrer,
      ip_hash: ipHash,
      duplicate_key: duplicateKey,
      validation_status: nonNvZip ? "manual_review" : "valid",
    },
  });
  if (eventError) {
    console.error("lead event insert failed", eventError);
    return json({ error: "timeline failed" }, 500);
  }

  const { error: jobError } = await supabase.from("backend_jobs").insert({
    job_type: "process_lead_routing",
    lead_id: leadRow.id,
    payload: { strategy: "best_match_v1" },
  });
  if (jobError) {
    console.error("backend job insert failed", jobError);
    return json({ error: "queue failed" }, 500);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const emailBody = [
      `New lead submitted on ClaimCalculator.ai`,
      ``,
      `Name:    ${body.firstName} ${body.lastName}`,
      `Email:   ${body.email}`,
      `Phone:   ${body.phone}`,
      `Case:    ${body.caseType}`,
      `Zip:     ${body.zipCode ?? "—"}`,
      `Est. value: $${withoutAvg.toLocaleString()} – $${withAvg.toLocaleString()}`,
      body.caseDescription ? `\nDescription: ${body.caseDescription}` : "",
      ``,
      `Lead ID: ${leadRow.id}`,
    ].join("\n");

    const { data: message, error: messageError } = await supabase
      .from("outbound_messages")
      .insert({
        idempotency_key: `internal-notification:${leadRow.id}`,
        lead_id: leadRow.id,
        message_type: "internal_notification",
        provider: "resend",
        recipient: "frontdesk@claimcalculator.ai",
        subject:
          `New Lead: ${body.firstName} ${body.lastName} — ${body.caseType}`,
        template_key: "internal-new-lead",
        delivery_status: "queued",
        payload: { text: emailBody, cc: ["danielschweer@gmail.com"] },
      })
      .select("id")
      .single();
    if (messageError) {
      console.error("outbound notification insert failed", messageError);
    }

    if (message?.id) {
      const backgroundSend = sendOutboundMessage(supabase, message.id).catch(
        (e) => {
          console.error("background resend error", e);
        },
      );
      if (typeof EdgeRuntime !== "undefined") {
        EdgeRuntime.waitUntil(backgroundSend);
      } else {
        backgroundSend.catch(() => {});
      }
    }
  }

  return json({
    leadId: leadRow.id,
    estimate: {
      withLow: estimate.withLow,
      withHigh: estimate.withHigh,
      withoutLow: estimate.withoutLow,
      withoutHigh: estimate.withoutHigh,
    },
  });
});
