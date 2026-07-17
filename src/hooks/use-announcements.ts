"use client";

import * as React from "react";
import type { Announcement } from "@/types/announcement";

interface UseAnnouncementsResult {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnnouncements(options?: { all?: boolean }): UseAnnouncementsResult {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const all = options?.all ?? false;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(all ? "/api/announcements?all=true" : "/api/announcements", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load announcements.");
        if (!cancelled) setAnnouncements(data.announcements ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load announcements.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [all, reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);

  return { announcements, loading, error, refetch };
}
