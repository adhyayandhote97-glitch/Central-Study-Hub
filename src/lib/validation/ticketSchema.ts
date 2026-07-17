import { z } from "zod";

export const ticketTypeSchema = z.enum([
  "broken-resource",
  "new-resource-request",
  "suggestion",
  "bug-report",
  "general-feedback",
  "other",
]);

export const ticketPrioritySchema = z.enum(["low", "medium", "high"]);

export const ticketInputSchema = z
  .object({
    type: ticketTypeSchema,
    name: z.string().trim().max(120).optional().nullable(),
    isAnonymous: z.boolean(),
    subjectId: z.string().trim().min(1).optional().nullable(),
    title: z.string().trim().min(1, "Title is required.").max(150),
    description: z.string().trim().min(1, "Description is required.").max(3000),
    priority: ticketPrioritySchema,
    attachmentUrl: z.string().trim().url().optional().nullable(),
    attachmentPath: z.string().trim().min(1).optional().nullable(),
  })
  .refine((data) => data.isAnonymous || !data.name || data.name.trim().length > 0, {
    message: "Enter a name, or submit anonymously.",
    path: ["name"],
  });

export type TicketInputPayload = z.infer<typeof ticketInputSchema>;

export const ticketStatusSchema = z.enum(["open", "in-progress", "resolved", "closed"]);

export const ticketPatchSchema = z.object({
  status: ticketStatusSchema.optional(),
  adminReply: z.string().trim().max(3000).optional().nullable(),
  internalNotes: z.string().trim().max(3000).optional().nullable(),
});

export type TicketPatchPayload = z.infer<typeof ticketPatchSchema>;
