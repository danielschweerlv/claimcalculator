import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { submitLeadSchema } from "./schema.ts";

const validBody = {
  caseType: "Motor Vehicle Accident",
  injuries: ["Broken or fractured bones"],
  fault: "Not my fault",
  when: "1\u20136 months ago",
  zipCode: "89101",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "7025551234",
  utm: { source: "google", medium: "cpc" },
  referrer: "https://google.com",
  website: "", // honeypot empty
};

Deno.test("schema accepts a valid payload", () => {
  const parsed = submitLeadSchema.parse(validBody);
  assertEquals(parsed.firstName, "Jane");
});

Deno.test("schema rejects missing email", () => {
  const bad = { ...validBody, email: undefined as unknown as string };
  const res = submitLeadSchema.safeParse(bad);
  assert(!res.success);
});

Deno.test("schema rejects bad email format", () => {
  const bad = { ...validBody, email: "not-an-email" };
  const res = submitLeadSchema.safeParse(bad);
  assert(!res.success);
});

Deno.test("schema rejects short phone", () => {
  const bad = { ...validBody, phone: "123" };
  const res = submitLeadSchema.safeParse(bad);
  assert(!res.success);
});

Deno.test("schema rejects populated honeypot", () => {
  const bad = { ...validBody, website: "spam.example.com" };
  const res = submitLeadSchema.safeParse(bad);
  assert(!res.success);
});

Deno.test("schema strips unknown fields", () => {
  const extra = { ...validBody, maliciousExtra: "drop table" };
  const parsed = submitLeadSchema.parse(extra);
  assert(!("maliciousExtra" in parsed));
});
