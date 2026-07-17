"use client";

import * as React from "react";
import type { Subject } from "@/types/subject";

interface UseSubjectsResult {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubjects(): UseSubjectsResult {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/subjects", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load subjects.");
        if (!cancelled) setSubjects(data.subjects ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load subjects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);

  return { subjects, loading, error, refetch };
}
