import { FileQuestion } from "@/components/icons";
import type { Resource } from "@/types/resource";
import { ResourceCard } from "./resource-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function ResourceGrid({
  resources,
  loading,
  emptyTitle = "No resources found",
  emptyDescription = "Try adjusting your filters or search.",
}: {
  resources: Resource[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-md" />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return <EmptyState icon={FileQuestion} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
