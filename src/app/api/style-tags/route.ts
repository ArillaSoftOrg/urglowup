import { NextResponse } from "next/server";
import { getAllStyleTags } from "@/lib/queries/style-tags";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await getAllStyleTags();
  return NextResponse.json(tags);
}
