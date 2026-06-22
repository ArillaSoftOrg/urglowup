import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { getResourceType } from "@/lib/constants/media";
import { revalidatePath } from "next/cache";

const requestSchema = z.object({
  mediaId: z.string().min(1),
});

export async function DELETE(request: Request) {
  // Auth — MANAGER or above can delete media
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.businessMember.findFirst({
    where: { userId: user.id },
    select: { businessId: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { id: member.businessId },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

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

  const media = await db.businessMedia.findUnique({
    where: { id: result.data.mediaId },
  });

  if (!media || media.businessId !== business.id) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // Delete from Cloudinary
  const resourceType = getResourceType(media.type);
  try {
    await deleteFromCloudinary(media.publicId, resourceType);
  } catch {
    // Continue even if Cloudinary delete fails — still remove DB record
  }

  // Delete DB record
  await db.businessMedia.delete({ where: { id: media.id } });

  // Update cover/logo reference after deletion
  if (media.type === "COVER") {
    // Point to the next remaining cover (by sortOrder), or clear if none left
    const nextCover = await db.businessMedia.findFirst({
      where: { businessId: business.id, type: "COVER" },
      orderBy: { sortOrder: "asc" },
    });
    await db.business.update({
      where: { id: business.id },
      data: { coverImageUrl: nextCover?.url ?? null },
    });
  } else if (media.type === "LOGO") {
    await db.business.update({
      where: { id: business.id },
      data: { logoUrl: null },
    });
  }

  revalidatePath("/business/media");
  revalidatePath("/business/dashboard");

  return NextResponse.json({ success: true });
}
