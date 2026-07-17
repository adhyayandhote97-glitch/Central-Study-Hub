"use client";

import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";

export function useDownloads() {
  const { uid } = useAuth();

  const logDownload = React.useCallback(
    async (resourceId: string) => {
      if (!uid || !clientDb) return;
      try {
        await addDoc(collection(clientDb, "downloads"), {
          uid,
          resourceId,
          downloadedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to log download:", error);
      }
    },
    [uid]
  );

  return { logDownload };
}
