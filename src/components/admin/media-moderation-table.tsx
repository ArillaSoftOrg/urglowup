"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageIcon, Loader2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { ReasonGate } from "./reason-gate";
import { hideMedia, removeMedia, restoreMedia } from "@/app/(admin)/admin/actions";
import { MEDIA_TYPE_LABELS } from "@/lib/constants/media";
import type { AdminMedia } from "@/lib/queries/admin";

import type { BadgeVariant } from "@/components/ui/badge";

const MEDIA_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  HIDDEN: "warning",
  REMOVED: "destructive",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MediaRow({ item }: { item: AdminMedia }) {
  const [isPending, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<"hide" | "remove" | null>(null);

  async function handleHide(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await hideMedia(item.id, reason);
        setActionInProgress(null);
        resolve();
      });
    });
  }

  async function handleRemove(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await removeMedia(item.id, reason);
        setActionInProgress(null);
        resolve();
      });
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreMedia(item.id);
    });
  }

  const isVideo = item.type === "PORTFOLIO_VIDEO";

  if (actionInProgress) {
    return (
      <div className="border-b p-3 last:border-0">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-medium text-foreground">{item.business.name}</p>
            {item.title && <p className="text-xs text-muted-foreground">{item.title}</p>}
          </div>
          <button
            onClick={() => setActionInProgress(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        <ReasonGate
          onConfirm={actionInProgress === "hide" ? handleHide : handleRemove}
          onCancel={() => setActionInProgress(null)}
          actionLabel={actionInProgress === "hide" ? "Hide" : "Remove"}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b p-3 last:border-0">
      {/* Thumbnail */}
      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {isVideo ? (
          <video
            src={item.url}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={item.url}
            alt={item.title ?? "Media"}
            width={56}
            height={56}
            className="size-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {MEDIA_TYPE_LABELS[item.type] ?? item.type}
          </Badge>
          <Badge variant={MEDIA_STATUS_VARIANT[item.status] ?? "neutral"} className="text-xs">
            {item.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm">
          <Link
            href={`/admin/businesses/${item.business.id}`}
            className="font-medium hover:underline"
          >
            {item.business.name}
          </Link>
          {item.title && (
            <span className="text-muted-foreground"> · {item.title}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {item.status === "ACTIVE" && (
            <>
              <DropdownMenuItem onClick={() => setActionInProgress("hide")}>
                Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionInProgress("remove")}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </>
          )}
          {item.status === "HIDDEN" && (
            <>
              <DropdownMenuItem onClick={handleRestore}>
                Restore
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionInProgress("remove")}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </>
          )}
          {item.status === "REMOVED" && (
            <DropdownMenuItem onClick={handleRestore}>
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MediaModerationTable({ media }: { media: AdminMedia[] }) {
  const active = media.filter((m) => m.status === "ACTIVE");
  const hidden = media.filter((m) => m.status === "HIDDEN");
  const removed = media.filter((m) => m.status === "REMOVED");

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({media.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="hidden">Hidden ({hidden.length})</TabsTrigger>
        <TabsTrigger value="removed">Removed ({removed.length})</TabsTrigger>
      </TabsList>

      {[
        { value: "all", items: media },
        { value: "active", items: active },
        { value: "hidden", items: hidden },
        { value: "removed", items: removed },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No media found
                  </p>
                </div>
              ) : (
                items.map((m) => <MediaRow key={m.id} item={m} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
