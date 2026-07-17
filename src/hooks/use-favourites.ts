"use client";

import * as React from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import type { FavoriteRecord } from "@/types/activity";

interface UseFavouritesResult {
  favourites: FavoriteRecord[];
  favouriteResourceIds: Set<string>;
  loading: boolean;
  isFavourite: (resourceId: string) => boolean;
  toggleFavourite: (resourceId: string) => Promise<void>;
}

export function useFavourites(): UseFavouritesResult {
  const { uid } = useAuth();
  const [favourites, setFavourites] = React.useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!uid || !clientDb) {
      setFavourites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const favouritesQuery = query(
      collection(clientDb, "favorites"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      favouritesQuery,
      (snapshot) => {
        setFavourites(
          snapshot.docs.map((d) => ({
            id: d.id,
            uid: d.data().uid,
            resourceId: d.data().resourceId,
            createdAt: d.data().createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load favourites:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const favouriteResourceIds = React.useMemo(
    () => new Set(favourites.map((f) => f.resourceId)),
    [favourites]
  );

  const isFavourite = React.useCallback(
    (resourceId: string) => favouriteResourceIds.has(resourceId),
    [favouriteResourceIds]
  );

  const toggleFavourite = React.useCallback(
    async (resourceId: string) => {
      if (!uid || !clientDb) return;
      const existing = favourites.find((f) => f.resourceId === resourceId);
      if (existing) {
        await deleteDoc(doc(clientDb, "favorites", existing.id));
      } else {
        await addDoc(collection(clientDb, "favorites"), {
          uid,
          resourceId,
          createdAt: serverTimestamp(),
        });
      }
    },
    [uid, favourites]
  );

  return { favourites, favouriteResourceIds, loading, isFavourite, toggleFavourite };
}
