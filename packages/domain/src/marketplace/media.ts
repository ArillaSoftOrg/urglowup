import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Duplicated (not shared) from apps/web/src/lib/cloudinary.ts +
// optimized-media.ts. Those files also cover upload signing and deletion,
// which need the Cloudinary API secret via apps/web's shared env.ts — pulling
// that whole module in for two URL-building helpers would be a real
// layering violation. Building a delivery URL only needs the (public)
// cloud name, so this configures the SDK with just that.

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    secure: true,
  });
  configured = true;
}

function getOptimizedUrl(
  publicId: string,
  transforms?: { width?: number; height?: number; quality?: string; crop?: string },
  cropMeta?: { x: number; y: number; width: number; height: number },
): string {
  ensureConfigured();

  const resizeStep: Record<string, string | number | undefined> = {};
  if (transforms?.width) resizeStep.width = transforms.width;
  if (transforms?.height) resizeStep.height = transforms.height;
  if (transforms?.crop) resizeStep.crop = transforms.crop;
  resizeStep.quality = transforms?.quality ?? "auto:good";
  resizeStep.fetch_format = "auto";

  const transformation = cropMeta
    ? [
        { crop: "crop", x: cropMeta.x, y: cropMeta.y, width: cropMeta.width, height: cropMeta.height },
        resizeStep,
      ]
    : [resizeStep];

  return cloudinary.url(publicId, { secure: true, transformation });
}

type BusinessImageAsset = {
  type: string;
  publicId: string;
  cropX: number | null;
  cropY: number | null;
  cropWidth: number | null;
  cropHeight: number | null;
};

function getCropMeta(asset?: BusinessImageAsset) {
  if (
    !asset ||
    asset.cropX == null ||
    asset.cropY == null ||
    asset.cropWidth == null ||
    asset.cropHeight == null
  ) {
    return undefined;
  }
  return { x: asset.cropX, y: asset.cropY, width: asset.cropWidth, height: asset.cropHeight };
}

export function optimizeBusinessCoverUrl(
  asset: BusinessImageAsset | undefined,
  fallbackUrl: string | null,
  width = 960,
): string | null {
  if (asset?.publicId) {
    return getOptimizedUrl(asset.publicId, { width, crop: "limit", quality: "auto:good" }, getCropMeta(asset));
  }
  return fallbackUrl;
}

export function optimizeBusinessLogoUrl(
  asset: BusinessImageAsset | undefined,
  fallbackUrl: string | null,
  width = 128,
): string | null {
  if (asset?.publicId) {
    return getOptimizedUrl(asset.publicId, { width, crop: "limit", quality: "auto:good" });
  }
  return fallbackUrl;
}
