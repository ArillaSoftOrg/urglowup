"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

type Vote = "up" | "down";

export function HelpFeedback() {
  const [vote, setVote] = useState<Vote | null>(null);

  if (vote) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Teşekkürler! Geri bildiriminizi aldık.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Bu makale yardımcı oldu mu?
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Evet, yardımcı oldu"
          onClick={() => setVote("up")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ThumbsUp className="size-3.5" />
          Evet
        </button>
        <button
          type="button"
          aria-label="Hayır, yardımcı olmadı"
          onClick={() => setVote("down")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ThumbsDown className="size-3.5" />
          Hayır
        </button>
      </div>
    </div>
  );
}
