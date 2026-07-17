"use client";

import * as React from "react";
import type { Ticket } from "@/types/ticket";

export function useAdminTickets() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/tickets", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load tickets.");
        if (!cancelled) setTickets(data.tickets ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tickets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);

  return { tickets, loading, error, refetch };
}
