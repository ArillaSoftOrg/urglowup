"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  adminDeleteDraftBusinessCover,
  adminFetchGooglePhotoPreviews,
  adminFinalizeDraftBusiness,
  adminSaveDraftBusinessCover,
} from "@/app/(admin)/admin/businesses/photo-setup-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALLOWED_IMAGE_MIMES,
  IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  formatFileSize,
} from "@/lib/constants/media";
import { cn } from "@/lib/utils";
import type { GooglePlacePhotoPreview } from "@/lib/external/google/places-photos-normalizer";

type ExistingCover = {
  id: string;
  url: string;
  sortOrder: number;
};

type CloudinaryUpload = {
  public_id: string;
  secure_url: string;
  format: "jpg" | "jpeg" | "png" | "webp";
  bytes: number;
  width?: number;
  height?: number;
};

function uploadToCloudinary(
  file: File,
  signed: {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  },
  onProgress: (progress: number) => void,
): Promise<CloudinaryUpload> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("folder", signed.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("Dosya yüklenirken ağ bağlantısı kesildi. Lütfen yeniden deneyin."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUpload);
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        reject(new Error(body.error?.message || "Cloudinary yüklemesi tamamlanamadı."));
      } catch {
        reject(new Error("Cloudinary yüklemesi tamamlanamadı."));
      }
    };
    xhr.send(formData);
  });
}

function authorLabel(photo: GooglePlacePhotoPreview): string {
  const names = photo.authorAttributions
    .map((author) => author.displayName)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : "Google Maps";
}

export function BusinessPhotoSetup({
  businessId,
  businessName,
  initialCovers,
}: {
  businessId: string;
  businessName: string;
  initialCovers: ExistingCover[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<GooglePlacePhotoPreview[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [covers, setCovers] = useState(
    [...initialCovers].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3),
  );
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadPreviews() {
    setIsLoadingPreviews(true);
    setError(null);
    try {
      const result = await adminFetchGooglePhotoPreviews(businessId);
      setPhotos(result.photos);
      setMessage(result.message ?? null);
    } catch {
      setPhotos([]);
      setMessage("Google önizlemelerine ulaşılamadı. Kendi dosyalarınızı yine de yükleyebilirsiniz.");
    } finally {
      setIsLoadingPreviews(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    adminFetchGooglePhotoPreviews(businessId)
      .then((result) => {
        if (cancelled) return;
        setPhotos(result.photos);
        setMessage(result.message ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setPhotos([]);
        setMessage("Google önizlemelerine ulaşılamadı. Kendi dosyalarınızı yine de yükleyebilirsiniz.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPreviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const remainingSlots = 3 - covers.length;
  const canFinalize = covers.length >= 1 && rightsConfirmed && !isUploading && !isPending;
  const selectedOrder = useMemo(
    () => new Map(selectedPhotoIds.map((id, index) => [id, index + 1])),
    [selectedPhotoIds],
  );

  function toggleReference(photoId: string) {
    setSelectedPhotoIds((current) => {
      if (current.includes(photoId)) return current.filter((id) => id !== photoId);
      if (current.length >= 3) {
        setError("Referans olarak en fazla 3 Google fotoğrafı seçebilirsiniz.");
        return current;
      }
      setError(null);
      return [...current, photoId];
    });
  }

  async function uploadFiles(files: File[]) {
    setError(null);
    setMessage(null);

    if (!rightsConfirmed) {
      setError("Dosya yüklemeden önce kullanım hakkı onayını işaretleyin.");
      return;
    }
    if (files.length === 0) return;
    if (files.length > remainingSlots) {
      setError(`Bu kurulumda en fazla ${remainingSlots} fotoğraf daha yükleyebilirsiniz.`);
      return;
    }

    for (const file of files) {
      if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type)) {
        setError(`${file.name} desteklenmiyor. JPEG, PNG veya WebP seçin.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`${file.name} çok büyük. En fazla ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} yükleyebilirsiniz.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedCovers: ExistingCover[] = [];

    try {
      for (const [index, file] of files.entries()) {
        const signResponse = await fetch("/api/media/sign-upload-admin-business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });
        const signed = (await signResponse.json()) as {
          error?: string;
          signature: string;
          timestamp: number;
          apiKey: string;
          cloudName: string;
          folder: string;
        };
        if (!signResponse.ok) throw new Error(signed.error || "Yükleme izni alınamadı.");

        const uploaded = await uploadToCloudinary(file, signed, (progress) => {
          const completedBase = (index / files.length) * 100;
          setUploadProgress(Math.round(completedBase + progress / files.length));
        });
        const saved = await adminSaveDraftBusinessCover({
          businessId,
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
          format: uploaded.format,
          bytes: uploaded.bytes,
          originalWidth: uploaded.width,
          originalHeight: uploaded.height,
          rightsConfirmed: true,
        });
        if (!saved.success || !saved.mediaId) {
          throw new Error(saved.message || "Fotoğraf kaydedilemedi.");
        }

        uploadedCovers.push({
          id: saved.mediaId,
          url: uploaded.secure_url,
          sortOrder: covers.length + uploadedCovers.length,
        });
      }

      setCovers((current) => [...current, ...uploadedCovers]);
      setMessage(`${uploadedCovers.length} kapak fotoğrafı yüklendi.`);
      router.refresh();
    } catch (uploadError) {
      if (uploadedCovers.length > 0) {
        setCovers((current) => [...current, ...uploadedCovers]);
      }
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Fotoğraf yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.",
      );
      router.refresh();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function deleteCover(mediaId: string) {
    setError(null);
    startTransition(async () => {
      const result = await adminDeleteDraftBusinessCover(businessId, mediaId);
      if (result.success) {
        setCovers((current) => current.filter((cover) => cover.id !== mediaId));
        setMessage(result.message ?? null);
        router.refresh();
      } else {
        setError(result.message ?? "Fotoğraf silinemedi.");
      }
    });
  }

  function finalize() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await adminFinalizeDraftBusiness({ businessId, rightsConfirmed: true });
      if (result.success) {
        setMessage(result.message ?? "İşletme yayınlandı.");
        router.refresh();
      } else {
        setError(result.message ?? "İşletme yayınlanamadı.");
      }
    });
  }

  return (
    <Card className="border-warning/50 bg-surface-cream shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="warning">Yayınlanmamış taslak</Badge>
            <CardTitle className="mt-3 text-lg">Fotoğrafları tamamlayın</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {businessName} için Google Maps referanslarını inceleyin, ardından kullanım hakkınız olan 1–3 kapak dosyasını yükleyin.
            </p>
          </div>
          <div className="shrink-0 text-left sm:min-w-20 sm:text-right">
            <p className="text-2xl font-semibold tabular-nums">{covers.length}/3</p>
            <p className="whitespace-nowrap text-xs text-muted-foreground">Kalıcı kapak</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section aria-labelledby="google-reference-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 id="google-reference-heading" className="text-base font-semibold">
                Google Maps referansları
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                En fazla 3 referans seçin. Seçimler ve Google görselleri kaydedilmez.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadPreviews()}
              disabled={isLoadingPreviews}
            >
              {isLoadingPreviews ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Yenile
            </Button>
          </div>

          {isLoadingPreviews ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Google fotoğrafları yükleniyor">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {photos.map((photo) => {
                const order = selectedOrder.get(photo.id);
                return (
                  <div key={photo.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={Boolean(order)}
                      onClick={() => toggleReference(photo.id)}
                      className={cn(
                        "relative block aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted transition focus-visible:ring-3 focus-visible:ring-ring/50",
                        order ? "border-foreground ring-2 ring-foreground/15" : "border-border hover:border-foreground/40",
                      )}
                    >
                      {/* Google media URLs are short-lived and intentionally bypass Next image caching. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt={`${businessName} için Google Maps fotoğraf referansı`}
                        className="size-full object-cover"
                      />
                      {order && (
                        <span className="absolute left-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background shadow-sm">
                          {order}
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm">
                        {order ? <Check className="size-4" /> : <ImagePlus className="size-4" />}
                      </span>
                    </button>
                    <div className="mt-2 min-w-0 text-xs text-muted-foreground">
                      <p className="truncate" title={authorLabel(photo)}>{authorLabel(photo)}</p>
                      {photo.googleMapsUri && (
                        <a
                          href={photo.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex min-h-8 items-center gap-1 font-medium text-foreground underline decoration-border underline-offset-4"
                        >
                          Google Maps
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Google önizlemesi bulunamadı. Kalıcı kapak dosyalarını aşağıdan yükleyebilirsiniz.
            </div>
          )}
        </section>

        <section className="border-t border-border/70 pt-6" aria-labelledby="permanent-cover-heading">
          <div>
            <h3 id="permanent-cover-heading" className="text-base font-semibold">
              Kalıcı profil kapakları
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Google önizlemeleri otomatik kopyalanmaz. JPEG, PNG veya WebP dosyalarından 1–3 adet yükleyin; ilk dosya ana kapak olur.
            </p>
          </div>

          {covers.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {covers.map((cover, index) => (
                <div key={cover.id} className="overflow-hidden rounded-lg border bg-background">
                  <div className="relative aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover.url} alt={`${businessName} kapak fotoğrafı ${index + 1}`} className="size-full object-cover" />
                    <Badge variant={index === 0 ? "success" : "neutral"} className="absolute left-2 top-2">
                      {index === 0 ? "Ana kapak" : `${index + 1}. kapak`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Profil galerisi</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${index + 1}. kapak fotoğrafını sil`}
                      onClick={() => deleteCover(cover.id)}
                      disabled={isPending || isUploading}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-background p-3 text-sm">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(event) => setRightsConfirmed(event.target.checked)}
              className="mt-0.5 size-4 rounded border-input accent-foreground"
            />
            <span>
              <span className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4 shrink-0" />
                Bu dosyaları kullanma hakkım var
              </span>
              <span className="mt-1 block text-muted-foreground">
                Yüklediğiniz dosyalar size ait veya kullanım izniniz bulunan içerikler olmalıdır.
              </span>
            </span>
          </label>

          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={!rightsConfirmed || remainingSlots === 0 || isUploading || isPending}
              className="min-h-11"
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {isUploading ? `Fotoğraflar yükleniyor: %${uploadProgress}` : `Dosya seç (${remainingSlots} yer kaldı)`}
            </Button>
            <Button
              type="button"
              onClick={finalize}
              disabled={!canFinalize}
              className="min-h-11"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              İşletmeyi yayınla
            </Button>
          </div>

          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          {message && !error && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
        </section>
      </CardContent>
    </Card>
  );
}
