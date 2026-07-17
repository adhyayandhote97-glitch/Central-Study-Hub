"use client";

import { motion } from "framer-motion";
import { Check, MessageCircleHeart } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function TicketConfirmation({ onSubmitAnother }: { onSubmitAnother: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-4 rounded-md border border-border bg-card px-6 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground"
      >
        <Check className="size-8" aria-hidden="true" />
      </motion.div>
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">Thanks, we&apos;ve got it.</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your submission has been sent to the admin team. You can track its status under My Tickets.
        </p>
      </div>
      <Button variant="outline" onClick={onSubmitAnother} className="mt-2">
        <MessageCircleHeart className="size-4" aria-hidden="true" />
        Submit another
      </Button>
    </motion.div>
  );
}
