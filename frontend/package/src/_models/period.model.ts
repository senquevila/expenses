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

const PeriodRefSchema = z.object({
  id: z.number(),
  year: z.number(),
  month: z.number(),
});

const CategorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
});

export const PeriodDashboardSchema = z.object({
  period: PeriodRefSchema,
  prev_period: PeriodRefSchema.nullable(),
  currency: z.string(),
  total_expenses: z.number(),
  total_income: z.number(),
  net_balance: z.number(),
  savings_rate: z.number(),
  prev_expenses: z.number(),
  prev_income: z.number(),
  mom_expenses: z.number().nullable(),
  mom_income: z.number().nullable(),
  daily_average: z.number(),
  top_categories: z.array(CategorySchema),
  distribution: z.array(CategorySchema),
  recurring_total: z.number(),
  one_off_total: z.number(),
  largest_expense: z
    .object({
      amount: z.number(),
      description: z.string().nullable(),
      account: z.string(),
      payment_date: z.string(),
    })
    .nullable(),
  daily: z.array(
    z.object({ day: z.string(), expenses: z.number(), income: z.number() }),
  ),
});

export type PeriodDashboard = z.infer<typeof PeriodDashboardSchema>;
