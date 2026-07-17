"use client";

import * as React from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import type { RecentViewRecord } from "@/types/activity";

const MAX_RECENT_VIEWS = 40;

interface UseRecentViewsResult {
  recentViews: RecentViewRecord[];
  loading: boolean;
  logView: (resourceId: string) => Promise<void>;
}

export function useRecentViews(): UseRecentViewsResult {
  const { uid } = useAuth();
  const [recentViews, setRecentViews] = React.useState<RecentViewRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!uid || !clientDb) {
      setRecentViews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const recentQuery = query(
      collection(clientDb, "recentViews"),
      where("uid", "==", uid),
      orderBy("viewedAt", "desc"),
      limit(MAX_RECENT_VIEWS)
    );
    const unsubscribe = onSnapshot(
      recentQuery,
      (snapshot) => {
        setRecentViews(
          snapshot.docs.map((d) => ({
            id: d.id,
            uid: d.data().uid,
            resourceId: d.data().resourceId,
            viewedAt: d.data().viewedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load recently viewed:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const logView = React.useCallback(
    async (resourceId: string) => {
      if (!uid || !clientDb) return;
      try {
        const existingQuery = query(
          collection(clientDb, "recentViews"),
          where("uid", "==", uid),
          where("resourceId", "==", resourceId)
        );
        const existing = await getDocs(existingQuery);
        await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
        await addDoc(collection(clientDb, "recentViews"), {
          uid,
          resourceId,
          viewedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to log recent view:", error);
      }
    },
    [uid]
  );

  return { recentViews, loading, logView };
}
