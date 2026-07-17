"use client";

import { Brain } from "@/components/icons";
import { useStudyTips } from "@/hooks/use-homepage-content";
import { STUDY_TIP_CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function categoryLabel(value: string) {
  return STUDY_TIP_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function HowToStudy() {
  const { tips, loading } = useStudyTips();

  if (loading) {
    return (
      <section aria-labelledby="how-to-study-heading" className="flex flex-col gap-4">
        <h2 id="how-to-study-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Brain className="size-4.5 text-muted-foreground" aria-hidden="true" />
          How to Study
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-md" />
          ))}
        </div>
      </section>
    );
  }

  if (tips.length === 0) return null;

  return (
    <section aria-labelledby="how-to-study-heading" className="flex flex-col gap-4">
      <h2 id="how-to-study-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Brain className="size-4.5 text-muted-foreground" aria-hidden="true" />
        How to Study
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tips.map((tip) => (
          <article key={tip.id} className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-foreground/[0.08]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base leading-snug font-semibold text-foreground">{tip.title}</h3>
              <Badge variant="secondary" className="shrink-0">
                {categoryLabel(tip.category)}
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{tip.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
