import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiPage } from "@/lib/api/response";
import { parseCursorParams } from "@/lib/api/pagination";
import { listNotificationsForUser } from "@urglowup/domain/notifications";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { cursor, limit } = parseCursorParams(request.nextUrl.searchParams);
  const page = await listNotificationsForUser(auth.user.id, { cursor, limit });

  return apiPage(page);
}
