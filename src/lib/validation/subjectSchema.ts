import { z } from "zod";

export const subjectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  icon: z.string().trim().min(1, "Icon is required."),
  color: z.string().trim().min(1, "Color is required."),
  order: z.number().int().min(0).optional(),
});

export type SubjectInputPayload = z.infer<typeof subjectInputSchema>;

export const subjectPatchSchema = subjectInputSchema.partial();

export const topicInputSchema = z.object({
  name: z.string().trim().min(1, "Topic name is required.").max(120),
});
