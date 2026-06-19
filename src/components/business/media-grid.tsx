"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  Crop,
  Camera,
  Eye,
  Grid3X3,
  MapPin,
  Plus,
  Scissors,
  Star,
  UserRound,
} from "lucide-react";
import { MediaUploadButton } from "./media-upload-button";
import { MediaEditDialog } from "./media-edit-dialog";
import { setAsCover, setAsLogo, saveCropMeta } from "@/app/(business)/business/media/actions";
import {
  MEDIA_TYPE_LABELS,
  MAX_IMAGES_PER_BUSINESS,
  MAX_VIDEOS_PER_BUSINESS,
} from "@/lib/constants/media";
import { cn } from "@/lib/utils";
import type { BusinessMediaItem } from "@/lib/queries/media";

const CropDialog = dynamic(() => import("./crop-dialog"), {
  ssr: false,
  loading: () => (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3 animate-spin" />
      Kirpma araci yukleniyor...
    </div>
  ),
});

const CROP_ASPECTS: Partial<Record<string, number>> = {
  COVER: 16 / 9,
};

interface ServiceOption {
  id: string;
  name: string;
}

interface BusinessProfileSummary {
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  district: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  categories: string[];
  serviceCount: number;
  reviewCount: number;
  rating: number | null;
}

function formatRating(rating: number | null) {
  if (rating == null) return "-";
  return rating.toFixed(1);
}

function ProfileHero({
  business,
  cover,
  logo,
  portfolioCount,
}: {
  business: BusinessProfileSummary;
  cover: BusinessMediaItem | undefined;
  logo: BusinessMediaItem | undefined;
  portfolioCount: number;
}) {
  const coverUrl = cover?.url ?? business.coverImageUrl;
  const logoUrl = logo?.url ?? business.logoUrl;
  const location = [business.district, business.city].filter(Boolean).join(", ");
  const categoryLine = business.categories.join(" / ");

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="relative h-36 bg-muted sm:h-44 lg:h-52">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${business.name} kapak görseli`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1100px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-cream text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-wrap gap-2">
          <MediaUploadButton
            mediaType="COVER"
            label={coverUrl ? "Kapak değiştir" : "Kapak ekle"}
            size="sm"
            variant="outline"
          />
          {cover && (
            <DeleteMediaButton mediaId={cover.id} label="Kaldır" size="sm" />
          )}
        </div>
      </div>

      <div className="px-4 pb-5 pt-0 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="-mt-10 shrink-0">
              <div className="relative size-24 overflow-hidden rounded-full border-4 border-card bg-muted sm:size-28">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${business.name} logosu`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <UserRound className="size-9 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <MediaUploadButton
                  mediaType="LOGO"
                  label={logoUrl ? "Logo değiştir" : "Logo ekle"}
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>

            <div className="min-w-0 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-normal">
                  {business.name}
                </h1>
                {categoryLine && (
                  <Badge variant="secondary" className="max-w-full truncate">
                    {categoryLine}
                  </Badge>
                )}
              </div>
              {location && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {location}
                </p>
              )}
              {business.description && (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                  {business.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span>
                  <strong>{portfolioCount}</strong> paylaşım
                </span>
                <span>
                  <strong>{business.serviceCount}</strong> hizmet
                </span>
                <span>
                  <strong>{business.reviewCount}</strong> yorum
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-current" />
                  <strong>{formatRating(business.rating)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:pb-1">
            <Link
              href="/business/profile"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Profili düzenle
            </Link>
            <Link
              href={`/b/${business.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <Eye className="size-3.5" />
              Canlı profili gör
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileHighlights({
  services,
}: {
  services: ServiceOption[];
}) {
  const highlights = [
    ...services.slice(0, 4).map((service) => ({
      id: service.id,
      label: service.name,
      icon: Scissors,
      mediaType: "SERVICE_IMAGE" as const,
    })),
    {
      id: "before-after",
      label: "Önce/Sonra",
      icon: ImageIcon,
      mediaType: "BEFORE_AFTER" as const,
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto rounded-lg border bg-card px-4 py-4 sm:px-6">
      {highlights.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="flex w-20 shrink-0 flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center rounded-full border bg-muted/30">
              <Icon className="size-6 text-muted-foreground" />
            </div>
            <span className="line-clamp-2 text-center text-xs font-medium">
              {item.label}
            </span>
          </div>
        );
      })}
      <div className="flex w-20 shrink-0 flex-col items-center gap-2">
        <div className="flex size-16 items-center justify-center rounded-full border border-dashed bg-muted/30">
          <MediaUploadButton
            mediaType="PORTFOLIO_IMAGE"
            label=""
            size="icon"
            variant="ghost"
          />
        </div>
        <span className="text-center text-xs font-medium">Yeni</span>
      </div>
    </div>
  );
}

function AddMediaTile() {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border bg-background">
        <Plus className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <MediaUploadButton
          mediaType="PORTFOLIO_IMAGE"
          label="Fotoğraf"
          size="sm"
          variant="outline"
        />
        <MediaUploadButton
          mediaType="PORTFOLIO_VIDEO"
          label="Video"
          size="sm"
          variant="outline"
        />
      </div>
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);
  const isVideo = media.type === "PORTFOLIO_VIDEO";
  const isImage =
    media.type !== "PORTFOLIO_VIDEO" &&
    media.type !== "COVER" &&
    media.type !== "LOGO";
  const supportsCrop = media.type === "COVER" || media.type === "PORTFOLIO_IMAGE";

  async function handleCropConfirm(crop: { x: number; y: number; width: number; height: number }) {
    setCropSaving(true);
    await saveCropMeta(media.id, crop);
    setCropSaving(false);
    setCropOpen(false);
    router.refresh();
  }

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

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: media.id }),
      });
      if (res.ok) {
        setDeleteOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Delete failed.");
      }
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/30">
      <div className="relative aspect-[4/3]">
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
              <Film className="size-6 text-primary-foreground" />
            </div>
          </>
        ) : (
          <Image
            src={media.url}
            alt={media.title ?? "Media"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
      <div className="flex min-h-12 items-center justify-between gap-2 p-2">
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
              {supportsCrop && (
                <>
                  <DropdownMenuItem onClick={() => setCropOpen(true)}>
                    <Crop className="size-4" />
                    Kırpmayı Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isImage && (
                <>
                  <DropdownMenuItem onClick={handleSetAsCover}>
                    Kapak yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSetAsLogo}>
                    Logo yap
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setDeleteOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="size-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medya silinsin mi?</DialogTitle>
            <DialogDescription>
              Bu medya kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cropOpen && (
        <CropDialog
          open={cropOpen}
          onOpenChange={(v) => { if (!v && !cropSaving) setCropOpen(false); }}
          imageUrl={media.url}
          aspect={CROP_ASPECTS[media.type]}
          initialCrop={
            media.cropX != null
              ? { x: media.cropX, y: media.cropY!, width: media.cropWidth!, height: media.cropHeight! }
              : undefined
          }
          onConfirm={handleCropConfirm}
          onSkip={() => setCropOpen(false)}
          isPending={cropSaving}
        />
      )}
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
  const router = useRouter();
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
        router.refresh();
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
            <DialogTitle>Medya silinsin mi?</DialogTitle>
            <DialogDescription>
              Bu medya galeriden ve Cloudinary&apos;den kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
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
  business,
  media,
  imageCount,
  videoCount,
  services,
}: {
  business: BusinessProfileSummary;
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
    <div className="space-y-4">
      <ProfileHero
        business={business}
        cover={cover}
        logo={logo}
        portfolioCount={portfolioMedia.length}
      />

      <ProfileHighlights services={services} />

      <section className="rounded-lg border bg-card">
        <Tabs defaultValue="all">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
            <TabsList>
              <TabsTrigger value="all">
                <Grid3X3 className="size-4" />
                Tümü
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="size-4" />
                Fotoğraflar
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Film className="size-4" />
                Videolar
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
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

          <TabsContent value="all" className="m-0 p-4 sm:p-6">
            <PortfolioGrid
              items={portfolioMedia}
              services={services}
              showAddTile
              emptyHeadline="Fotoğraflar paylaş"
              emptyDescription="Paylaştığın fotoğraf ve videolar profilinde görünür."
            />
          </TabsContent>
          <TabsContent value="images" className="m-0 p-4 sm:p-6">
            <PortfolioGrid
              items={images}
              services={services}
              showAddTile
              emptyHeadline="İlk fotoğrafını paylaş"
              emptyDescription="Çalışmalarını müşterilerin gördüğü profil grid'inde sergile."
            />
          </TabsContent>
          <TabsContent value="videos" className="m-0 p-4 sm:p-6">
            <PortfolioGrid
              items={videos}
              services={services}
              showAddTile
              emptyHeadline="İlk videonu paylaş"
              emptyDescription="Kısa videolar profilini daha canlı gösterir."
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function PortfolioGrid({
  items,
  services,
  showAddTile = false,
  emptyHeadline,
  emptyDescription,
}: {
  items: BusinessMediaItem[];
  services: ServiceOption[];
  showAddTile?: boolean;
  emptyHeadline: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full border">
          <Camera className="size-9" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{emptyHeadline}</h2>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        <MediaUploadButton
          mediaType="PORTFOLIO_IMAGE"
          label="İlk fotoğrafını paylaş"
          variant="ghost"
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {showAddTile && <AddMediaTile />}
      {items.map((item) => (
        <MediaItemCard key={item.id} media={item} services={services} />
      ))}
    </div>
  );
}
