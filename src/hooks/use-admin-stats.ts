"use client";

import * as React from "react";
import type { AdminStats } from "@/lib/db/stats";

export function useAdminStats() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setStats(data.stats);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}
