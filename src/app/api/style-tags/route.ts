import { NextResponse } from "next/server";
import { getAllStyleTags } from "@/lib/queries/style-tags";

export const revalidate = 3600;

export async function GET() {
  const tags = await getAllStyleTags();
  return NextResponse.json(tags);
}
