export type ResourceCategory =
  | "teacher-resources"
  | "student-notes"
  | "videos"
  | "past-papers"
  | "revision-sheets"
  | "worksheets"
  | "downloads";

export type ResourceType =
  | "pdf"
  | "docx"
  | "pptx"
  | "xlsx"
  | "image"
  | "video"
  | "zip"
  | "gdrive"
  | "gdoc"
  | "gslide"
  | "gsheet"
  | "youtube"
  | "link";

export type SourceKind = "file" | "link";

export interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  /** Slug referencing an entry in the subject's `topics[]`, or null for "no topic". */
  topic: string | null;
  topicName: string | null;
  category: ResourceCategory;
  teacher: string | null;
  uploader: string;
  tags: string[];
  resourceType: ResourceType;
  sourceKind: SourceKind;
  fileUrl: string | null;
  filePath: string | null;
  fileSizeBytes: number | null;
  externalUrl: string | null;
  thumbnailUrl: string | null;
  featured: boolean;
  teacherRecommended: boolean;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ResourceInput {
  title: string;
  description: string;
  subjectId: string;
  /** Slug referencing an entry in the subject's `topics[]`, or omitted for "no topic". */
  topic?: string | null;
  category: ResourceCategory;
  teacher?: string | null;
  uploader: string;
  tags: string[];
  resourceType: ResourceType;
  sourceKind: SourceKind;
  fileUrl?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  externalUrl?: string | null;
  thumbnailUrl?: string | null;
  featured?: boolean;
  teacherRecommended?: boolean;
  pinned?: boolean;
}
