import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { MediaType } from "@/generated/prisma/enums";

interface Params {
  params: Promise<{ id: string }>;
}

const PUBLIC_PORTFOLIO_TYPES: MediaType[] = [
  MediaType.PORTFOLIO_IMAGE,
  MediaType.PORTFOLIO_VIDEO,
];

async function getPublicMedia(mediaId: string) {
  return db.businessMedia.findFirst({
    where: {
      id: mediaId,
      status: "ACTIVE",
      type: { in: PUBLIC_PORTFOLIO_TYPES },
    },
    select: { id: true },
  });
}

async function getLikeCount(mediaId: string) {
  return db.businessMediaLike.count({ where: { mediaId } });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    scope: "media-action",
    headers: request.headers,
    subjectId: user.id,
    ipLimit: 200,
    subjectLimit: 120,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.message },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const { id: mediaId } = await params;
  const media = await getPublicMedia(mediaId);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.businessMediaLike.upsert({
    where: { userId_mediaId: { userId: user.id, mediaId } },
    create: { userId: user.id, mediaId },
    update: {},
  });

  return NextResponse.json({
    liked: true,
    likeCount: await getLikeCount(mediaId),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mediaId } = await params;
  const media = await getPublicMedia(mediaId);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.businessMediaLike.deleteMany({
    where: { userId: user.id, mediaId },
  });

  return NextResponse.json({
    liked: false,
    likeCount: await getLikeCount(mediaId),
  });
}
