import { NextResponse } from "next/server";
import { GOOGLE_PLACE_BACKFILL_BATCH_SIZE } from "@/lib/constants/external";
import { backfillMissingGooglePlaceIds } from "@/lib/external/google/place-backfill";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
  }

  const result = await backfillMissingGooglePlaceIds(
    GOOGLE_PLACE_BACKFILL_BATCH_SIZE,
  );

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
