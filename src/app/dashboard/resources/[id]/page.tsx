"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Download } from "@/components/icons";
import type { Resource } from "@/types/resource";
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";
import { formatDate } from "@/lib/format-date";
import { useRecentViews } from "@/hooks/use-recent-views";
import { useDownloads } from "@/hooks/use-downloads";
import { ResourcePreview } from "@/components/resources/previews/resource-preview";
import { ResourceIcon } from "@/components/resources/resource-icon";
import { FavouriteButton } from "@/components/resources/favourite-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [resource, setResource] = React.useState<Resource | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const { logView } = useRecentViews();
  const { logDownload } = useDownloads();
  const loggedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/resources/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load resource.");
        if (!cancelled) setResource(data.resource);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  React.useEffect(() => {
    if (resource && loggedRef.current !== resource.id) {
      loggedRef.current = resource.id;
      logView(resource.id);
    }
  }, [resource, logView]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-[60vh] w-full rounded-md" />
      </div>
    );
  }

  if (notFound || !resource) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Resource not found"
        description="This resource doesn't exist or may have been removed."
        className="py-20"
      />
    );
  }

  const categoryLabel = RESOURCE_CATEGORIES.find((c) => c.value === resource.category)?.label;
  const downloadHref = resource.fileUrl ?? resource.externalUrl ?? "#";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href={`/dashboard/subjects/${resource.subjectId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to {resource.subjectName}
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ResourceIcon type={resource.resourceType} className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{resource.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {resource.teacher ? `${resource.teacher} · ` : ""}
                {formatDate(resource.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FavouriteButton resourceId={resource.id} variant="full" />
            <Button asChild onClick={() => logDownload(resource.id)}>
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                download={resource.sourceKind === "file"}
              >
                <Download className="size-4" aria-hidden="true" />
                {resource.sourceKind === "file" ? "Download" : "Open"}
              </a>
            </Button>
          </div>
        </div>

        {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{resource.subjectName}</Badge>
          {resource.topicName && <Badge variant="outline">{resource.topicName}</Badge>}
          {categoryLabel && <Badge variant="outline">{categoryLabel}</Badge>}
          <Badge variant="outline">{RESOURCE_TYPE_LABELS[resource.resourceType]}</Badge>
          {resource.fileSizeBytes && <Badge variant="outline">{formatBytes(resource.fileSizeBytes)}</Badge>}
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      <ResourcePreview resource={resource} />
    </div>
  );
}
