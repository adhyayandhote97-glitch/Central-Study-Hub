import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { Subject } from "@/types/subject";
import { getSubjectIcon } from "@/lib/subject-icon-map";

export function SubjectCard({ subject, resourceCount }: { subject: Subject; resourceCount?: number }) {
  const Icon = getSubjectIcon(subject.icon);

  return (
    <Link
      href={`/dashboard/subjects/${subject.slug}`}
      className="group flex items-center gap-4 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{subject.name}</p>
        <p className="text-xs text-muted-foreground">
          {subject.topics.length} topic{subject.topics.length === 1 ? "" : "s"}
          {typeof resourceCount === "number"
            ? ` · ${resourceCount} resource${resourceCount === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
