"use client";

import * as React from "react";
import type { ResourceType } from "@/types/resource";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";

export interface UploadedResourceFile {
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileSizeBytes: number;
  resourceType: ResourceType;
}

interface UseResourceUploadResult {
  file: UploadedResourceFile | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  upload: (file: File) => Promise<void>;
  clear: () => void;
  setExisting: (file: UploadedResourceFile | null) => void;
}

export function useResourceUpload(): UseResourceUploadResult {
  const [file, setFile] = React.useState<UploadedResourceFile | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const upload = React.useCallback((selected: File) => {
    setError(null);
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large. Max size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return Promise.resolve();
    }

    setUploading(true);
    setProgress(0);

    // XHR (not fetch) so we can surface real upload progress for large files.
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        setUploading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setFile({
              fileName: selected.name,
              fileUrl: data.fileUrl,
              filePath: data.filePath,
              fileSizeBytes: data.fileSizeBytes,
              resourceType: data.resourceType,
            });
          } else {
            setError(data.error ?? "Upload failed.");
          }
        } catch {
          setError("Upload failed.");
        }
        resolve();
      });
      xhr.addEventListener("error", () => {
        setUploading(false);
        setError("Upload failed. Please try again.");
        resolve();
      });
      const formData = new FormData();
      formData.append("file", selected);
      xhr.send(formData);
    });
  }, []);

  const clear = React.useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
  }, []);

  return { file, uploading, progress, error, upload, clear, setExisting: setFile };
}
