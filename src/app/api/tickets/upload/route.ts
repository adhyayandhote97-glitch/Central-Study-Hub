import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { saveUpload } from "@/lib/storage-upload";
import { isFirebaseStorageConfigured } from "@/lib/firebase/admin";
import { MAX_ATTACHMENT_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";
import { validateUploadFile } from "@/lib/upload-validation";

// Node runtime (default) — firebase-admin is not Edge-compatible.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["student", "admin"]);

    if (!isFirebaseStorageConfigured()) {
      return NextResponse.json(
        { error: "File attachments aren't available on this deployment." },
        { status: 503 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${formatBytes(MAX_ATTACHMENT_BYTES)}.` },
        { status: 400 }
      );
    }

    const typeCheck = validateUploadFile(file.name, "attachment");
    if (!typeCheck.ok) {
      return NextResponse.json({ error: typeCheck.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(buffer, {
      folder: "tickets",
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      attachmentUrl: saved.downloadUrl,
      attachmentPath: saved.filePath,
      fileSizeBytes: saved.fileSizeBytes,
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to upload attachment.");
  }
}
