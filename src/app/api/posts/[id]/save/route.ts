import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
