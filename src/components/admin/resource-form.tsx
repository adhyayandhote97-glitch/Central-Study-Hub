"use client";

import * as React from "react";
import { Link2, Loader2, Upload } from "@/components/icons";
import { toast } from "sonner";
import type { Resource, ResourceCategory } from "@/types/resource";
import type { Subject } from "@/types/subject";
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { detectLinkType } from "@/lib/resource-type";
import { isStorageAvailableClient } from "@/lib/storage-availability";
import { useResourceUpload } from "@/hooks/use-resource-upload";
import { FileDropzone } from "./file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResourceFormProps {
  subjects: Subject[];
  resource?: Resource;
  onSaved: (resource: Resource) => void;
  onCancel?: () => void;
}

export function ResourceForm({ subjects, resource, onSaved, onCancel }: ResourceFormProps) {
  const isEdit = Boolean(resource);
  const upload = useResourceUpload();
  const storageAvailable = isStorageAvailableClient();

  const [sourceKind, setSourceKind] = React.useState<"file" | "link">(
    resource?.sourceKind ?? (storageAvailable ? "file" : "link")
  );
  const [externalUrl, setExternalUrl] = React.useState(resource?.externalUrl ?? "");
  const [title, setTitle] = React.useState(resource?.title ?? "");
  const [description, setDescription] = React.useState(resource?.description ?? "");
  const [subjectId, setSubjectId] = React.useState(resource?.subjectId ?? "");
  const [topic, setTopic] = React.useState(resource?.topic ?? "none");
  const [category, setCategory] = React.useState<ResourceCategory>(resource?.category ?? "teacher-resources");
  const [teacher, setTeacher] = React.useState(resource?.teacher ?? "");
  const [uploader, setUploader] = React.useState(resource?.uploader ?? "");
  const [tags, setTags] = React.useState(resource?.tags.join(", ") ?? "");
  const [thumbnailUrl, setThumbnailUrl] = React.useState(resource?.thumbnailUrl ?? "");
  const [featured, setFeatured] = React.useState(resource?.featured ?? false);
  const [teacherRecommended, setTeacherRecommended] = React.useState(resource?.teacherRecommended ?? false);
  const [pinned, setPinned] = React.useState(resource?.pinned ?? false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (resource?.sourceKind === "file" && resource.fileUrl && resource.filePath) {
      upload.setExisting({
        fileName: resource.title,
        fileUrl: resource.fileUrl,
        filePath: resource.filePath,
        fileSizeBytes: resource.fileSizeBytes ?? 0,
        resourceType: resource.resourceType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const detectedLinkType = externalUrl.trim() ? detectLinkType(externalUrl.trim()) : null;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!subjectId) next.subjectId = "Choose a subject.";
    if (!uploader.trim()) next.uploader = "Uploader is required.";
    if (sourceKind === "file" && !upload.file) next.file = "Upload a file, or switch to a link.";
    if (sourceKind === "link") {
      try {
        new URL(externalUrl.trim());
      } catch {
        next.externalUrl = "Enter a valid URL (including https://).";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const base = {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        topic: topic === "none" ? null : topic,
        category,
        teacher: teacher.trim() || null,
        uploader: uploader.trim(),
        tags: tagList,
        thumbnailUrl: thumbnailUrl.trim() || null,
        featured,
        teacherRecommended,
        pinned,
      };

      const payload =
        sourceKind === "file"
          ? {
              ...base,
              sourceKind: "file" as const,
              resourceType: upload.file!.resourceType,
              fileUrl: upload.file!.fileUrl,
              filePath: upload.file!.filePath,
              fileSizeBytes: upload.file!.fileSizeBytes,
            }
          : { ...base, sourceKind: "link" as const, externalUrl: externalUrl.trim() };

      const res = await fetch(isEdit ? `/api/resources/${resource!.id}` : "/api/resources", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save resource.");

      toast.success(isEdit ? "Resource updated." : "Resource added.");
      onSaved(data.resource);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save resource.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {!isEdit && storageAvailable && (
        <Tabs value={sourceKind} onValueChange={(v) => setSourceKind(v as "file" | "link")}>
          <TabsList>
            <TabsTrigger value="file">
              <Upload className="size-4" aria-hidden="true" />
              Upload file
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link2 className="size-4" aria-hidden="true" />
              Add link
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {sourceKind === "file" ? (
        <div className="space-y-1.5">
          {!isEdit && <Label>File</Label>}
          <FileDropzone
            file={upload.file}
            uploading={upload.uploading}
            progress={upload.progress}
            error={upload.error ?? errors.file ?? null}
            onUpload={upload.upload}
            onClear={upload.clear}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="externalUrl">Link URL</Label>
          {!isEdit && !storageAvailable && (
            <p className="text-xs text-muted-foreground">
              File uploads are disabled on this deployment — paste a Google Drive, Google Docs/Slides/Sheets, or YouTube link instead.
            </p>
          )}
          <Input
            id="externalUrl"
            type="url"
            placeholder="https://…  (Drive, Docs, Slides, Sheets, YouTube, or any site)"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            aria-invalid={Boolean(errors.externalUrl)}
          />
          {detectedLinkType && (
            <p className="text-xs text-muted-foreground">
              Detected type: {RESOURCE_TYPE_LABELS[detectedLinkType]}
            </p>
          )}
          {errors.externalUrl && (
            <p role="alert" className="text-sm text-destructive">
              {errors.externalUrl}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(errors.title)} />
        {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={subjectId}
            onValueChange={(v) => {
              setSubjectId(v);
              setTopic("none");
            }}
          >
            <SelectTrigger id="subject" className="w-full" aria-invalid={Boolean(errors.subjectId)}>
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subjectId && <p role="alert" className="text-sm text-destructive">{errors.subjectId}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="topic">Topic (optional)</Label>
          <Select value={topic} onValueChange={setTopic} disabled={!selectedSubject?.topics.length}>
            <SelectTrigger id="topic" className="w-full">
              <SelectValue placeholder="No topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No topic</SelectItem>
              {selectedSubject?.topics.map((t) => (
                <SelectItem key={t.slug} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="teacher">Teacher (optional)</Label>
          <Input id="teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="uploader">Uploader</Label>
          <Input id="uploader" value={uploader} onChange={(e) => setUploader(e.target.value)} aria-invalid={Boolean(errors.uploader)} />
          {errors.uploader && <p role="alert" className="text-sm text-destructive">{errors.uploader}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="algebra, exam, revision" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
        <Input
          id="thumbnailUrl"
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-3">
        <label className="flex items-center justify-between gap-2 text-sm sm:flex-col sm:items-start sm:gap-2">
          <span className="font-medium text-foreground">Featured</span>
          <Switch checked={featured} onCheckedChange={setFeatured} aria-label="Featured" />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm sm:flex-col sm:items-start sm:gap-2">
          <span className="font-medium text-foreground">Teacher recommended</span>
          <Switch checked={teacherRecommended} onCheckedChange={setTeacherRecommended} aria-label="Teacher recommended" />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm sm:flex-col sm:items-start sm:gap-2">
          <span className="font-medium text-foreground">Pinned</span>
          <Switch checked={pinned} onCheckedChange={setPinned} aria-label="Pinned" />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || upload.uploading}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isEdit ? "Save changes" : "Add resource"}
        </Button>
      </div>
    </form>
  );
}
