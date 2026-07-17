"use client";

import * as React from "react";
import type { DailyFact, StudyTip } from "@/types/homepage";

export function useFactOfTheDay() {
  const [fact, setFact] = React.useState<DailyFact | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-facts", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setFact(data.fact ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { fact, loading };
}

export function useStudyTips(options?: { all?: boolean }) {
  const [tips, setTips] = React.useState<StudyTip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reloadToken, setReloadToken] = React.useState(0);
  const all = options?.all ?? false;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(all ? "/api/study-tips?all=true" : "/api/study-tips", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setTips(data.tips ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [all, reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);
  return { tips, loading, refetch };
}

export function useAllFacts() {
  const [facts, setFacts] = React.useState<DailyFact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/daily-facts?all=true", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled && res.ok) setFacts(data.facts ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);
  return { facts, loading, refetch };
}
