import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";
import { getUploadFolder } from "@/lib/constants/media";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({ businessId: z.string().min(1) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    scope: "admin-business-cover-sign",
    headers: request.headers,
    subjectId: user.id,
    ipLimit: 60,
    subjectLimit: 30,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.message },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz işletme." }, { status: 400 });
  }

  const business = await db.business.findFirst({
    where: {
      id: parsed.data.businessId,
      status: "DRAFT",
      googlePlaceId: { not: null },
      placeReferences: { some: { provider: "GOOGLE", status: "CLAIMED" } },
    },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json(
      { error: "Bu işletme fotoğraf kurulumuna uygun değil." },
      { status: 404 },
    );
  }

  const coverCount = await db.businessMedia.count({
    where: { businessId: business.id, type: "COVER", status: "ACTIVE" },
  });
  if (coverCount >= 3) {
    return NextResponse.json(
      { error: "En fazla 3 kapak fotoğrafı yükleyebilirsiniz." },
      { status: 400 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getUploadFolder(business.id, "COVER");
  const { signature, apiKey, cloudName } = generateUploadSignature({
    folder,
    timestamp,
    resource_type: "image",
  });

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    resourceType: "image",
  });
}
