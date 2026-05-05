import { updateAttorneyProfileSchema } from "../_shared/admin-schemas.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { logAudit } from "../_shared/events.ts";
import { handleOptions, json, readJson, requirePost } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req) => {
  const options = await handleOptions(req);
  if (options) return options;
  const methodError = requirePost(req);
  if (methodError) return methodError;

  const supabase = createServiceClient();

  try {
    const actor = await requireAdmin(req, supabase);
    const parsed = updateAttorneyProfileSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "invalid request" }, 400);
    const body = parsed.data;

    const before = body.attorneyId
      ? (await supabase.from("attorney_partners").select("*").eq(
        "id",
        body.attorneyId,
      ).maybeSingle()).data
      : null;

    const partnerPayload = {
      name: body.name,
      firm_name: body.firmName ?? null,
      firm: body.firmName ?? null,
      email: body.email,
      phone: body.phone ?? null,
      is_active: body.isActive,
      priority: body.priority,
      notes: body.notes ?? null,
      price_per_lead: body.pricePerLead ?? 2000,
      default_price_per_lead: body.pricePerLead ?? 2000,
      max_leads_per_month: body.monthlyLeadCap ?? null,
      monthly_lead_cap: body.monthlyLeadCap ?? null,
      auto_forward_enabled: body.autoForwardEnabled,
      case_types_accepted: body.caseTypes.length
        ? body.caseTypes
        : ["motor_vehicle"],
      zip_codes_covered: body.coverage.map((coverage) => coverage.zipCode)
        .filter(Boolean),
    };

    const { data: attorney, error: attorneyError } = body.attorneyId
      ? await supabase
        .from("attorney_partners")
        .update(partnerPayload)
        .eq("id", body.attorneyId)
        .select("*")
        .single()
      : await supabase
        .from("attorney_partners")
        .insert(partnerPayload)
        .select("*")
        .single();

    if (attorneyError || !attorney) throw new Error("attorney upsert failed");

    const { error: caseTypeDeleteError } = await supabase.from(
      "attorney_case_types",
    ).delete().eq(
      "attorney_id",
      attorney.id,
    );
    if (caseTypeDeleteError) throw new Error("attorney case type delete failed");
    if (body.caseTypes.length) {
      const { error: caseTypeInsertError } = await supabase.from(
        "attorney_case_types",
      ).insert(
        body.caseTypes.map((caseType) => ({
          attorney_id: attorney.id,
          case_type: caseType,
          is_active: body.isActive,
        })),
      );
      if (caseTypeInsertError) throw new Error("attorney case type insert failed");
    }

    const { error: coverageDeleteError } = await supabase.from(
      "attorney_coverage",
    ).delete().eq(
      "attorney_id",
      attorney.id,
    );
    if (coverageDeleteError) throw new Error("attorney coverage delete failed");
    if (body.coverage.length) {
      const { error: coverageInsertError } = await supabase.from(
        "attorney_coverage",
      ).insert(
        body.coverage.map((coverage) => ({
          attorney_id: attorney.id,
          state: coverage.state ?? null,
          zip_code: coverage.zipCode ?? null,
          county: coverage.county ?? null,
          is_active: coverage.isActive,
        })),
      );
      if (coverageInsertError) throw new Error("attorney coverage insert failed");
    }

    const periodMonth = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
    )
      .toISOString()
      .slice(0, 10);
    const { error: capacityError } = await supabase.from("attorney_capacity")
      .upsert({
      attorney_id: attorney.id,
      period_month: periodMonth,
      lead_cap: body.monthlyLeadCap ?? null,
      is_paused: !body.isActive,
      pause_reason: body.isActive ? null : "Attorney profile inactive",
    }, { onConflict: "attorney_id,period_month" });
    if (capacityError) throw new Error("attorney capacity upsert failed");

    await logAudit(supabase, {
      entityType: "attorney_partner",
      entityId: attorney.id,
      action: before ? "attorney_updated" : "attorney_created",
      actor,
      beforeState: before,
      afterState: attorney,
    });

    return json({ attorneyId: attorney.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "invalid json") return json({ error: "invalid json" }, 400);
    if (message === "unauthorized") return json({ error: "unauthorized" }, 401);
    if (message === "forbidden") return json({ error: "forbidden" }, 403);
    console.error("update-attorney-profile failed", error);
    return json({ error: "attorney update failed" }, 500);
  }
});
