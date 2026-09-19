import { z } from "zod";

// Money Schema
export const MoneySchema = z.object({
  value: z.coerce.number(),
  currency: z.string().length(3),
});

// Types
export type Money = z.infer<typeof MoneySchema>;
