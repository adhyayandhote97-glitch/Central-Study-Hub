"use client";

import * as React from "react";
import {
  Activity,
  FileText,
  Megaphone,
  MessageSquare,
  BookOpen,
  type LucideIcon,
} from "@/components/icons";
import type { AnalyticsEvent } from "@/types/analytics";
import { formatRelativeTime } from "@/lib/format-date";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_BY_ENTITY: Record<AnalyticsEvent["entityType"], LucideIcon> = {
  resource: FileText,
  ticket: MessageSquare,
  announcement: Megaphone,
  subject: BookOpen,
};

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const [events, setEvents] = React.useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/activity?limit=${limit}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setEvents(data.events ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Uploads, edits, and ticket updates will show up here as they happen."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {events.map((event) => {
        const Icon = ICON_BY_ENTITY[event.entityType] ?? Activity;
        return (
          <li key={event.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{event.summary}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(event.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
