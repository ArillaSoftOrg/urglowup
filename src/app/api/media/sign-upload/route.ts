import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { generateUploadSignature } from "@/lib/cloudinary";
import {
  IMAGE_MEDIA_TYPES,
  VIDEO_MEDIA_TYPES,
  MAX_IMAGES_PER_BUSINESS,
  MAX_VIDEOS_PER_BUSINESS,
  getUploadFolder,
  getResourceType,
} from "@/lib/constants/media";

const requestSchema = z.object({
  mediaType: z.enum([
    "COVER",
    "LOGO",
    "PORTFOLIO_IMAGE",
    "PORTFOLIO_VIDEO",
    "SERVICE_IMAGE",
    "BEFORE_AFTER",
  ]),
});

export async function POST(request: Request) {
  // Auth
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { mediaType } = result.data;
  const resourceType = getResourceType(mediaType);

  // Check limits
  if (IMAGE_MEDIA_TYPES.includes(mediaType)) {
    const count = await db.businessMedia.count({
      where: { businessId: business.id, type: { in: IMAGE_MEDIA_TYPES } },
    });
    // Cover and logo replace, so they don't count against the limit check
    if (mediaType !== "COVER" && mediaType !== "LOGO" && count >= MAX_IMAGES_PER_BUSINESS) {
      return NextResponse.json(
        { error: `Image limit reached (${MAX_IMAGES_PER_BUSINESS})` },
        { status: 400 }
      );
    }
  }

  if (VIDEO_MEDIA_TYPES.includes(mediaType)) {
    const count = await db.businessMedia.count({
      where: { businessId: business.id, type: { in: VIDEO_MEDIA_TYPES } },
    });
    if (count >= MAX_VIDEOS_PER_BUSINESS) {
      return NextResponse.json(
        { error: `Video limit reached (${MAX_VIDEOS_PER_BUSINESS})` },
        { status: 400 }
      );
    }
  }

  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getUploadFolder(business.id, mediaType);

  const { signature, apiKey, cloudName } = generateUploadSignature({
    folder,
    timestamp,
    resource_type: resourceType,
  });

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    resourceType,
  });
}
