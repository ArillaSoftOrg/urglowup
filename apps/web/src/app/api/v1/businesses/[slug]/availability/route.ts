import type { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { availabilityQuerySchema } from "@urglowup/validation";
import { getAvailableSlots } from "@urglowup/domain/booking";
import { getBusinessBySlug } from "@urglowup/domain/businesses";
import { enforceRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const rateLimit = await enforceRateLimit({
    scope: "availability",
    headers: await headers(),
    ipLimit: 120,
  });
  if (!rateLimit.ok) {
    return apiError("RATE_LIMITED", rateLimit.message);
  }

  const { slug } = await params;
  const parsed = availabilityQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid availability query.");
  }

  const business = await getBusinessBySlug(slug);
  if (!business) {
    return apiError("NOT_FOUND", "Business not found.");
  }

  const slots = await getAvailableSlots(
    business.id,
    parsed.data.serviceId,
    parsed.data.date,
  );

  return apiOk({ date: parsed.data.date, slots });
}
