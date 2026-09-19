import { z } from "zod";
import { MoneySchema } from "@/_models/money.model";

// Schemas
export const LoanSchema = z.object({
  id: z.number().int().positive(),
  amount: MoneySchema,
  monthly_payment: MoneySchema,
  description: z.string(),
  start_date: z.string(),
  end_date: z.string().nullish(),
  months: z.number().int().positive(),
  is_active: z.boolean(),
  bank: z.string(),
  currency: z.number().int().positive(),
});

export const LoansResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(LoanSchema),
});

export const CreateLoanRequestSchema = z.object({
  description: z.string(),
  bank: z.string(),
  amount: z.number(),
  monthly_payment: z.number(),
  start_date: z.string(),
  months: z.number().int().positive(),
  is_active: z.boolean(),
  currency: z.number().int().positive(),
});

export const UpdateLoanRequestSchema = CreateLoanRequestSchema.partial();

export const ToggleResponseSchema = z.object({
  is_active: z.boolean(),
});

export const LoanSummarySchema = z.object({
  monthly: MoneySchema,
  remaining: MoneySchema,
});

// Types
export type Loan = z.infer<typeof LoanSchema>;
export type LoanSummary = z.infer<typeof LoanSummarySchema>;
export type CreateLoanRequest = z.infer<typeof CreateLoanRequestSchema>;
export type UpdateLoanRequest = z.infer<typeof UpdateLoanRequestSchema>;
