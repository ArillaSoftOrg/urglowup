import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  GOOGLE_PLACE_BACKFILL_BATCH_SIZE,
  INTERNAL_SECRET_HEADER,
} from "@/lib/constants/external";
import { backfillMissingGooglePlaceIds } from "@/lib/external/google/place-backfill";

export const dynamic = "force-dynamic";

function isAuthorised(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get(INTERNAL_SECRET_HEADER);

  if (provided !== null) {
    if (!secret) return false;
    try {
      const expected = Buffer.from(secret, "utf8");
      const actual = Buffer.from(provided, "utf8");
      if (expected.length !== actual.length) return false;
      return timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  return (request.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const result = await backfillMissingGooglePlaceIds(
    GOOGLE_PLACE_BACKFILL_BATCH_SIZE,
  );

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
