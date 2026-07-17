"use client";

import * as React from "react";
import type { AnalyticsData } from "@/lib/db/analytics-agg";

export function useAnalytics() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!cancelled && res.ok) setData(json.analytics);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}
