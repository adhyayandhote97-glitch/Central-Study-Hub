"use client";

import * as React from "react";
import { useRecentViews } from "@/hooks/use-recent-views";
import { useResources } from "@/hooks/use-resources";
import { ResourceGrid } from "@/components/resources/resource-grid";

export default function RecentlyViewedPage() {
  const { recentViews, loading: viewsLoading } = useRecentViews();
  const { resources, loading: resourcesLoading } = useResources();

  const orderedResources = React.useMemo(() => {
    const byId = new Map(resources.map((r) => [r.id, r]));
    return recentViews
      .map((v) => byId.get(v.resourceId))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [recentViews, resources]);

  const loading = viewsLoading || resourcesLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recently Viewed</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resources you&apos;ve opened recently.</p>
      </div>

      <ResourceGrid
        resources={orderedResources}
        loading={loading}
        emptyTitle="Nothing viewed yet"
        emptyDescription="Resources you open will show up here."
      />
    </div>
  );
}
