import "server-only";
import { getAdminStorage } from "@/lib/firebase/admin";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-120);
}

function buildDownloadUrl(bucketName: string, filePath: string, token: string): string {
  const encodedPath = encodeURIComponent(filePath);
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const base = emulatorHost
    ? `http://${emulatorHost}/v0/b/${bucketName}/o`
    : `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o`;
  return `${base}/${encodedPath}?alt=media&token=${token}`;
}

export interface SavedUpload {
  downloadUrl: string;
  filePath: string;
  fileSizeBytes: number;
}

/**
 * Streams a file to Firebase Storage via the Admin SDK and returns a
 * permanent, tokenized download URL. Uploads are proxied through a Route
 * Handler (rather than a client-side signed-URL PUT) so the browser never
 * touches the Storage SDK, Storage rules can stay deny-all, and the exact
 * same path works against the local emulator and real Firebase.
 */
export async function saveUpload(
  buffer: Buffer,
  options: { folder: "resources" | "tickets"; filename: string; contentType: string }
): Promise<SavedUpload> {
  const bucket = getAdminStorage().bucket();
  const filePath = `${options.folder}/${crypto.randomUUID()}-${sanitizeFilename(options.filename)}`;
  const file = bucket.file(filePath);
  const token = crypto.randomUUID();

  await file.save(buffer, {
    contentType: options.contentType || "application/octet-stream",
    resumable: false,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });

  return {
    downloadUrl: buildDownloadUrl(bucket.name, filePath, token),
    filePath,
    fileSizeBytes: buffer.length,
  };
}

export async function deleteUpload(filePath: string): Promise<void> {
  await getAdminStorage().bucket().file(filePath).delete({ ignoreNotFound: true });
}
