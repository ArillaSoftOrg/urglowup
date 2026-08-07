"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { triggerManualSyncAction } from "./actions";

interface SyncNowButtonProps {
  isSyncing: boolean;
  isInCooldown: boolean;
  cooldownEndsAt: Date | null;
}

export function SyncNowButton({
  isSyncing,
  isInCooldown,
}: SyncNowButtonProps) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const disabled = isSyncing || isInCooldown || pending;

  async function handleSync() {
    setPending(true);
    setFeedback(null);
    try {
      const result = await triggerManualSyncAction();
      if (result.success) {
        setFeedback(
          `Synced ${result.reviewsSynced} review${result.reviewsSynced === 1 ? "" : "s"} ` +
            `and ${result.photosSynced} photo${result.photosSynced === 1 ? "" : "s"}.`,
        );
      } else if (result.error === "cooldown") {
        setFeedback("Sync cooldown active — please wait before syncing again.");
      } else if (result.error === "sync_in_progress") {
        setFeedback("A sync is already in progress.");
      } else if (result.error === "sync_failed") {
        setFeedback(result.message ?? "Sync failed — please try again.");
      } else {
        setFeedback("Unable to start sync.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleSync}
      >
        {isSyncing || pending ? "Syncing…" : "Sync Now"}
      </Button>
      {feedback && (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      )}
    </div>
  );
}
