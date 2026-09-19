import { z } from "zod";
import { AccountSchema } from "@/_models/account.model";
import { PeriodSchema } from "@/_models/period.model";
import { MoneySchema } from "@/_models/money.model";

// Schemas
export const TransactionSchema = z.object({
  id: z.number().int().positive(),
  period: PeriodSchema,
  account: AccountSchema,
  description: z.string().nullable(),
  amount: MoneySchema,
  local_amount: MoneySchema,
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  created: z.string(),
  modified: z.string().nullable(),
  identifier: z.string().nullable(),
  upload: z.unknown().nullable(),
});

export const TransactionsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(TransactionSchema),
});

export const CreateTransactionRequestSchema = z.object({
  period: z.number().int().positive(),
  account: z.number().int().positive(),
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  description: z.string().nullable(),
  amount: z.number(),
  currency: z.number().int().positive(),
});

export const UpdateTransactionRequestSchema =
  CreateTransactionRequestSchema.partial();

// Types
export type Transaction = z.infer<typeof TransactionSchema>;

export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>;

export type CreateTransactionRequest = z.infer<
  typeof CreateTransactionRequestSchema
>;

export type UpdateTransactionRequest = z.infer<
  typeof UpdateTransactionRequestSchema
>;
