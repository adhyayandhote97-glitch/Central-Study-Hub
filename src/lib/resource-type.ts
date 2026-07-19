import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link2,
  Presentation,
  Video,
  SquarePlay,
  HardDrive,
  type LucideIcon,
} from "@/components/icons";
import type { ResourceType } from "@/types/resource";

const EXTENSION_MAP: Record<string, ResourceType> = {
  pdf: "pdf",
  doc: "docx",
  docx: "docx",
  ppt: "pptx",
  pptx: "pptx",
  xls: "xlsx",
  xlsx: "xlsx",
  csv: "xlsx",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
  avi: "video",
  mkv: "video",
  zip: "zip",
  rar: "zip",
  "7z": "zip",
};

/** Detects a resource type from an uploaded file's name. */
export function detectFileType(filename: string): ResourceType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? "link";
}

/** Detects a resource type from a pasted external URL. */
export function detectLinkType(url: string): ResourceType {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "link";
  }
  const host = parsed.hostname.toLowerCase();

  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("docs.google.com")) {
    if (url.includes("/presentation")) return "gslide";
    if (url.includes("/spreadsheets")) return "gsheet";
    if (url.includes("/document")) return "gdoc";
    return "gdoc";
  }
  if (host.includes("drive.google.com")) return "gdrive";

  // A direct link to a file hosted elsewhere (e.g. a school website) — preview
  // it the same way an upload of that file type would be previewed.
  const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? "link";
}

export const RESOURCE_ICON_MAP: Record<ResourceType, LucideIcon> = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  image: ImageIcon,
  video: Video,
  zip: FileArchive,
  gdrive: HardDrive,
  gdoc: FileText,
  gslide: Presentation,
  gsheet: FileSpreadsheet,
  youtube: SquarePlay,
  link: Link2,
};

export function getResourceIcon(type: ResourceType): LucideIcon {
  return RESOURCE_ICON_MAP[type] ?? Link2;
}

/** Whether this resource type can be embedded in an inline preview. */
export function isPreviewable(type: ResourceType): boolean {
  return type !== "docx" && type !== "pptx" && type !== "xlsx" && type !== "zip";
}
