"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2, X, Video, Image as ImageIcon, Plus, AlertCircle, Info, Scissors, Sparkles, BookOpen, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPost } from "@/app/(business)/business/posts/actions";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/constants/media";

const MAX_MEDIA_PER_POST = 10;
const ACCEPT = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES].join(",");

interface UploadedMedia {
  url: string;
  publicId: string;
  type: "IMAGE" | "VIDEO";
  sortOrder: number;
  width?: number;
  height?: number;
  duration?: number;
  previewUrl: string;
}

interface PostCreateDialogProps {
  services: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  styleTags: Array<{ id: string; name: string; slug: string }>;
}

const MAX_STYLE_TAGS = 5;

type ContentType = "REAL_WORK" | "INSPIRATION" | "EDUCATIONAL" | "PROMOTION";

const CONTENT_TYPES: Array<{ value: ContentType; label: string; description: string; icon: React.ElementType }> = [
  { value: "REAL_WORK",    label: "Gerçek Çalışma",   description: "Yaptığınız bir çalışma veya sonuç",     icon: Scissors  },
  { value: "INSPIRATION",  label: "İlham",             description: "Referans veya mood board",              icon: Sparkles  },
  { value: "EDUCATIONAL",  label: "Eğitim / İpucu",    description: "Nasıl yapılır veya bilgi paylaşımı",    icon: BookOpen  },
  { value: "PROMOTION",    label: "Kampanya / Duyuru", description: "Fiyat, indirim veya hizmet duyurusu",   icon: Megaphone },
];

const CONTENT_TYPE_HINTS: Partial<Record<ContentType, { variant: "info" | "warning"; text: string }>> = {
  PROMOTION:   { variant: "warning", text: "Kampanya gönderileri İlham akışında görünmez. İşletme profilinizde ve duyuru alanlarında gösterilir." },
  REAL_WORK:   { variant: "info",    text: "Gerçek sonuçlarınızı fotoğraf veya video ile destekleyin — müşteriler bunu çok değerli bulur." },
  EDUCATIONAL: { variant: "info",    text: "Faydalı bir bakım ipucu veya adım adım rehber yazın. Eğitici içerikler en çok etkileşimi alır." },
};

const DESCRIPTION_PLACEHOLDERS: Record<ContentType | "", string> = {
  "":           "Hizmet, ilham veya detaylar hakkında bir şeyler yazın...",
  REAL_WORK:    "Bu çalışmayı anlatın: ne uygulandı, ne kadar sürdü, sonuç nasıldı?",
  INSPIRATION:  "Neden ilham verici? Hangi tarzı veya duyguyu yansıtıyor?",
  EDUCATIONAL:  "Adım adım açıklayın: hangi ürünleri veya teknikleri kullandınız?",
  PROMOTION:    "Kampanyanın detaylarını paylaşın: ne, ne zaman, kim için?",
};

export function PostCreateDialog({ services, categories, styleTags }: PostCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [relatedServiceId, setRelatedServiceId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contentType, setContentType] = useState<ContentType | "">("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMedia([]);
    setDescription("");
    setRelatedServiceId("");
    setCategoryId("");
    setSelectedTagIds([]);
    setContentType("");
    setUploadError(null);
    setSubmitError(null);
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= MAX_STYLE_TAGS) return prev;
      return [...prev, id];
    });
  }

  async function handleFiles(files: FileList) {
    const remaining = MAX_MEDIA_PER_POST - media.length;
    if (remaining <= 0) {
      setUploadError(`En fazla ${MAX_MEDIA_PER_POST} dosya ekleyebilirsiniz.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploadError(null);
    setUploading(true);

    for (const file of toUpload) {
      const isVideo = file.type.startsWith("video/");
      const allowedMimes = isVideo
        ? (ALLOWED_VIDEO_MIMES as readonly string[])
        : (ALLOWED_IMAGE_MIMES as readonly string[]);
      const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

      if (!allowedMimes.includes(file.type)) {
        setUploadError(
          `Desteklenmeyen dosya türü: ${file.name}. İzin verilenler: JPEG, PNG, WebP, MP4, MOV, WebM.`
        );
        continue;
      }
      if (file.size > maxSize) {
        setUploadError(
          `Dosya çok büyük: ${file.name}. ${isVideo ? "Video maks. 100MB" : "Görsel maks. 10MB"}.`
        );
        continue;
      }

      try {
        // Get Cloudinary signature
        const signRes = await fetch("/api/media/sign-upload-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileType: isVideo ? "video" : "image" }),
        });
        if (!signRes.ok) {
          const data = await signRes.json();
          throw new Error(data.error || "İmza alınamadı.");
        }
        const { signature, timestamp, apiKey, cloudName, folder, resourceType } =
          await signRes.json();

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
        formData.append("folder", folder);

        const uploadRes = await new Promise<Record<string, unknown>>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
            );
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                try {
                  const err = JSON.parse(xhr.responseText);
                  reject(new Error(err.error?.message || "Yükleme başarısız."));
                } catch {
                  reject(new Error("Yükleme başarısız."));
                }
              }
            };
            xhr.onerror = () => reject(new Error("Ağ hatası."));
            xhr.send(formData);
          }
        );

        const previewUrl = URL.createObjectURL(file);
        setMedia((prev) => [
          ...prev,
          {
            url: uploadRes.secure_url as string,
            publicId: uploadRes.public_id as string,
            type: isVideo ? "VIDEO" : "IMAGE",
            sortOrder: prev.length,
            width: uploadRes.width as number | undefined,
            height: uploadRes.height as number | undefined,
            duration: uploadRes.duration as number | undefined,
            previewUrl,
          },
        ]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Yükleme başarısız.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeMedia(index: number) {
    setMedia((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, sortOrder: i }))
    );
  }

  function handleSubmit() {
    if (media.length === 0 && !description.trim()) {
      setSubmitError("Açıklama veya en az bir görsel/video ekleyin.");
      return;
    }
    if (!contentType) {
      setSubmitError("Gönderi türünü seçin.");
      return;
    }
    setSubmitError(null);

    startTransition(async () => {
      const result = await createPost({
        description: description || undefined,
        relatedServiceId: relatedServiceId || undefined,
        categoryId: categoryId || undefined,
        styleTagIds: selectedTagIds,
        contentType,
        media: media.map((m) => ({
          url: m.url,
          publicId: m.publicId,
          type: m.type,
          sortOrder: m.sortOrder,
          width: m.width,
          height: m.height,
          duration: m.duration,
        })),
      });

      if (result.success) {
        reset();
        setOpen(false);
      } else {
        setSubmitError(result.message ?? "Gönderi oluşturulamadı.");
      }
    });
  }

  const hint = contentType ? CONTENT_TYPE_HINTS[contentType] : undefined;
  const isSubmitBlocked = !contentType || (media.length === 0 && !description.trim());

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger
        render={<Button variant="default" />}
      >
        <Plus className="size-4" />
        Yeni Gönderi
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className="border-b p-4">
          <SheetTitle className="text-base font-semibold">Yeni Gönderi</SheetTitle>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Media upload zone */}
          <div className="space-y-2">
            <Label>Görseller / Videolar</Label>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />

            {media.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {m.type === "VIDEO" ? (
                      <video
                        src={m.previewUrl}
                        className="size-full object-cover"
                        muted
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.previewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="flex size-6 items-center justify-center rounded-full bg-white text-black"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    {m.type === "VIDEO" && (
                      <Video className="absolute bottom-1 right-1 size-3.5 text-white drop-shadow" />
                    )}
                    {m.type === "IMAGE" && (
                      <ImageIcon className="absolute bottom-1 right-1 size-3.5 text-white drop-shadow" />
                    )}
                  </div>
                ))}

                {media.length < MAX_MEDIA_PER_POST && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Plus className="size-5" />
                    )}
                  </button>
                )}
              </div>
            )}

            {media.length === 0 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : (
                  <Upload className="size-8" />
                )}
                <span className="text-sm">
                  {uploading ? "Yükleniyor..." : "Görsel veya video ekle"}
                </span>
                <span className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, MP4, MOV, WebM • Maks. {MAX_MEDIA_PER_POST} dosya
                </span>
              </button>
            )}

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label>Gönderi türü <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((ct) => {
                const selected = contentType === ct.value;
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setContentType(ct.value)}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <ct.icon className={`mb-1 size-4 ${selected ? "text-primary" : ""}`} />
                    <span className="font-medium">{ct.label}</span>
                    <span className="mt-0.5 text-[11px] leading-tight opacity-75">{ct.description}</span>
                  </button>
                );
              })}
            </div>
            {hint && (
              hint.variant === "warning" ? (
                <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{hint.text}</p>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">{hint.text}</p>
                </div>
              )
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={DESCRIPTION_PLACEHOLDERS[contentType]}
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Service */}
          {services.length > 0 && (
            <div className="space-y-2">
              <Label>İlgili hizmet (isteğe bağlı)</Label>
              <Select value={relatedServiceId} onValueChange={(v) => setRelatedServiceId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategori (isteğe bağlı)</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Style Tags */}
          {styleTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Stil etiketleri (isteğe bağlı)</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedTagIds.length}/{MAX_STYLE_TAGS}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Doğru etiketler içeriğinizin arayanlara ulaşmasını sağlar.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {styleTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      disabled={!selected && selectedTagIds.length >= MAX_STYLE_TAGS}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </div>

        <div className="border-t p-4">
          {isSubmitBlocked && (
            <p className="mb-2 text-center text-xs text-muted-foreground">
              {!contentType
                ? "Gönderi türünü seçin."
                : "Açıklama veya en az bir görsel/video ekleyin."}
            </p>
          )}
          <Button onClick={handleSubmit} disabled={uploading || isSubmitBlocked} className="w-full">
            Paylaş
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
