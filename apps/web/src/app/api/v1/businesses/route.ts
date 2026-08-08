import type { NextRequest } from "next/server";
import { apiOk } from "@/lib/api/response";
import { getMarketplaceBusinesses, parseMarketplaceFilters } from "@/lib/queries/marketplace";

/**
 * Not true cursor pagination — getMarketplaceBusinesses ranks the whole
 * matching set in memory (see packages/domain/src/marketplace/ranking.ts),
 * which doesn't compose with DB-level cursor pagination without a
 * materialized ranking score. Flagged as a known gap in the master
 * implementation plan (Phase 5); out of scope here. Returns the existing
 * limit-capped, ranked list instead.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawFilters = Object.fromEntries(searchParams.entries());
  const filters = parseMarketplaceFilters(rawFilters);

  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

  const businesses = await getMarketplaceBusinesses({ ...filters, limit });

  return apiOk({ data: businesses });
}
