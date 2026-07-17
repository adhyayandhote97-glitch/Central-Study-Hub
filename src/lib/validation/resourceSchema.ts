import { z } from "zod";

export const resourceCategorySchema = z.enum([
  "teacher-resources",
  "student-notes",
  "videos",
  "past-papers",
  "revision-sheets",
  "worksheets",
  "downloads",
]);

export const resourceTypeSchema = z.enum([
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "image",
  "video",
  "zip",
  "gdrive",
  "gdoc",
  "gslide",
  "gsheet",
  "youtube",
  "link",
]);

const baseResourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  subjectId: z.string().min(1, "Choose a subject."),
  topic: z.string().trim().max(200).optional().nullable(),
  category: resourceCategorySchema,
  teacher: z.string().trim().max(120).optional().nullable(),
  uploader: z.string().trim().min(1, "Uploader is required.").max(120),
  tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  thumbnailUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  featured: z.boolean().optional().default(false),
  teacherRecommended: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
});

export const fileResourceSchema = baseResourceSchema.extend({
  sourceKind: z.literal("file"),
  resourceType: resourceTypeSchema,
  fileUrl: z.string().url("A valid file URL is required."),
  filePath: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

export const linkResourceSchema = baseResourceSchema.extend({
  sourceKind: z.literal("link"),
  externalUrl: z.string().trim().url("Enter a valid URL."),
});

export const resourceInputSchema = z.discriminatedUnion("sourceKind", [
  fileResourceSchema,
  linkResourceSchema,
]);

export type ResourceInputPayload = z.infer<typeof resourceInputSchema>;

export const resourcePatchSchema = baseResourceSchema.partial().extend({
  archived: z.boolean().optional(),
});

export type ResourcePatchPayload = z.infer<typeof resourcePatchSchema>;
