"use client";

import { Lightbulb } from "@/components/icons";
import { useFactOfTheDay } from "@/hooks/use-homepage-content";
import { Skeleton } from "@/components/ui/skeleton";

const KICKER: Record<string, string> = {
  fact: "Fact of the Day",
  quote: "Quote of the Day",
  tip: "Tip of the Day",
};

export function FactOfTheDay() {
  const { fact, loading } = useFactOfTheDay();

  if (loading) return <Skeleton className="h-28 w-full rounded-md" />;
  if (!fact) return null;

  const isQuote = fact.type === "quote";

  return (
    <section
      aria-label={KICKER[fact.type]}
      className="flex flex-col gap-2 rounded-md bg-card p-5 ring-1 ring-foreground/[0.08]"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
        <Lightbulb className="size-3.5" aria-hidden="true" weight="fill" />
        {KICKER[fact.type]}
      </p>
      <p
        className={
          isQuote
            ? "text-xl leading-snug text-foreground italic"
            : "text-lg leading-snug text-foreground"
        }
      >
        {isQuote ? `“${fact.text}”` : fact.text}
      </p>
      {fact.author && <p className="text-sm text-muted-foreground">{fact.author}</p>}
    </section>
  );
}
