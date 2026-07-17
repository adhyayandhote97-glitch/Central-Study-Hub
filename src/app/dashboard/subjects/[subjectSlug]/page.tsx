"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "@/components/icons";
import { useResources } from "@/hooks/use-resources";
import { getSubjectIcon } from "@/lib/subject-icon-map";
import type { Subject } from "@/types/subject";
import type { ResourceCategory } from "@/types/resource";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { ResourceFilters, type ResourceSort } from "@/components/resources/resource-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SubjectDetailPage() {
  const params = useParams<{ subjectSlug: string }>();
  const [subject, setSubject] = React.useState<Subject | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [loadingSubject, setLoadingSubject] = React.useState(true);
  const { resources, loading: resourcesLoading } = useResources();

  const [topic, setTopic] = React.useState("all");
  const [category, setCategory] = React.useState<ResourceCategory | "all">("all");
  const [sort, setSort] = React.useState<ResourceSort>("newest");

  React.useEffect(() => {
    let cancelled = false;
    setLoadingSubject(true);
    setNotFound(false);
    fetch(`/api/subjects/${params.subjectSlug}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load subject.");
        if (!cancelled) setSubject(data.subject);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubject(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.subjectSlug]);

  const filteredResources = React.useMemo(() => {
    if (!subject) return [];
    let list = resources.filter((r) => r.subjectId === subject.id);
    if (topic !== "all") list = list.filter((r) => r.topic === topic);
    if (category !== "all") list = list.filter((r) => r.category === category);

    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "newest" ? diff : -diff;
    });
    return list;
  }, [resources, subject, topic, category, sort]);

  if (loadingSubject) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !subject) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Subject not found"
        description="This subject doesn't exist or may have been removed."
        className="py-20"
      />
    );
  }

  const Icon = getSubjectIcon(subject.icon);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{subject.name}</h1>
          <p className="text-sm text-muted-foreground">
            {filteredResources.length} resource{filteredResources.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {subject.topics.length > 0 && (
        <Tabs value={topic} onValueChange={setTopic}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All topics</TabsTrigger>
            {subject.topics
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((t) => (
                <TabsTrigger key={t.slug} value={t.slug}>
                  {t.name}
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      )}

      <ResourceFilters category={category} onCategoryChange={setCategory} sort={sort} onSortChange={setSort} />

      <ResourceGrid
        resources={filteredResources}
        loading={resourcesLoading}
        emptyTitle="No resources yet"
        emptyDescription="Nothing has been uploaded for this subject and filter combination yet."
      />
    </div>
  );
}
