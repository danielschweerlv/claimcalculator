import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type CalcInput, calcSettlement } from "./calc-settlement.ts";

// ── Ratio floor test: withAvg must be ≥ 4.5 × withoutAvg on every
// reasonable input. We exercise a cartesian grid of ~200 cases.
Deno.test("calcSettlement enforces 4.5x ratio floor across input grid", () => {
  const caseTypes: CalcInput["caseType"][] = [
    "Motor Vehicle Accident",
    "Premises Liability",
    "Work Injury",
    "Product Liability",
    "Other",
  ];
  const injurySets: string[][] = [
    ["Body aches & pain"],
    ["Broken or fractured bones"],
    ["Surgery required", "Brain injury"],
    ["Scarring", "Memory loss"],
  ];
  const faults: CalcInput["fault"][] = [
    "Not my fault",
    "Mostly other driver",
    "Shared / unclear",
  ]; // "Mostly me" is fault-barred and produces 0s — excluded from ratio check
  const whens: CalcInput["when"][] = [
    "Less than 30 days ago",
    "1\u20136 months ago",
    "6\u201312 months ago",
    "Over a year ago",
  ];
  const yesNos: ("Yes" | "No")[] = ["Yes", "No"];

  let checked = 0;
  for (const caseType of caseTypes) {
    for (const injuries of injurySets) {
      for (const fault of faults) {
        for (const when of whens) {
          for (const ev of yesNos) {
            const result = calcSettlement({
              caseType,
              injuries,
              fault,
              when,
              evInvolved: ev,
              commercialVehicle: "No",
              cameras: "No",
              witnesses: "No",
              surface: "",
              lighting: "",
              otherInsurer: "GEICO",
              onTheJob: "No",
              faultAtFault: "No",
            });
            if (result.faultBarred) continue;
            const withAvg = (result.withLow + result.withHigh) / 2;
            const withoutAvg = (result.withoutLow + result.withoutHigh) / 2;
            assert(
              withAvg >= 4.5 * withoutAvg,
              `Ratio floor violated for ${
                JSON.stringify({ caseType, injuries, fault, when, ev })
              }: ${withAvg} / ${withoutAvg} = ${
                (withAvg / withoutAvg).toFixed(2)
              }`,
            );
            checked++;
          }
        }
      }
    }
  }
  assert(checked > 100, `Expected >100 grid points; checked ${checked}`);
});

Deno.test("calcSettlement returns zeros when fault barred", () => {
  const r = calcSettlement({
    caseType: "Motor Vehicle Accident",
    injuries: ["Broken or fractured bones"],
    fault: "Mostly me",
    when: "1\u20136 months ago",
  });
  assert(r.faultBarred);
  assertEquals(r.withLow, 0);
  assertEquals(r.withHigh, 0);
  assertEquals(r.withoutLow, 0);
  assertEquals(r.withoutHigh, 0);
});

Deno.test("calcSettlement floors low values appropriately", () => {
  // Minimal-injury case — without-low should floor at 500, with-low at 5000.
  const r = calcSettlement({
    caseType: "Motor Vehicle Accident",
    injuries: ["I was not injured"],
    fault: "Not my fault",
    when: "Over a year ago",
  });
  assert(r.withLow >= 5000);
  assert(r.withoutLow >= 500);
});
