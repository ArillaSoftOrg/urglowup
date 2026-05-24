import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getExplorePosts } from "@/lib/queries/posts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const styleTagId = searchParams.get("styleTagId") ?? undefined;
  const takeParam = searchParams.get("take");
  const take = takeParam ? Math.min(parseInt(takeParam, 10), 50) : 20;

  const user = await getCurrentUser().catch(() => null);

  const result = await getExplorePosts({
    cursor,
    categoryId,
    styleTagId,
    take,
    userId: user?.id,
  });

  return NextResponse.json(result);
}
