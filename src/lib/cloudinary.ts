import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
}

/**
 * Generate signed upload parameters for direct browser-to-Cloudinary upload.
 * The API secret never leaves the server.
 */
export function generateUploadSignature(params: {
  folder: string;
  timestamp: number;
  eager?: string;
  resource_type?: string;
}): { signature: string; apiKey: string; cloudName: string } {
  ensureConfigured();

  const paramsToSign: Record<string, string | number> = {
    folder: params.folder,
    timestamp: params.timestamp,
  };
  if (params.eager) paramsToSign.eager = params.eager;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Delete an asset from Cloudinary by publicId.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Build an optimized Cloudinary delivery URL with optional crop region.
 * When cropMeta is provided, a two-step transformation is applied:
 * 1. Extract the user-selected region (c_crop)
 * 2. Resize/optimize within the extracted region
 */
export function getOptimizedUrl(
  publicId: string,
  transforms?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
  },
  cropMeta?: { x: number; y: number; width: number; height: number }
): string {
  ensureConfigured();

  const resizeStep: Record<string, string | number | undefined> = {};
  if (transforms?.width) resizeStep.width = transforms.width;
  if (transforms?.height) resizeStep.height = transforms.height;
  if (transforms?.crop) resizeStep.crop = transforms.crop;
  resizeStep.quality = transforms?.quality ?? "auto";
  resizeStep.fetch_format = transforms?.format ?? "auto";

  const transformation = cropMeta
    ? [
        { crop: "crop", x: cropMeta.x, y: cropMeta.y, width: cropMeta.width, height: cropMeta.height },
        resizeStep,
      ]
    : [resizeStep];

  return cloudinary.url(publicId, {
    secure: true,
    transformation,
  });
}
