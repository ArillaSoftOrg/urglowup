import { NextResponse } from "next/server";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { computeAndStoreUserAffinity } from "@/lib/personalization";

interface Params {
  params: Promise<{ id: string }>;
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

  const { id: postId } = await params;

  const post = await db.post.findUnique({
    where: { id: postId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.postSave.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    create: { userId: user.id, postId },
    update: {},
  });

  after(() => computeAndStoreUserAffinity(user.id));

  return NextResponse.json({ saved: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  await db.postSave.deleteMany({
    where: { userId: user.id, postId },
  });

  return NextResponse.json({ saved: false });
}
