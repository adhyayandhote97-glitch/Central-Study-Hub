"use client";

import * as React from "react";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { Loader2, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Clears this device's recently-viewed + downloads history (keeps favourites). */
export function ClearHistoryButton() {
  const { uid } = useAuth();
  const [clearing, setClearing] = React.useState(false);

  const clear = async () => {
    if (!uid || !clientDb) return;
    setClearing(true);
    try {
      for (const col of ["recentViews", "downloads"] as const) {
        const snap = await getDocs(query(collection(clientDb, col), where("uid", "==", uid)));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      }
      toast.success("History cleared.");
    } catch {
      toast.error("Couldn't clear history.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" aria-hidden="true" />
          Clear history
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear your browsing history?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes your Recently Viewed and download history on this device. Your favourites are
            kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={clear} disabled={clearing}>
            {clearing && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
