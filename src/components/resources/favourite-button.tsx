"use client";

import * as React from "react";
import { Heart } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/hooks/use-favourites";
import { cn } from "@/lib/utils";

export function FavouriteButton({
  resourceId,
  className,
  variant = "icon",
}: {
  resourceId: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const [pending, setPending] = React.useState(false);
  const active = isFavourite(resourceId);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await toggleFavourite(resourceId);
    } catch {
      toast.error("Couldn't update favourites. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant === "icon" ? "ghost" : active ? "secondary" : "outline"}
      size={variant === "icon" ? "icon" : "sm"}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      className={cn(variant === "full" && "gap-1.5", className)}
    >
      <Heart
        className={cn("size-4", active && "fill-destructive text-destructive")}
        aria-hidden="true"
      />
      {variant === "full" && (active ? "Favourited" : "Favourite")}
    </Button>
  );
}
