import type { ResourceCategory, ResourceType } from "@/types/resource";
import type { TicketPriority, TicketStatus, TicketType } from "@/types/ticket";

export const SESSION_COOKIE_NAME = "csh_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB — resource files
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB — ticket attachments

export interface SeedSubject {
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
}

export const SEED_SUBJECTS: SeedSubject[] = [
  { name: "Language and Literature", slug: "language-and-literature", icon: "BookOpen", color: "chart-1", order: 0 },
  { name: "Math (Extended)", slug: "math-extended", icon: "MathOps", color: "chart-2", order: 1 },
  { name: "Math (Standard)", slug: "math-standard", icon: "Calculator", color: "chart-3", order: 2 },
  { name: "INS", slug: "ins", icon: "Globe2", color: "chart-4", order: 3 },
  { name: "Physics", slug: "physics", icon: "Atom", color: "chart-5", order: 4 },
  { name: "Chemistry", slug: "chemistry", icon: "FlaskConical", color: "chart-1", order: 5 },
  { name: "Biology", slug: "biology", icon: "Dna", color: "chart-2", order: 6 },
  { name: "Design", slug: "design", icon: "PenTool", color: "chart-3", order: 7 },
  {
    name: "Physical and Health Education",
    slug: "physical-and-health-education",
    icon: "Barbell",
    color: "chart-4",
    order: 8,
  },
  { name: "Visual Arts", slug: "visual-arts", icon: "Palette", color: "chart-5", order: 9 },
  { name: "Spanish", slug: "spanish", icon: "Languages", color: "chart-1", order: 10 },
  { name: "Hindi", slug: "hindi", icon: "Languages", color: "chart-2", order: 11 },
  { name: "French", slug: "french", icon: "Languages", color: "chart-3", order: 12 },
  { name: "German", slug: "german", icon: "Languages", color: "chart-4", order: 13 },
  { name: "Personal Project", slug: "personal-project", icon: "Compass", color: "chart-5", order: 14 },
  {
    name: "School Books (IB MYP PDFs)",
    slug: "school-books",
    icon: "Books",
    color: "chart-1",
    order: 15,
  },
];

export const RESOURCE_CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "teacher-resources", label: "Teacher Resources" },
  { value: "student-notes", label: "Student Notes" },
  { value: "videos", label: "Videos" },
  { value: "past-papers", label: "Past Papers" },
  { value: "revision-sheets", label: "Revision Sheets" },
  { value: "worksheets", label: "Worksheets" },
  { value: "downloads", label: "Downloads" },
];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  pdf: "PDF",
  docx: "Word Document",
  pptx: "PowerPoint",
  xlsx: "Excel Spreadsheet",
  image: "Image",
  video: "Video",
  zip: "ZIP Archive",
  gdrive: "Google Drive",
  gdoc: "Google Docs",
  gslide: "Google Slides",
  gsheet: "Google Sheets",
  youtube: "YouTube",
  link: "External Link",
};

export const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: "broken-resource", label: "Broken Resource" },
  { value: "new-resource-request", label: "New Resource Request" },
  { value: "suggestion", label: "Suggestion" },
  { value: "bug-report", label: "Bug Report" },
  { value: "general-feedback", label: "General Feedback" },
  { value: "other", label: "Other" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const DAILY_FACT_TYPES: { value: "fact" | "quote" | "tip"; label: string }[] = [
  { value: "fact", label: "Academic Fact" },
  { value: "quote", label: "Motivational Quote" },
  { value: "tip", label: "Study Tip" },
];

export const STUDY_TIP_CATEGORIES: {
  value: "revision" | "exam-strategy" | "productivity" | "study-method";
  label: string;
}[] = [
  { value: "revision", label: "Revision Advice" },
  { value: "exam-strategy", label: "Exam Strategy" },
  { value: "productivity", label: "Productivity" },
  { value: "study-method", label: "Study Method" },
];
