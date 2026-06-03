import { getOptimizedUrl, getVideoPosterUrl } from "@/lib/cloudinary";

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

  return {
    x: asset.cropX,
    y: asset.cropY,
    width: asset.cropWidth,
    height: asset.cropHeight,
  };
}

export function optimizeBusinessCoverUrl(
  asset: BusinessImageAsset | undefined,
  fallbackUrl: string | null,
  width = 960,
): string | null {
  if (asset?.publicId) {
    return getOptimizedUrl(
      asset.publicId,
      { width, crop: "limit", quality: "auto:good" },
      getCropMeta(asset),
    );
  }

  return fallbackUrl;
}

type PostImageAsset = {
  publicId: string;
  type: string;
};

export function optimizePostImageUrl(
  asset: PostImageAsset | undefined,
  fallbackUrl: string,
  width = 960,
): string {
  if (asset?.publicId && asset.type !== "VIDEO") {
    return getOptimizedUrl(asset.publicId, {
      width,
      crop: "limit",
      quality: "auto:good",
    });
  }

  return fallbackUrl;
}

export function optimizePostViewerImageUrl(
  asset: PostImageAsset | undefined,
  fallbackUrl: string,
  width = 1600,
): string {
  if (asset?.publicId && asset.type !== "VIDEO") {
    return getOptimizedUrl(asset.publicId, {
      width,
      crop: "limit",
      quality: "auto:good",
    });
  }

  return fallbackUrl;
}

export function optimizePostVideoPosterUrl(
  asset: PostImageAsset | undefined,
  width = 960,
): string | null {
  if (asset?.publicId && asset.type === "VIDEO") {
    return getVideoPosterUrl(asset.publicId, {
      width,
      crop: "limit",
      quality: "auto:good",
    });
  }

  return null;
}

export function optimizeBusinessLogoUrl(
  asset: BusinessImageAsset | undefined,
  fallbackUrl: string | null,
  width = 128,
): string | null {
  if (asset?.publicId) {
    return getOptimizedUrl(asset.publicId, {
      width,
      crop: "limit",
      quality: "auto:good",
    });
  }

  return fallbackUrl;
}
