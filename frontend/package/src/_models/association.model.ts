import { z } from "zod";

export const CreateAssociationRequestSchema = z.object({
  account: z.number().int().positive("Please select an account"),
  token: z.string().min(1, "Token is required"),
});

export const UpdateAssociationRequestSchema =
  CreateAssociationRequestSchema.partial();

export const AssociationSchema = z.object({
  id: z.number().int().positive(),
  token: z.string(),
  account: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
});

export const AssociationsListSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(AssociationSchema),
});

export type Association = z.infer<typeof AssociationSchema>;
export type CreateAssociationRequest = z.infer<
  typeof CreateAssociationRequestSchema
>;
export type UpdateAssociationRequest = z.infer<
  typeof UpdateAssociationRequestSchema
>;
