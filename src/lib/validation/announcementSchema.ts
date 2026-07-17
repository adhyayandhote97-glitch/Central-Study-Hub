import { z } from "zod";

export const announcementInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150),
  body: z.string().trim().min(1, "Message is required.").max(2000),
  pinned: z.boolean().optional().default(false),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
});

export type AnnouncementInputPayload = z.infer<typeof announcementInputSchema>;

export const announcementPatchSchema = announcementInputSchema.partial();
