/**
 * Server-side file-type validation for uploads. The browser can lie about a
 * file's MIME type, and Firebase Storage serves uploaded files back over HTTP,
 * so an uploaded .html or .svg could execute script in the Storage origin.
 * We therefore validate by extension against an allowlist and reject a hard
 * denylist of active/executable types regardless of the claimed MIME type.
 */

// Types that can execute script or code if a browser is coaxed into rendering
// them inline. Always rejected, on every upload surface.
const DANGEROUS_EXTENSIONS = new Set([
  "html", "htm", "xhtml", "shtml", "svg", "svgz", "xml", "js", "mjs", "cjs",
  "wasm", "exe", "bat", "cmd", "com", "msi", "scr", "sh", "bash", "zsh",
  "app", "dmg", "pkg", "deb", "rpm", "apk", "jar", "php", "phtml", "php3",
  "php4", "php5", "jsp", "asp", "aspx", "cshtml", "cgi", "pl", "py", "rb",
  "dll", "so", "dylib", "vbs", "ps1", "hta", "swf",
]);

// Study resources an admin may upload.
const RESOURCE_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "pps", "ppsx", "xls", "xlsx", "csv",
  "txt", "rtf", "odt", "odp", "ods", "md", "epub",
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff", "heic",
  "mp4", "webm", "mov", "m4v", "avi", "mkv",
  "mp3", "wav", "m4a", "ogg", "aac", "flac",
  "zip",
]);

// The narrower set a student may attach to a ticket: images + PDF only.
const ATTACHMENT_EXTENSIONS = new Set([
  "pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp", "heic",
]);

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase().trim();
}

export type UploadKind = "resource" | "attachment";

export interface UploadValidationResult {
  ok: boolean;
  error?: string;
}

export function validateUploadFile(filename: string, kind: UploadKind): UploadValidationResult {
  const ext = extensionOf(filename);
  if (!ext) {
    return { ok: false, error: "This file has no extension and can't be accepted." };
  }
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { ok: false, error: `For safety, .${ext} files can't be uploaded.` };
  }
  const allow = kind === "attachment" ? ATTACHMENT_EXTENSIONS : RESOURCE_EXTENSIONS;
  if (!allow.has(ext)) {
    const hint =
      kind === "attachment"
        ? "Attachments must be an image or a PDF."
        : "That file type isn't supported for resources.";
    return { ok: false, error: `${hint} (.${ext} isn't allowed.)` };
  }
  return { ok: true };
}
