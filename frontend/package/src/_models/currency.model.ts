import { z } from 'zod';

export const CurrencySchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    alpha3: z.string(),
});

export const CurrenciesResponseSchema = z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(CurrencySchema),
});

export type Currency = z.infer<typeof CurrencySchema>;
