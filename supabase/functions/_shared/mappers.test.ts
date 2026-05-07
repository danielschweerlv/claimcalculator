import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isNonNvZip, mapCaseType, mapFault } from "./mappers.ts";

Deno.test("mapCaseType translates display strings to enum", () => {
  assertEquals(mapCaseType("Motor Vehicle Accident"), "motor_vehicle");
  assertEquals(mapCaseType("Premises Liability"), "premises_liability");
  assertEquals(mapCaseType("Work Injury"), "work_injury");
  assertEquals(mapCaseType("Product Liability"), "product_liability");
  assertEquals(mapCaseType("Other"), "other");
});

Deno.test("mapFault translates fault display strings", () => {
  assertEquals(mapFault("Not my fault"), "not_at_fault");
  assertEquals(mapFault("Mostly other driver"), "not_at_fault");
  assertEquals(mapFault("Shared / unclear"), "partial_fault");
  assertEquals(mapFault("Mostly me"), "at_fault");
  assertEquals(mapFault(undefined), "unknown");
});

Deno.test("isNonNvZip flags zips outside Nevada prefixes", () => {
  assertEquals(isNonNvZip("89101"), false); // Las Vegas
  assertEquals(isNonNvZip("89501"), false); // Reno
  assertEquals(isNonNvZip("89701"), false); // Carson City
  assertEquals(isNonNvZip("10001"), true); // NYC
  assertEquals(isNonNvZip("90210"), true); // Beverly Hills
  assertEquals(isNonNvZip(undefined), false); // no zip = don't flag
  assertEquals(isNonNvZip(""), false);
});
