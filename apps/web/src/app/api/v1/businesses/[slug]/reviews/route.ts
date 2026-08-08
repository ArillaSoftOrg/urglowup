import type { NextRequest } from "next/server";
import { apiPage, apiError } from "@/lib/api/response";
import { parseCursorParams } from "@/lib/api/pagination";
import { listBusinessReviews } from "@urglowup/domain/reviews";
import { getBusinessBySlug } from "@urglowup/domain/businesses";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) {
    return apiError("NOT_FOUND", "Business not found.");
  }

  const { cursor, limit } = parseCursorParams(request.nextUrl.searchParams);
  const page = await listBusinessReviews(business.id, { cursor, limit });

  return apiPage(page);
}
