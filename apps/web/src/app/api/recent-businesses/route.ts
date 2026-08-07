import { cookies } from "next/headers";
import {
  MAX_RECENT_BUSINESSES,
  RECENT_BUSINESSES_COOKIE_KEY,
  parseRecentBusinessIds,
} from "@/lib/recent-business-history";

export async function POST(request: Request) {
  let businessId: unknown;

  try {
    const body: unknown = await request.json();
    businessId =
      typeof body === "object" && body !== null && "businessId" in body
        ? body.businessId
        : null;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (
    typeof businessId !== "string" ||
    businessId.length === 0 ||
    businessId.length > 64 ||
    !/^[a-zA-Z0-9_-]+$/.test(businessId)
  ) {
    return Response.json({ error: "Geçersiz işletme kimliği." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingIds = parseRecentBusinessIds(
    cookieStore.get(RECENT_BUSINESSES_COOKIE_KEY)?.value,
  );
  const nextIds = [
    businessId,
    ...existingIds.filter((id) => id !== businessId),
  ].slice(0, MAX_RECENT_BUSINESSES);

  cookieStore.set(RECENT_BUSINESSES_COOKIE_KEY, nextIds.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    priority: "low",
  });

  return new Response(null, { status: 204 });
}
