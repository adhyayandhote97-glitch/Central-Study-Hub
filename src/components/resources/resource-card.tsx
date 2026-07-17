import Link from "next/link";
import { Pin, Sparkles, Star } from "@/components/icons";
import type { Resource } from "@/types/resource";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format-date";
import { ResourceIcon } from "./resource-icon";
import { FavouriteButton } from "./favourite-button";
import { Badge } from "@/components/ui/badge";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/dashboard/resources/${resource.id}`}
      className="group flex flex-col gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ResourceIcon type={resource.resourceType} className="size-5" />
        </span>
        <div className="flex items-center gap-1">
          {resource.pinned && (
            <span title="Pinned" className="text-muted-foreground">
              <Pin className="size-3.5" aria-hidden="true" />
            </span>
          )}
          {resource.featured && (
            <span title="Featured" className="text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
          )}
          {resource.teacherRecommended && (
            <span title="Teacher recommended" className="text-muted-foreground">
              <Star className="size-3.5" aria-hidden="true" />
            </span>
          )}
          <FavouriteButton resourceId={resource.id} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{resource.title}</h3>
        {resource.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <Badge variant="secondary" className="text-[11px]">
          {resource.subjectName}
        </Badge>
        {resource.topicName && (
          <Badge variant="outline" className="text-[11px]">
            {resource.topicName}
          </Badge>
        )}
        <Badge variant="outline" className="text-[11px]">
          {RESOURCE_TYPE_LABELS[resource.resourceType]}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{resource.teacher ? `${resource.teacher}` : resource.uploader}</span>
        <span>{formatRelativeTime(resource.createdAt)}</span>
      </div>
    </Link>
  );
}
