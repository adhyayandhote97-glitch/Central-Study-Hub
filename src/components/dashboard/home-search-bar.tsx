"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "@/components/icons";
import { Input } from "@/components/ui/input";

export function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/dashboard/search?q=${encodeURIComponent(trimmed)}` : "/dashboard/search");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full" role="search">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search resources, subjects, teachers, tags…"
        aria-label="Search Central Study Hub"
        className="h-14 rounded-md border-border bg-card pr-4 pl-12 text-base shadow-sm"
      />
    </form>
  );
}
