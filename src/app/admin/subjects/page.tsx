"use client";

import { useSubjects } from "@/hooks/use-subjects";
import { SubjectTopicManager } from "@/components/admin/subject-topic-manager";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSubjectsPage() {
  const { subjects, loading, refetch } = useSubjects();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manage Subjects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add or remove the topics that organise each subject&apos;s resources.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : (
        <SubjectTopicManager subjects={subjects} onChanged={refetch} />
      )}
    </div>
  );
}
