import { z } from "zod";
import { MoneySchema } from "@/_models/money.model";

// Schemas
export const PeriodSchema = z.object({
  id: z.number().int().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2050),
  total: MoneySchema,
  closed: z.boolean(),
  active: z.boolean(),
});

export const PeriodsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(PeriodSchema),
});

export const CreatePeriodRequestSchema = PeriodSchema.omit({ id: true });

export const UpdatePeriodRequestSchema = PeriodSchema.omit({
  id: true,
}).partial();

export const PeriodSummaryItemSchema = z.object({
  account_id: z.number(),
  account_name: z.string(),
  total: MoneySchema,
});

export const PeriodSummarySchema = z.array(PeriodSummaryItemSchema);

// Types
export type Period = z.infer<typeof PeriodSchema>;

export type PeriodSummaryItem = z.infer<typeof PeriodSummaryItemSchema>;

export type PeriodSummary = z.infer<typeof PeriodSummarySchema>;

export type CreatePeriodRequest = z.infer<typeof CreatePeriodRequestSchema>;

export type UpdatePeriodRequest = z.infer<typeof UpdatePeriodRequestSchema>;
