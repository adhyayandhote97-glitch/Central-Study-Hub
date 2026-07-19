import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { saveUpload } from "@/lib/storage-upload";
import { isFirebaseStorageConfigured } from "@/lib/firebase/admin";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";
import { detectFileType } from "@/lib/resource-type";
import { validateUploadFile } from "@/lib/upload-validation";

// Node runtime (default) — firebase-admin is not Edge-compatible.
export const runtime = "nodejs";

/** Admin-only resource file upload (gated to admins in middleware via /api/upload). */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    if (!isFirebaseStorageConfigured()) {
      return NextResponse.json(
        {
          error:
            "File uploads aren't available on this deployment. Add this resource as a Link instead (e.g. a Google Drive or YouTube URL).",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${formatBytes(MAX_UPLOAD_BYTES)}.` },
        { status: 400 }
      );
    }

    const typeCheck = validateUploadFile(file.name, "resource");
    if (!typeCheck.ok) {
      return NextResponse.json({ error: typeCheck.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(buffer, {
      folder: "resources",
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      fileUrl: saved.downloadUrl,
      filePath: saved.filePath,
      fileSizeBytes: saved.fileSizeBytes,
      resourceType: detectFileType(file.name),
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to upload file.");
  }
}
