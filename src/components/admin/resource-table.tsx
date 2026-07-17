"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Search,
  Sparkles,
  Trash2,
} from "@/components/icons";
import { toast } from "sonner";
import type { Resource, ResourceCategory } from "@/types/resource";
import type { Subject } from "@/types/subject";
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import { ResourceIcon } from "@/components/resources/resource-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderOpen } from "@/components/icons";
import { ResourceForm } from "./resource-form";

type StatusFilter = "active" | "archived" | "all";
type SortKey = "newest" | "oldest" | "title";

export function ResourceTable({
  resources,
  subjects,
  loading,
  onChanged,
}: {
  resources: Resource[];
  subjects: Subject[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("all");
  const [category, setCategory] = React.useState<ResourceCategory | "all">("all");
  const [status, setStatus] = React.useState<StatusFilter>("active");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [editing, setEditing] = React.useState<Resource | null>(null);
  const [deleting, setDeleting] = React.useState<Resource | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = resources.filter((r) => {
      if (status === "active" && r.archived) return false;
      if (status === "archived" && !r.archived) return false;
      if (subjectId !== "all" && r.subjectId !== subjectId) return false;
      if (category !== "all" && r.category !== category) return false;
      if (q) {
        const haystack = [r.title, r.description, r.teacher, r.uploader, r.subjectName, ...r.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "newest" ? diff : -diff;
    });
    return list;
  }, [resources, search, subjectId, category, status, sort]);

  const mutate = async (resource: Resource, patch: Record<string, unknown>, message: string) => {
    setBusyId(resource.id);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed.");
      }
      toast.success(message);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const res = await fetch(`/api/resources/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed.");
      }
      toast.success("Resource deleted.");
      setDeleting(null);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-56">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            aria-label="Search resources"
            className="h-9 pl-9"
          />
        </div>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-auto min-w-36" aria-label="Filter by subject">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory | "all")}>
          <SelectTrigger className="w-auto min-w-36" aria-label="Filter by category">
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
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-auto min-w-28" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-auto min-w-28" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources"
          description="Nothing matches your filters, or you haven't added any resources yet."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <ul className="divide-y divide-border">
            {filtered.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center gap-3 px-3 py-3 sm:px-4"
                data-busy={busyId === resource.id}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ResourceIcon type={resource.resourceType} className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
                    {resource.featured && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Sparkles className="size-2.5" aria-hidden="true" /> Featured
                      </Badge>
                    )}
                    {resource.pinned && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Pin className="size-2.5" aria-hidden="true" /> Pinned
                      </Badge>
                    )}
                    {resource.archived && (
                      <Badge variant="outline" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {resource.subjectName} · {RESOURCE_TYPE_LABELS[resource.resourceType]} ·{" "}
                    {formatDate(resource.createdAt)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${resource.title}`}>
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setEditing(resource)}>
                      <Pencil aria-hidden="true" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        mutate(
                          resource,
                          { featured: !resource.featured },
                          resource.featured ? "Unfeatured." : "Featured."
                        )
                      }
                    >
                      <Sparkles aria-hidden="true" />
                      {resource.featured ? "Unfeature" : "Feature"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        mutate(resource, { pinned: !resource.pinned }, resource.pinned ? "Unpinned." : "Pinned.")
                      }
                    >
                      {resource.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                      {resource.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        mutate(
                          resource,
                          { archived: !resource.archived },
                          resource.archived ? "Restored." : "Archived."
                        )
                      }
                    >
                      {resource.archived ? (
                        <ArchiveRestore aria-hidden="true" />
                      ) : (
                        <Archive aria-hidden="true" />
                      )}
                      {resource.archived ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(resource)}>
                      <Trash2 aria-hidden="true" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit resource</DialogTitle>
          </DialogHeader>
          {editing && (
            <ResourceForm
              subjects={subjects}
              resource={editing}
              onSaved={() => {
                setEditing(null);
                onChanged();
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be permanently removed, along with its uploaded file.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
