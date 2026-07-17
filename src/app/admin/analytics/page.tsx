"use client";

import dynamic from "next/dynamic";
import { useAnalytics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// recharts is heavy and browser-only — load it lazily, client-side.
const AnalyticsCharts = dynamic(
  () => import("@/components/admin/charts/analytics-charts").then((m) => m.AnalyticsCharts),
  {
    ssr: false,
    loading: () => <ChartsSkeleton />,
  }
);

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-md" />
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, loading } = useAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resource activity and Student Voice trends across Central Study Hub.
        </p>
      </div>

      {loading || !data ? <ChartsSkeleton /> : <AnalyticsCharts data={data} />}
    </div>
  );
}
