import { Pin } from "@/components/icons";
import type { Announcement } from "@/types/announcement";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-1.5 rounded-md border bg-card p-4",
        announcement.pinned ? "border-primary/30 bg-accent/30" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{announcement.title}</h3>
        {announcement.pinned && (
          <span className="inline-flex items-center gap-1 text-xs text-primary" title="Pinned">
            <Pin className="size-3" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{announcement.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(announcement.createdAt)}</p>
    </article>
  );
}
