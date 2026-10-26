import { z } from "zod";

export const UPLOAD_TYPES = [
  {
    value: "credit_card",
    label: "Credit card",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "savings_account",
    label: "Savings account",
    color: "bg-teal-100 text-teal-800",
  },
] as const;

export type UploadTypeValue = (typeof UPLOAD_TYPES)[number]["value"];

export const UploadSchema = z.object({
  id: z.number().int().positive(),
  created: z.string(),
  modified: z.string().nullable(),
  file: z.string().nullable(),
  result: z.unknown().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  fails: z.unknown().nullable(),
  upload_type: z.string().nullable(),
  upload_status: z.string(),
  identifier: z.string().nullable().optional(),
});

export const UploadsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(UploadSchema),
});

export const CreateUploadRequestSchema = z.object({
  file: z.custom<File>((v) => v instanceof File, {
    message: "File is required",
  }),
  upload_type: z.enum(["credit_card", "savings_account"]),
  row_start: z.number().int().nonnegative().optional(),
  row_end: z.number().int().nonnegative().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const Step1UploadSchema = z.object({
  id: z.number().int().positive(),
  file: z.string().nullable(),
});

export const UploadTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  upload_type: z.enum(["CREDIT_CARD", "SAVINGS_ACCOUNT"]),
  row_start: z.number(),
  active: z.boolean(),
  columns: z.object({
    date: z.number(),
    description: z.number(),
    currencyCol: z.number().optional(),
    amounts: z.array(
      z.object({
        col: z.number(),
        kind: z.enum(["debit", "credit"]),
        currency: z.string().optional(),
      }),
    ),
  }),
});

// Types
export type UploadTemplate = z.infer<typeof UploadTemplateSchema>;
export type UploadTemplateRequest = Omit<UploadTemplate, "id">;
export type Upload = z.infer<typeof UploadSchema>;
export type Step1Upload = z.infer<typeof Step1UploadSchema>;
export type CreateUploadRequest = z.infer<typeof CreateUploadRequestSchema>;

export const UploadGapsSchema = z.array(
  z.object({
    identifier: z.string(),
    gaps: z.array(
      z.object({ from: z.string(), to: z.string(), days: z.number() }),
    ),
  }),
);

export type UploadGaps = z.infer<typeof UploadGapsSchema>;
