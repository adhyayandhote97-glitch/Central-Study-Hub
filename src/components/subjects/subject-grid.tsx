import type { Subject } from "@/types/subject";
import type { Resource } from "@/types/resource";
import { SubjectCard } from "./subject-card";
import { Skeleton } from "@/components/ui/skeleton";

export function SubjectGrid({
  subjects,
  resources,
  loading,
}: {
  subjects: Subject[];
  resources?: Resource[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-md" />
        ))}
      </div>
    );
  }

  const counts = new Map<string, number>();
  if (resources) {
    for (const resource of resources) {
      counts.set(resource.subjectId, (counts.get(resource.subjectId) ?? 0) + 1);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          resourceCount={resources ? (counts.get(subject.id) ?? 0) : undefined}
        />
      ))}
    </div>
  );
}
