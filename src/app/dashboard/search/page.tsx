"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "@/components/icons";
import { useResources } from "@/hooks/use-resources";
import { createResourceSearchIndex, searchResources } from "@/lib/search/client-search";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { Input } from "@/components/ui/input";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { resources, loading } = useResources();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  const index = React.useMemo(() => createResourceSearchIndex(resources), [resources]);
  const results = React.useMemo(() => searchResources(index, query), [index, query]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by title, description, subject, teacher, uploader, topic or tag.
        </p>
      </div>

      <div className="relative w-full max-w-2xl">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search resources, subjects, teachers, tags…"
          aria-label="Search Central Study Hub"
          className="h-14 rounded-md border-border bg-card pr-4 pl-12 text-base shadow-sm"
        />
      </div>

      {query.trim() ? (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          <ResourceGrid
            resources={results}
            loading={loading}
            emptyTitle="No matches"
            emptyDescription="Try a different keyword, or check the spelling."
          />
        </>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Start typing to search across every resource.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
