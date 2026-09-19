import { z } from 'zod';

export const ACCOUNT_TYPES = ['FIX', 'VAR'] as const;

export const CreateAccountRequestSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sign: z.number(),
    account_type: z.enum(['FIX', 'VAR']),
    parent: z.number().int().positive().nullable(),
});

export const UpdateAccountRequestSchema = CreateAccountRequestSchema.partial();

// Schemas
export const AccountParentSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    sign: z.number(),
    account_type: z.string(),
});

export const AccountSchema = z.object({
    id: z.number().int().positive(),
    name: z.string(),
    sign: z.number(),
    account_type: z.string(),
    parent: z.union([AccountParentSchema, z.number().int().positive().transform(() => null)]).nullable(),
});

export const AccountsResponseSchema = z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(AccountSchema),
});

// Types
export type AccountParent = z.infer<typeof AccountParentSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;
export type UpdateAccountRequest = z.infer<typeof UpdateAccountRequestSchema>;
