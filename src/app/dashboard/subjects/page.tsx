"use client";

import { useSubjects } from "@/hooks/use-subjects";
import { useResources } from "@/hooks/use-resources";
import { SubjectGrid } from "@/components/subjects/subject-grid";

export default function SubjectsPage() {
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { resources } = useResources();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Subjects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse every MYP5 subject: topics, notes, past papers and more.
        </p>
      </div>
      <SubjectGrid subjects={subjects} resources={resources} loading={subjectsLoading} />
    </div>
  );
}
