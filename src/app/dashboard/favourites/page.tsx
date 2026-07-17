"use client";

import * as React from "react";
import { useFavourites } from "@/hooks/use-favourites";
import { useResources } from "@/hooks/use-resources";
import { ResourceGrid } from "@/components/resources/resource-grid";

export default function FavouritesPage() {
  const { favourites, loading: favouritesLoading } = useFavourites();
  const { resources, loading: resourcesLoading } = useResources();

  const orderedResources = React.useMemo(() => {
    const byId = new Map(resources.map((r) => [r.id, r]));
    return favourites.map((f) => byId.get(f.resourceId)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [favourites, resources]);

  const loading = favouritesLoading || resourcesLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Favourites</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resources you&apos;ve saved for quick access.</p>
      </div>

      <ResourceGrid
        resources={orderedResources}
        loading={loading}
        emptyTitle="No favourites yet"
        emptyDescription="Tap the heart on any resource to save it here."
      />
    </div>
  );
}
