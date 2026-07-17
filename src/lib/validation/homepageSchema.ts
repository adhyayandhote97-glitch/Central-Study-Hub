import { z } from "zod";

export const dailyFactInputSchema = z.object({
  type: z.enum(["fact", "quote", "tip"]),
  text: z.string().trim().min(1, "Text is required.").max(600),
  author: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export type DailyFactInputPayload = z.infer<typeof dailyFactInputSchema>;
export const dailyFactPatchSchema = dailyFactInputSchema.partial();

export const studyTipInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150),
  body: z.string().trim().min(1, "Details are required.").max(1500),
  category: z.enum(["revision", "exam-strategy", "productivity", "study-method"]),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional().default(true),
});

export type StudyTipInputPayload = z.infer<typeof studyTipInputSchema>;
export const studyTipPatchSchema = studyTipInputSchema.partial();
