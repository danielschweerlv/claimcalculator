import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type LeadRow = {
  id: string;
  case_type: string;
  normalized_case_type?: string | null;
  zip_code?: string | null;
  normalized_zip?: string | null;
  state?: string | null;
  estimated_value_high?: number | null;
};

type AttorneyRow = {
  id: string;
  name: string;
  firm_name?: string | null;
  firm?: string | null;
  email: string;
  phone?: string | null;
  is_active: boolean;
  priority?: number | null;
  case_types_accepted?: string[] | null;
  zip_codes_covered?: string[] | null;
  max_leads_per_month?: number | null;
  monthly_lead_cap?: number | null;
  auto_forward_enabled?: boolean | null;
  last_assigned_at?: string | null;
};

export type AttorneyMatch = {
  attorney: AttorneyRow;
  score: number;
  reasons: string[];
  excluded: boolean;
  exclusionReasons: string[];
};

export type RoutingRule = {
  id: string;
  name: string;
  route_mode: "manual" | "best_match" | "round_robin_ready";
  target_attorney_id?: string | null;
  state?: string | null;
  zip_code?: string | null;
  priority: number;
  metadata?: Record<string, unknown> | null;
};

function currentPeriodMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString().slice(0, 10);
}

function normalizeCaseType(lead: LeadRow): string {
  return lead.normalized_case_type ?? lead.case_type;
}

function normalizeZip(lead: LeadRow): string | null {
  return lead.normalized_zip ?? lead.zip_code ?? null;
}

function stateFromZip(zip: string | null): string | null {
  if (!zip) return null;
  return /^(889|890|891|893|894|895|897|898)/.test(zip) ? "NV" : null;
}

export async function rankAttorneysForLead(
  supabase: SupabaseClient,
  leadId: string,
): Promise<{ lead: LeadRow; matches: AttorneyMatch[] }> {
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(
      "id,case_type,normalized_case_type,zip_code,normalized_zip,state,estimated_value_high",
    )
    .eq("id", leadId)
    .single();

  if (leadError || !lead) throw new Error("lead not found");

  const { data: attorneys, error: attorneyError } = await supabase
    .from("attorney_partners")
    .select("*")
    .eq("is_active", true);

  if (attorneyError) throw new Error("attorney lookup failed");

  const attorneyIds = (attorneys ?? []).map((attorney: AttorneyRow) =>
    attorney.id
  );
  const caseType = normalizeCaseType(lead);
  const zip = normalizeZip(lead);
  const state = lead.state ?? stateFromZip(zip);
  const monthStart = `${currentPeriodMonth()}T00:00:00.000Z`;
  const periodMonth = currentPeriodMonth();

  const [
    { data: caseRows },
    { data: coverageRows },
    { data: capacityRows },
    { data: assignmentRows },
  ] = await Promise.all([
    attorneyIds.length
      ? supabase.from("attorney_case_types").select(
        "attorney_id,case_type,is_active",
      ).in("attorney_id", attorneyIds)
      : Promise.resolve({ data: [] }),
    attorneyIds.length
      ? supabase.from("attorney_coverage").select(
        "attorney_id,state,zip_code,county,is_active",
      ).in("attorney_id", attorneyIds)
      : Promise.resolve({ data: [] }),
    attorneyIds.length
      ? supabase
        .from("attorney_capacity")
        .select("attorney_id,lead_cap,assigned_count,is_paused,pause_reason")
        .eq("period_month", periodMonth)
        .in("attorney_id", attorneyIds)
      : Promise.resolve({ data: [] }),
    attorneyIds.length
      ? supabase
        .from("lead_assignments")
        .select("attorney_id")
        .gte("assigned_at", monthStart)
        .in("attorney_id", attorneyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const normalizedCaseTypes = new Map<string, Set<string>>();
  for (const row of caseRows ?? []) {
    if (!row.is_active) continue;
    const set = normalizedCaseTypes.get(row.attorney_id) ?? new Set<string>();
    set.add(row.case_type);
    normalizedCaseTypes.set(row.attorney_id, set);
  }

  const normalizedCoverage = new Map<
    string,
    Array<
      { state?: string | null; zip_code?: string | null; is_active: boolean }
    >
  >();
  for (const row of coverageRows ?? []) {
    const rows = normalizedCoverage.get(row.attorney_id) ?? [];
    rows.push(row);
    normalizedCoverage.set(row.attorney_id, rows);
  }

  const capacity = new Map<
    string,
    {
      lead_cap?: number | null;
      assigned_count: number;
      is_paused: boolean;
      pause_reason?: string | null;
    }
  >();
  for (const row of capacityRows ?? []) {
    capacity.set(row.attorney_id, row);
  }

  const assignmentCounts = new Map<string, number>();
  for (const row of assignmentRows ?? []) {
    assignmentCounts.set(
      row.attorney_id,
      (assignmentCounts.get(row.attorney_id) ?? 0) + 1,
    );
  }

  const matches = (attorneys ?? []).map(
    (attorney: AttorneyRow): AttorneyMatch => {
      const reasons: string[] = [];
      const exclusionReasons: string[] = [];
      let score = attorney.priority ?? 0;

      const acceptedCaseTypes = normalizedCaseTypes.get(attorney.id);
      const legacyAccepted = attorney.case_types_accepted ?? [];
      const acceptsCaseType = acceptedCaseTypes?.has(caseType) ||
        legacyAccepted.includes(caseType);
      if (acceptsCaseType) {
        score += 40;
        reasons.push(`accepts ${caseType}`);
      } else {
        exclusionReasons.push(`does not accept ${caseType}`);
      }

      const coverage = normalizedCoverage.get(attorney.id) ?? [];
      const legacyZipCoverage = attorney.zip_codes_covered ?? [];
      const hasNoCoverageRules = coverage.length === 0 &&
        legacyZipCoverage.length === 0;
      const zipMatch = zip
        ? coverage.some((row) => row.is_active && row.zip_code === zip) ||
          legacyZipCoverage.includes(zip)
        : false;
      const stateMatch = state
        ? coverage.some((row) =>
          row.is_active && row.state === state && !row.zip_code
        )
        : false;
      const coversLead = hasNoCoverageRules || zipMatch || stateMatch;
      if (coversLead) {
        score += zipMatch ? 35 : stateMatch ? 20 : 10;
        reasons.push(
          zipMatch
            ? `covers ZIP ${zip}`
            : stateMatch
            ? `covers ${state}`
            : "no coverage restriction",
        );
      } else {
        exclusionReasons.push(
          zip ? `does not cover ${zip}` : "no lead ZIP/state to match",
        );
      }

      const cap = capacity.get(attorney.id);
      const leadCap = cap?.lead_cap ?? attorney.monthly_lead_cap ??
        attorney.max_leads_per_month ?? null;
      const assignedCount = Math.max(
        cap?.assigned_count ?? 0,
        assignmentCounts.get(attorney.id) ?? 0,
      );
      if (cap?.is_paused) {
        exclusionReasons.push(
          cap.pause_reason ? `paused: ${cap.pause_reason}` : "paused",
        );
      }
      if (leadCap != null && assignedCount >= leadCap) {
        exclusionReasons.push(
          `at monthly capacity ${assignedCount}/${leadCap}`,
        );
      } else {
        score += 15;
        reasons.push(
          leadCap == null
            ? "no monthly cap"
            : `capacity ${assignedCount}/${leadCap}`,
        );
      }

      if (attorney.auto_forward_enabled) {
        score += 5;
        reasons.push("auto-forward enabled");
      }

      return {
        attorney,
        score,
        reasons,
        excluded: exclusionReasons.length > 0,
        exclusionReasons,
      };
    },
  ).sort((a: AttorneyMatch, b: AttorneyMatch) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    return a.attorney.name.localeCompare(b.attorney.name);
  });

  return { lead, matches };
}

export function bestEligibleMatch(
  matches: AttorneyMatch[],
): AttorneyMatch | null {
  return matches.find((match) => !match.excluded) ?? null;
}

export async function findRoutingRuleForLead(
  supabase: SupabaseClient,
  leadId: string,
): Promise<RoutingRule | null> {
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("case_type,normalized_case_type,zip_code,normalized_zip,state")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) return null;

  const caseType = lead.normalized_case_type ?? lead.case_type;
  const zip = lead.normalized_zip ?? lead.zip_code ?? null;
  const state = lead.state ?? stateFromZip(zip);

  const { data: rules, error } = await supabase
    .from("routing_rules")
    .select(
      "id,name,route_mode,target_attorney_id,state,zip_code,priority,metadata",
    )
    .eq("is_active", true)
    .or(`case_type.is.null,case_type.eq.${caseType}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) return null;

  return ((rules ?? []) as RoutingRule[]).find((rule) => {
    const metadata = rule.metadata ?? {};
    const ruleState = rule.state ??
      (typeof metadata.state === "string" ? metadata.state : null);
    const ruleZip = rule.zip_code ??
      (typeof metadata.zip_code === "string" ? metadata.zip_code : null);
    return (!ruleState || ruleState === state) && (!ruleZip || ruleZip === zip);
  }) ?? null;
}

export function applyRoutingRule(
  matches: AttorneyMatch[],
  rule: RoutingRule | null,
): AttorneyMatch | null {
  if (!rule) return bestEligibleMatch(matches);
  if (rule.route_mode === "manual") return null;
  if (rule.target_attorney_id) {
    const targeted = matches.find((match) =>
      match.attorney.id === rule.target_attorney_id && !match.excluded
    );
    if (targeted) {
      targeted.reasons = [
        `routing rule: ${rule.name}`,
        ...targeted.reasons,
      ];
      targeted.score += 1000 + rule.priority;
      return targeted;
    }
  }
  return bestEligibleMatch(matches);
}
