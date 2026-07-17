"use client";

import * as React from "react";
import type { Resource } from "@/types/resource";

interface UseResourcesResult {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useResources(options?: { includeArchived?: boolean }): UseResourcesResult {
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const includeArchived = options?.includeArchived ?? false;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = includeArchived ? "/api/resources?includeArchived=true" : "/api/resources";
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load resources.");
        if (!cancelled) setResources(data.resources ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load resources.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeArchived, reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);

  return { resources, loading, error, refetch };
}
