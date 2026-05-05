import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const uuid = z.string().uuid();
const caseType = z.enum([
  "motor_vehicle",
  "premises_liability",
  "work_injury",
  "product_liability",
  "other",
]);
const routeMode = z.enum(["manual", "best_match", "round_robin_ready"]);

export const matchAttorneysSchema = z.object({
  leadId: uuid,
}).strip();

export const adminAssignLeadSchema = z.object({
  leadId: uuid,
  attorneyId: uuid,
  routingReason: z.string().max(500).optional(),
  forward: z.boolean().optional().default(false),
}).strip();

export const forwardLeadSchema = z.object({
  leadId: uuid,
  attorneyId: uuid,
  assignmentId: uuid.optional(),
  processNow: z.boolean().optional().default(false),
  templateKey: z.string().max(100).optional().default("attorney-lead-forward"),
}).strip();

export const processLeadRoutingSchema = z.object({
  leadId: uuid.optional(),
  routeMode: routeMode.optional().default("best_match"),
  forward: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(25).optional().default(5),
}).strip();

export const updateAttorneyProfileSchema = z.object({
  attorneyId: uuid.optional(),
  name: z.string().trim().min(1).max(200),
  firmName: z.string().trim().max(200).optional().nullable(),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().min(0).optional().default(0),
  notes: z.string().max(2000).optional().nullable(),
  pricePerLead: z.number().int().min(0).optional().nullable(),
  monthlyLeadCap: z.number().int().min(0).optional().nullable(),
  autoForwardEnabled: z.boolean().optional().default(false),
  caseTypes: z.array(caseType).optional().default([]),
  coverage: z.array(
    z.object({
      state: z.string().regex(/^[A-Z]{2}$/).optional(),
      zipCode: z.string().regex(/^\d{5}$/).optional(),
      county: z.string().max(120).optional(),
      isActive: z.boolean().optional().default(true),
    }).refine((v) => v.state || v.zipCode || v.county, {
      message: "coverage requires state, zipCode, or county",
    }),
  ).optional().default([]),
}).strip();

export const retryMessageSchema = z.object({
  messageId: uuid,
  processNow: z.boolean().optional().default(false),
}).strip();

export const processOutboundQueueSchema = z.object({
  limit: z.number().int().min(1).max(25).optional().default(5),
}).strip();
