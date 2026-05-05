// Pure valuation logic — no IO, no runtime deps. Imported by both the
// submit-lead edge function (Deno) and the React client (Vite re-export).
//
// Hard constraint: withAvg >= 4.5 * withoutAvg on every non-barred input.
// Enforced structurally by the multipliers below (not a post-hoc clamp).

export type CalcInput = {
  caseType:
    | "Motor Vehicle Accident"
    | "Premises Liability"
    | "Work Injury"
    | "Product Liability"
    | "Other";
  injuries?: string[];
  fault?:
    | "Not my fault"
    | "Mostly other driver"
    | "Shared / unclear"
    | "Mostly me";
  faultAtFault?: "Yes" | "No";
  evInvolved?: "Yes" | "No";
  commercialVehicle?: "Yes" | "No";
  when?:
    | "Less than 30 days ago"
    | "1\u20136 months ago"
    | "6\u201312 months ago"
    | "Over a year ago";
  otherInsurer?: string;
  cameras?: "Yes" | "No";
  witnesses?: "Yes" | "No";
  surface?: string;
  lighting?: string;
  onTheJob?: "Yes" | "No";
};

export type CalcResult = {
  faultBarred: boolean;
  withLow: number;
  withHigh: number;
  withoutLow: number;
  withoutHigh: number;
};

export function calcSettlement(data: CalcInput): CalcResult {
  const injuries = data.injuries ?? [];
  let injScore = 0;

  injuries.forEach((inj) => {
    if (["Body aches & pain", "Cuts, scrapes & bruises"].includes(inj)) {
      injScore = Math.max(injScore, 1);
    }
    if (
      [
        "Broken or fractured bones",
        "Scarring",
        "Internal bleeding",
        "Memory loss",
      ]
        .includes(inj)
    ) {
      injScore = Math.max(injScore, 3);
    }
    if (
      [
        "Surgery required",
        "Brain injury",
        "Loss of internal organs",
        "Coma",
        "Paralysis",
        "Amputation",
      ].includes(inj)
    ) {
      injScore = Math.max(injScore, 6);
    }
  });
  if (injuries.includes("I was not injured")) injScore = 0;
  if (injScore === 0 && injuries.length === 0) injScore = 1;

  const faultMap: Record<string, number> = {
    "Not my fault": 1.0,
    "Mostly other driver": 0.8,
    "Shared / unclear": 0.6,
    "Mostly me": 0.25,
  };

  let fM = 0.8;
  if (data.caseType === "Motor Vehicle Accident") {
    fM = faultMap[data.fault ?? ""] ?? 0.8;
  } else {
    fM = data.faultAtFault === "Yes" ? 0.4 : 1.0;
  }
  const faultBarred = data.caseType === "Motor Vehicle Accident" &&
    fM <= 0.25 &&
    data.fault === "Mostly me";

  const whenMap: Record<string, number> = {
    "Less than 30 days ago": 1.1,
    "1\u20136 months ago": 1.0,
    "6\u201312 months ago": 0.95,
    "Over a year ago": 0.85,
  };

  const otherInsM =
    data.otherInsurer === "They Have No Insurance / I Don't Know" ? 0.7 : 1.0;
  const evM = data.evInvolved === "Yes" ? 1.12 : 1.0;
  const commM = data.commercialVehicle === "Yes" ? 1.18 : 1.0;
  const onJobM = data.onTheJob === "Yes" ? 1.15 : 1.0;
  const cameraM = data.cameras === "Yes" ? 1.08 : 1.0;
  const witnessM = data.witnesses === "Yes" ? 1.08 : 1.0;
  const surfaceM = data.surface === "No, it was uneven or sloped" ? 1.1 : 1.0;
  const lightingM = data.lighting === "No, it was poorly lit" ? 1.1 : 1.0;

  const tM = whenMap[data.when ?? ""] ?? 1.0;
  const baseMed = injScore * 8000 + 4000;
  const pain = baseMed * (injScore || 1.5);
  const prop = Math.round(baseMed * 0.35);

  let base: number;
  if (data.caseType === "Motor Vehicle Accident") {
    base = (baseMed + pain + prop) * fM * tM * otherInsM * evM * commM;
  } else {
    base = (baseMed + pain + prop) * fM * tM * onJobM * cameraM * witnessM *
      surfaceM * lightingM;
  }

  if (faultBarred) {
    return {
      faultBarred,
      withLow: 0,
      withHigh: 0,
      withoutLow: 0,
      withoutHigh: 0,
    };
  }

  // ── Ratio enforcement ────────────────────────────────────────────────
  // Previous multipliers gave withAvg/withoutAvg ≈ 4.47 — just under 4.5.
  // Retuned: "with" range slightly widened (1.6–3.0) and "without" range
  // slightly narrowed (0.28–0.56). New midpoints: with=2.3*base, without=
  // 0.42*base → ratio ≈ 5.48. Verified by the grid test.
  const withLow = Math.max(Math.round(base * 1.6), 5000);
  const withHigh = Math.round(base * 3.0);
  const withoutLow = Math.max(Math.round(base * 0.28), 500);
  const withoutHigh = Math.round(base * 0.56);

  return { faultBarred, withLow, withHigh, withoutLow, withoutHigh };
}
