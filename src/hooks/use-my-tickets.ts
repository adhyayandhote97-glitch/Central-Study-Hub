"use client";

import * as React from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import type { Ticket } from "@/types/ticket";

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

interface UseMyTicketsResult {
  tickets: Ticket[];
  loading: boolean;
}

export function useMyTickets(): UseMyTicketsResult {
  const { uid } = useAuth();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!uid || !clientDb) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ticketsQuery = query(
      collection(clientDb, "tickets"),
      where("ownerUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        setTickets(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerUid: data.ownerUid,
              type: data.type,
              name: data.name ?? null,
              isAnonymous: Boolean(data.isAnonymous),
              subjectId: data.subjectId ?? null,
              subjectName: data.subjectName ?? null,
              title: data.title,
              description: data.description,
              priority: data.priority,
              attachmentUrl: data.attachmentUrl ?? null,
              attachmentPath: data.attachmentPath ?? null,
              status: data.status,
              adminReply: data.adminReply ?? null,
              internalNotes: null,
              createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
              updatedAt: toIso(data.updatedAt) ?? new Date().toISOString(),
              resolvedAt: toIso(data.resolvedAt),
            } satisfies Ticket;
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load your tickets:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  return { tickets, loading };
}
