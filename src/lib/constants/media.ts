import type { MediaType } from "@/generated/prisma/enums";

export const MAX_IMAGES_PER_BUSINESS = 100;
export const MAX_VIDEOS_PER_BUSINESS = 20;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_VIDEO_DURATION_SECONDS = 60;

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = "JPEG, PNG, WebP";
export const ALLOWED_VIDEO_EXTENSIONS = "MP4, MOV, WebM";

/** Image accept string for file inputs */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIMES.join(",");
/** Video accept string for file inputs */
export const VIDEO_ACCEPT = ALLOWED_VIDEO_MIMES.join(",");

/** Media types that count toward the image limit */
export const IMAGE_MEDIA_TYPES: MediaType[] = [
  "COVER",
  "LOGO",
  "PORTFOLIO_IMAGE",
  "SERVICE_IMAGE",
  "BEFORE_AFTER",
];

/** Media types that count toward the video limit */
export const VIDEO_MEDIA_TYPES: MediaType[] = ["PORTFOLIO_VIDEO"];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  COVER: "Kapak fotoğrafı",
  LOGO: "Logo",
  PORTFOLIO_IMAGE: "Portfolyo görseli",
  PORTFOLIO_VIDEO: "Portfolyo videosu",
  SERVICE_IMAGE: "Hizmet görseli",
  BEFORE_AFTER: "Önce / Sonra",
};

/** Resource type for Cloudinary upload */
export function getResourceType(mediaType: MediaType): "image" | "video" {
  return VIDEO_MEDIA_TYPES.includes(mediaType) ? "video" : "image";
}

/** Cloudinary folder for a given business + media type */
export function getUploadFolder(
  businessId: string,
  mediaType: MediaType
): string {
  const sub =
    mediaType === "COVER" || mediaType === "LOGO"
      ? mediaType.toLowerCase()
      : "portfolio";
  return `urglowup/${businessId}/${sub}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
