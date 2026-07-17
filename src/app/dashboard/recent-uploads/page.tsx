"use client";

import * as React from "react";
import { useResources } from "@/hooks/use-resources";
import { useSubjects } from "@/hooks/use-subjects";
import type { ResourceCategory } from "@/types/resource";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { ResourceFilters, type ResourceSort } from "@/components/resources/resource-filters";

export default function RecentUploadsPage() {
  const { resources, loading } = useResources();
  const { subjects } = useSubjects();
  const [subjectId, setSubjectId] = React.useState("all");
  const [category, setCategory] = React.useState<ResourceCategory | "all">("all");
  const [sort, setSort] = React.useState<ResourceSort>("newest");

  const filtered = React.useMemo(() => {
    let list = resources;
    if (subjectId !== "all") list = list.filter((r) => r.subjectId === subjectId);
    if (category !== "all") list = list.filter((r) => r.category === category);

    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "newest" ? diff : -diff;
    });
    return list;
  }, [resources, subjectId, category, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recent Uploads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything added recently, across every subject.</p>
      </div>

      <ResourceFilters
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        subjects={subjects}
        subjectId={subjectId}
        onSubjectChange={setSubjectId}
      />

      <ResourceGrid resources={filtered} loading={loading} />
    </div>
  );
}
