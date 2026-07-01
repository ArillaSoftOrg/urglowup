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
  Plus,
  UserRound,
} from "lucide-react";
import { MediaUploadButton } from "./media-upload-button";
import { MediaEditDialog } from "./media-edit-dialog";
import { DiscoverCardPreview } from "./discover-card-preview";
import {
  setAsCover,
  setAsLogo,
  saveCropMeta,
  setPrimaryCover,
} from "@/app/(business)/business/media/actions";
import {
  MEDIA_TYPE_LABELS,
  MAX_IMAGES_PER_BUSINESS,
  MAX_VIDEOS_PER_BUSINESS,
  MAX_COVER_IMAGES,
} from "@/lib/constants/media";
import { cn } from "@/lib/utils";
import type { BusinessMediaItem } from "@/lib/queries/media";

const CropDialog = dynamic(() => import("./crop-dialog"), {
  ssr: false,
  loading: () => (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3 animate-spin" />
      Kırpma aracı yükleniyor...
    </div>
  ),
});

const CROP_ASPECTS: Partial<Record<string, number>> = {
  COVER: 2,
  PORTFOLIO_IMAGE: 1,
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

// ─── Page Header ────────────────────────────────────────────────

function MediaPageHeader({ business }: { business: BusinessProfileSummary }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Görseller</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kapak fotoğrafları, portföy ve logo yönetimi
        </p>
      </div>
      <Link
        href={`/b/${business.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
      >
        <Eye className="size-3.5" />
        Canlı profili gör
      </Link>
    </div>
  );
}

// ─── Cover Item Card ─────────────────────────────────────────────

function CoverItemCard({
  media,
  isPrimary,
  services,
}: {
  media: BusinessMediaItem;
  isPrimary: boolean;
  services: ServiceOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);

  async function handleCropConfirm(crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    setCropSaving(true);
    await saveCropMeta(media.id, crop);
    setCropSaving(false);
    setCropOpen(false);
    router.refresh();
  }

  function handleSetPrimary() {
    startTransition(async () => {
      await setPrimaryCover(media.id);
      router.refresh();
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
        setDeleteError(data.error || "Silinemedi.");
      }
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/30">
      <div className="relative aspect-video">
        <Image
          src={media.url}
          alt={media.title ?? "Kapak fotoğrafı"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {isPrimary && (
            <Badge variant="default" className="text-[10px]">
              Keşfet kartı
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px]">
            Profil galerisi
          </Badge>
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-2 p-2">
        <div className="min-w-0">
          {media.title && (
            <p className="truncate text-xs font-medium">{media.title}</p>
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
              <DropdownMenuItem onClick={() => setCropOpen(true)}>
                <Crop className="size-4" />
                Kırpmayı Düzenle
              </DropdownMenuItem>
              {!isPrimary && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSetPrimary}>
                    Keşfet kartı yap
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
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
            <DialogTitle>Kapak fotoğrafı silinsin mi?</DialogTitle>
            <DialogDescription>
              Bu fotoğraf kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
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
          onOpenChange={(v) => {
            if (!v && !cropSaving) setCropOpen(false);
          }}
          imageUrl={media.url}
          aspect={CROP_ASPECTS["COVER"]}
          hint="Yatay (2:1) oran keşfet kartına ve profil hero'suna en uygun görünümü sağlar."
          initialCrop={
            media.cropX != null &&
            media.cropY != null &&
            media.cropWidth != null &&
            media.cropHeight != null
              ? {
                  x: media.cropX,
                  y: media.cropY,
                  width: media.cropWidth,
                  height: media.cropHeight,
                }
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

// ─── Cover Section ───────────────────────────────────────────────

function CoverSection({
  covers,
  business,
  logoUrl,
  services,
}: {
  covers: BusinessMediaItem[];
  business: BusinessProfileSummary;
  logoUrl: string | null;
  services: ServiceOption[];
}) {
  const primaryCoverUrl = covers[0]?.url ?? business.coverImageUrl;
  const atLimit = covers.length >= MAX_COVER_IMAGES;

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">
            Kapak ve yer fotoğrafları
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Profilinizin üst galerisinde görünür. Birden fazla fotoğraf
            ekleyebilirsiniz.{" "}
            <span className="font-medium text-foreground">
              İlk fotoğraf Keşfet kartında kullanılır.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" />
          {covers.length}/{MAX_COVER_IMAGES}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Cover grid + CTA */}
        <div className="min-w-0 flex-1 space-y-3">
          {covers.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border bg-background">
                <Camera className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Henüz kapak fotoğrafı yok</p>
                <p className="text-sm text-muted-foreground">
                  İlk fotoğraf hem profil hero&apos;sunda hem Keşfet kartında görünür
                </p>
              </div>
              <MediaUploadButton
                mediaType="COVER"
                label="Yer fotoğrafı ekle"
                variant="default"
                size="sm"
              />
            </div>
          ) : (
            <>
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
                {covers.map((cover, index) => (
                  <div
                    key={cover.id}
                    className="w-[82vw] max-w-[360px] shrink-0 snap-start sm:w-auto sm:max-w-none"
                  >
                    <CoverItemCard
                      media={cover}
                      isPrimary={index === 0}
                      services={services}
                    />
                  </div>
                ))}
              </div>
              {!atLimit && (
                <MediaUploadButton
                  mediaType="COVER"
                  label="Yer fotoğrafı ekle"
                  variant="outline"
                  size="sm"
                />
              )}
              {atLimit && (
                <p className="text-xs text-muted-foreground">
                  Maksimum {MAX_COVER_IMAGES} kapak fotoğrafına ulaşıldı.
                </p>
              )}
            </>
          )}
        </div>

        {/* Discover card preview */}
        <div className="shrink-0">
          <DiscoverCardPreview
            name={business.name}
            coverUrl={primaryCoverUrl}
            logoUrl={logoUrl}
            city={business.city}
            district={business.district}
            categories={business.categories}
            rating={business.rating}
            reviewCount={business.reviewCount}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Logo Card ───────────────────────────────────────────────────

function LogoCard({
  logo,
  business,
}: {
  logo: BusinessMediaItem | undefined;
  business: BusinessProfileSummary;
}) {
  const logoUrl = logo?.url ?? business.logoUrl;

  return (
    <section className="flex items-center gap-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-muted bg-muted">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${business.name} logosu`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <UserRound className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium">Logo</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Rezervasyon ve kart önizlemelerinde görünür
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <MediaUploadButton
          mediaType="LOGO"
          label={logoUrl ? "Logo değiştir" : "Logo ekle"}
          size="sm"
          variant="outline"
        />
        {logo && (
          <DeleteMediaButton mediaId={logo.id} label="Kaldır" size="sm" />
        )}
      </div>
    </section>
  );
}

// ─── Portfolio Section ───────────────────────────────────────────

function AddMediaTile({ services }: { services: ServiceOption[] }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border bg-background">
        <Plus className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <MediaUploadButton
          mediaType="PORTFOLIO_IMAGE"
          label="Fotoğraf"
          size="sm"
          variant="outline"
          services={services}
        />
        <MediaUploadButton
          mediaType="PORTFOLIO_VIDEO"
          label="Video"
          size="sm"
          variant="outline"
          services={services}
        />
      </div>
    </div>
  );
}

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
  const supportsCrop = media.type === "PORTFOLIO_IMAGE";

  async function handleCropConfirm(crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    setCropSaving(true);
    await saveCropMeta(media.id, crop);
    setCropSaving(false);
    setCropOpen(false);
    router.refresh();
  }

  function handleSetAsCover() {
    startTransition(async () => {
      await setAsCover(media.id);
      router.refresh();
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
      <div className="relative aspect-square">
        {isVideo ? (
          <>
            <video
              src={media.url}
              className="size-full object-cover"
              muted
              playsInline
              preload="none"
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
            className="object-cover"
          />
        )}

        <Badge
          variant="secondary"
          className="absolute left-1.5 top-1.5 text-[10px]"
        >
          {MEDIA_TYPE_LABELS[media.type]}
        </Badge>
      </div>

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
                    Kapak koleksiyonuna ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSetAsLogo}>
                    Logo yap — Rezervasyonlarda ve kartlarda görünür
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
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
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
          onOpenChange={(v) => {
            if (!v && !cropSaving) setCropOpen(false);
          }}
          imageUrl={media.url}
          aspect={CROP_ASPECTS[media.type]}
          initialCrop={
            media.cropX != null &&
            media.cropY != null &&
            media.cropWidth != null &&
            media.cropHeight != null
              ? {
                  x: media.cropX,
                  y: media.cropY,
                  width: media.cropWidth,
                  height: media.cropHeight,
                }
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
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full border">
          <Camera className="size-9" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{emptyHeadline}</h3>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        <MediaUploadButton
          mediaType="PORTFOLIO_IMAGE"
          label="İlk fotoğrafını paylaş"
          variant="ghost"
          size="sm"
          services={services}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {showAddTile && <AddMediaTile services={services} />}
      {items.map((item) => (
        <MediaItemCard key={item.id} media={item} services={services} />
      ))}
    </div>
  );
}

function PortfolioSection({
  portfolioMedia,
  images,
  videos,
  services,
  imageCount,
  videoCount,
}: {
  portfolioMedia: BusinessMediaItem[];
  images: BusinessMediaItem[];
  videos: BusinessMediaItem[];
  services: ServiceOption[];
  imageCount: number;
  videoCount: number;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-normal">
          Portföy görselleri
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Profil portföy bölümünde kare önizleme olarak görünür. Yüz, tırnak
          ve dövme detayları için Kırpmayı Düzenle ile thumbnail odağını
          ayarlayın. Keşfet kartını etkilemez.
        </p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        <TabsContent value="all" className="m-0 mt-4">
          <PortfolioGrid
            items={portfolioMedia}
            services={services}
            showAddTile
            emptyHeadline="Fotoğraflar paylaş"
            emptyDescription="Fotoğraf ve videolar profil portföy bölümünde görünür. Keşfet kartında ise kapak fotoğrafın kullanılır."
          />
        </TabsContent>
        <TabsContent value="images" className="m-0 mt-4">
          <PortfolioGrid
            items={images}
            services={services}
            showAddTile
            emptyHeadline="İlk fotoğrafını paylaş"
            emptyDescription="Çalışmalarını müşterilerin gördüğü profil portföy bölümünde sergile."
          />
        </TabsContent>
        <TabsContent value="videos" className="m-0 mt-4">
          <PortfolioGrid
            items={videos}
            services={services}
            showAddTile
            emptyHeadline="İlk videonu paylaş"
            emptyDescription="Kısa videolar profil portföy bölümünde görünür; Keşfet kartını etkilemez."
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ─── Delete Button Helper ────────────────────────────────────────

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
              Bu medya galeriden ve Cloudinary&apos;den kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
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

// ─── Main Grid ───────────────────────────────────────────────────

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
  // media arrives ordered by [type asc, sortOrder asc] from getBusinessMedia()
  const covers = media.filter((m) => m.type === "COVER");
  const logo = media.find((m) => m.type === "LOGO");
  const portfolioMedia = media.filter(
    (m) => m.type !== "COVER" && m.type !== "LOGO"
  );
  const images = portfolioMedia.filter((m) => m.type !== "PORTFOLIO_VIDEO");
  const videos = portfolioMedia.filter((m) => m.type === "PORTFOLIO_VIDEO");

  const logoUrl = logo?.url ?? business.logoUrl;

  return (
    <div className="space-y-4">
      <MediaPageHeader business={business} />
      <CoverSection
        covers={covers}
        business={business}
        logoUrl={logoUrl}
        services={services}
      />
      <LogoCard logo={logo} business={business} />
      <PortfolioSection
        portfolioMedia={portfolioMedia}
        images={images}
        videos={videos}
        services={services}
        imageCount={imageCount}
        videoCount={videoCount}
      />
    </div>
  );
}
