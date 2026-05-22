"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  MoreVertical,
  ImageIcon,
  Film,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaUploadButton } from "./media-upload-button";
import { MediaEditDialog } from "./media-edit-dialog";
import { setAsCover, setAsLogo } from "@/app/(business)/business/media/actions";
import {
  MEDIA_TYPE_LABELS,
  MAX_IMAGES_PER_BUSINESS,
  MAX_VIDEOS_PER_BUSINESS,
} from "@/lib/constants/media";
import type { BusinessMediaItem } from "@/lib/queries/media";

interface ServiceOption {
  id: string;
  name: string;
}

// ─── Cover & Logo Section ───────────────────────────────────────

function CoverLogoSection({
  cover,
  logo,
}: {
  cover: BusinessMediaItem | undefined;
  logo: BusinessMediaItem | undefined;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="bg-surface-cream">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cover Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cover ? (
            <div className="relative aspect-[3/1] overflow-hidden rounded-lg">
              <Image
                src={cover.url}
                alt="Cover"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[3/1] items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex gap-2">
            <MediaUploadButton
              mediaType="COVER"
              label={cover ? "Change cover" : "Upload cover"}
              size="sm"
            />
            {cover && (
              <DeleteMediaButton mediaId={cover.id} label="Remove" size="sm" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-cream">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logo ? (
            <div className="relative mx-auto size-24 overflow-hidden rounded-xl">
              <Image
                src={logo.url}
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto flex size-24 items-center justify-center rounded-xl border-2 border-dashed bg-muted/40">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex justify-center gap-2">
            <MediaUploadButton
              mediaType="LOGO"
              label={logo ? "Change logo" : "Upload logo"}
              size="sm"
            />
            {logo && (
              <DeleteMediaButton mediaId={logo.id} label="Remove" size="sm" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Media Item Card ────────────────────────────────────────────

function MediaItemCard({
  media,
  services,
}: {
  media: BusinessMediaItem;
  services: ServiceOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const isVideo = media.type === "PORTFOLIO_VIDEO";
  const isImage =
    media.type !== "PORTFOLIO_VIDEO" &&
    media.type !== "COVER" &&
    media.type !== "LOGO";

  function handleSetAsCover() {
    startTransition(async () => {
      await setAsCover(media.id);
    });
  }

  function handleSetAsLogo() {
    startTransition(async () => {
      await setAsLogo(media.id);
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-square">
        {isVideo ? (
          <>
            <video
              src={media.url}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Film className="size-6 text-white" />
            </div>
          </>
        ) : (
          <Image
            src={media.url}
            alt={media.title ?? "Media"}
            fill
            className="object-cover"
          />
        )}

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="absolute left-1.5 top-1.5 text-[10px]"
        >
          {MEDIA_TYPE_LABELS[media.type]}
        </Badge>
      </div>

      {/* Actions overlay */}
      <div className="flex items-center justify-between p-2">
        <div className="min-w-0">
          {media.title && (
            <p className="truncate text-xs font-medium">{media.title}</p>
          )}
          {media.relatedService && (
            <p className="truncate text-[10px] text-muted-foreground">
              {media.relatedService.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <MediaEditDialog media={media} services={services} />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-7" />
              }
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <MoreVertical className="size-3" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isImage && (
                <>
                  <DropdownMenuItem onClick={handleSetAsCover}>
                    Set as cover
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSetAsLogo}>
                    Set as logo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DeleteMediaDropdownItem mediaId={media.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Helpers ─────────────────────────────────────────────

function DeleteMediaButton({
  mediaId,
  label = "Delete",
  size = "default",
}: {
  mediaId: string;
  label?: string;
  size?: "default" | "sm";
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed.");
      } else {
        setConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3" />
        {label}
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media?</DialogTitle>
            <DialogDescription>
              This will permanently delete this media from your gallery and
              Cloudinary. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteMediaDropdownItem({ mediaId }: { mediaId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (res.ok) setConfirmOpen(false);
    });
  }

  return (
    <>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          setConfirmOpen(true);
        }}
        className="text-destructive"
      >
        <Trash2 className="size-4" />
        Delete
      </DropdownMenuItem>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media?</DialogTitle>
            <DialogDescription>
              This will permanently remove this media. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Grid ──────────────────────────────────────────────────

export function MediaGrid({
  media,
  imageCount,
  videoCount,
  services,
}: {
  media: BusinessMediaItem[];
  imageCount: number;
  videoCount: number;
  services: ServiceOption[];
}) {
  const cover = media.find((m) => m.type === "COVER");
  const logo = media.find((m) => m.type === "LOGO");

  const portfolioMedia = media.filter(
    (m) => m.type !== "COVER" && m.type !== "LOGO"
  );
  const images = portfolioMedia.filter((m) => m.type !== "PORTFOLIO_VIDEO");
  const videos = portfolioMedia.filter((m) => m.type === "PORTFOLIO_VIDEO");

  return (
    <div className="space-y-6">
      {/* Cover & Logo */}
      <CoverLogoSection cover={cover} logo={logo} />

      {/* Portfolio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3" />
                {imageCount}/{MAX_IMAGES_PER_BUSINESS}
              </span>
              <span className="flex items-center gap-1">
                <Film className="size-3" />
                {videoCount}/{MAX_VIDEOS_PER_BUSINESS}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload buttons */}
          <div className="flex flex-wrap gap-2">
            <MediaUploadButton
              mediaType="PORTFOLIO_IMAGE"
              label="Upload image"
              size="sm"
            />
            <MediaUploadButton
              mediaType="PORTFOLIO_VIDEO"
              label="Upload video"
              size="sm"
            />
            <MediaUploadButton
              mediaType="BEFORE_AFTER"
              label="Before/After"
              size="sm"
            />
            <MediaUploadButton
              mediaType="SERVICE_IMAGE"
              label="Service image"
              size="sm"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All ({portfolioMedia.length})
              </TabsTrigger>
              <TabsTrigger value="images">
                Images ({images.length})
              </TabsTrigger>
              <TabsTrigger value="videos">
                Videos ({videos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <PortfolioGrid
                items={portfolioMedia}
                services={services}
                emptyHeadline="No portfolio media yet"
                emptyDescription="Upload images, videos, or before/after photos to build your portfolio."
              />
            </TabsContent>
            <TabsContent value="images" className="mt-4">
              <PortfolioGrid
                items={images}
                services={services}
                emptyHeadline="No images yet"
                emptyDescription="Upload portfolio images and before/after photos to showcase your work."
              />
            </TabsContent>
            <TabsContent value="videos" className="mt-4">
              <PortfolioGrid
                items={videos}
                services={services}
                emptyHeadline="No videos yet"
                emptyDescription="Upload short videos (up to 60 seconds) to show your work in action."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PortfolioGrid({
  items,
  services,
  emptyHeadline,
  emptyDescription,
}: {
  items: BusinessMediaItem[];
  services: ServiceOption[];
  emptyHeadline: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        headline={emptyHeadline}
        description={emptyDescription}
        surface="cream"
        compact
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <MediaItemCard key={item.id} media={item} services={services} />
      ))}
    </div>
  );
}
