import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const yesNo = z.enum(["Yes", "No"]);

export const submitLeadSchema = z.object({
  // Case
  caseType: z.enum([
    "Motor Vehicle Accident",
    "Premises Liability",
    "Work Injury",
    "Product Liability",
    "Other",
  ]),
  accidentType: z.string().max(200).optional(),
  injuries: z.array(z.string().max(100)).default([]),
  fault: z
    .enum([
      "Not my fault",
      "Mostly other driver",
      "Shared / unclear",
      "Mostly me",
    ])
    .optional(),
  faultAtFault: yesNo.optional(),
  evInvolved: yesNo.optional(),
  commercialVehicle: yesNo.optional(),
  rideshareInvolved: yesNo.optional(),
  when: z
    .enum([
      "Less than 30 days ago",
      "1\u20136 months ago",
      "6\u201312 months ago",
      "Over a year ago",
    ])
    .optional(),
  reportedTo: z.array(z.string().max(100)).optional(),
  cameras: yesNo.optional(),
  witnesses: yesNo.optional(),
  surface: z.string().max(200).optional(),
  lighting: z.string().max(200).optional(),
  hasOwnInsurance: yesNo.optional(),
  myInsurer: z.string().max(200).optional(),
  otherInsurer: z.string().max(200).optional(),
  adjusterContacted: yesNo.optional(),
  hasLawyer: yesNo.optional(),
  onTheJob: yesNo.optional(),
  caseDescription: z.string().max(2000).optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),

  // Contact
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().email().max(200),
  phone: z
    .string()
    .max(50)
    .refine((v) => v.replace(/\D/g, "").length >= 7, {
      message: "phone must contain at least 7 digits",
    }),

  // Attribution
  utm: z
    .object({
      source: z.string().max(200).optional(),
      medium: z.string().max(200).optional(),
      campaign: z.string().max(200).optional(),
    })
    .default({}),
  referrer: z.string().max(500).optional(),

  // Honeypot: must be empty string or omitted
  website: z
    .string()
    .max(0, { message: "honeypot tripped" })
    .optional()
    .default(""),
}).strip();

export type SubmitLeadBody = z.infer<typeof submitLeadSchema>;
