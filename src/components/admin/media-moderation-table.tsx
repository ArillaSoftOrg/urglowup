"use client";

import { useTransition } from "react";
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
import { hideMedia, removeMedia, restoreMedia } from "@/app/(admin)/admin/actions";
import { MEDIA_TYPE_LABELS } from "@/lib/constants/media";
import type { AdminMedia } from "@/lib/queries/admin";

const MEDIA_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  HIDDEN: "bg-yellow-100 text-yellow-800",
  REMOVED: "bg-red-100 text-red-800",
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

  function handleHide() {
    startTransition(async () => {
      await hideMedia(item.id);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeMedia(item.id);
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreMedia(item.id);
    });
  }

  const isVideo =
    item.type === "PORTFOLIO_VIDEO" ||
    (item.url.includes(".mp4") ||
      item.url.includes(".mov") ||
      item.url.includes(".webm"));

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
          <img
            src={item.url}
            alt={item.title ?? "Media"}
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
          <Badge className={`text-xs ${MEDIA_STATUS_COLORS[item.status]}`}>
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
              <DropdownMenuItem onClick={handleHide}>
                Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRemove}
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
                onClick={handleRemove}
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
