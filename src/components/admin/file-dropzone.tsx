"use client";

import * as React from "react";
import { FileUp, Loader2, X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format-bytes";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { UploadedResourceFile } from "@/hooks/use-resource-upload";
import { ResourceIcon } from "@/components/resources/resource-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileDropzoneProps {
  file: UploadedResourceFile | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
}

export function FileDropzone({ file, uploading, progress, error, onUpload, onClear }: FileDropzoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (selected) onUpload(selected);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ResourceIcon type={file.resourceType} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.fileSizeBytes)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClear} aria-label="Remove file">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        aria-label="Upload a file"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging ? "border-primary bg-accent/40" : "border-border hover:border-primary/40 hover:bg-muted/40"
        )}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-foreground">
          {uploading ? "Uploading…" : "Drop a file here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, Word, PowerPoint, Excel, images, video, ZIP · up to {formatBytes(MAX_UPLOAD_BYTES)}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {uploading && progress > 0 && <Progress value={progress} className="h-1.5" />}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
