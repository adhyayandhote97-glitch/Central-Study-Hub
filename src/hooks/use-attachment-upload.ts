"use client";

import * as React from "react";
import { MAX_ATTACHMENT_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";

interface UploadedAttachment {
  fileName: string;
  attachmentUrl: string;
  attachmentPath: string;
}

interface UseAttachmentUploadResult {
  attachment: UploadedAttachment | null;
  uploading: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
  clear: () => void;
}

export function useAttachmentUpload(): UseAttachmentUploadResult {
  const [attachment, setAttachment] = React.useState<UploadedAttachment | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const upload = React.useCallback(async (file: File) => {
    setError(null);
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError(`File is too large. Max size is ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tickets/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");

      setAttachment({
        fileName: file.name,
        attachmentUrl: data.attachmentUrl,
        attachmentPath: data.attachmentPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const clear = React.useCallback(() => {
    setAttachment(null);
    setError(null);
  }, []);

  return { attachment, uploading, error, upload, clear };
}
