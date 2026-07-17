"use client";

import { RESOURCE_CATEGORIES } from "@/lib/constants";
import type { ResourceCategory } from "@/types/resource";
import type { Subject } from "@/types/subject";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ResourceSort = "newest" | "oldest" | "title";

interface ResourceFiltersProps {
  category: ResourceCategory | "all";
  onCategoryChange: (value: ResourceCategory | "all") => void;
  sort: ResourceSort;
  onSortChange: (value: ResourceSort) => void;
  subjects?: Subject[];
  subjectId?: string;
  onSubjectChange?: (value: string) => void;
}

export function ResourceFilters({
  category,
  onCategoryChange,
  sort,
  onSortChange,
  subjects,
  subjectId,
  onSubjectChange,
}: ResourceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjects && onSubjectChange && (
        <Select value={subjectId ?? "all"} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-auto min-w-40" aria-label="Filter by subject">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={category} onValueChange={(v) => onCategoryChange(v as ResourceCategory | "all")}>
        <SelectTrigger className="w-auto min-w-40" aria-label="Filter by category">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {RESOURCE_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as ResourceSort)}>
        <SelectTrigger className="w-auto min-w-32" aria-label="Sort resources">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="title">Title A–Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
