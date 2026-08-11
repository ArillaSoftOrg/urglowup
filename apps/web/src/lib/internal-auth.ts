import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { INTERNAL_SECRET_HEADER } from "@/lib/constants/external";

/**
 * Authenticates a request to an /api/internal/* route (cron-triggered jobs
 * — cache cleanup, rating recalc, external sync, push receipts, reminders).
 * Secret-only, fail-closed: the x-internal-secret header must exactly
 * match INTERNAL_API_SECRET (timing-safe comparison). No User-Agent
 * fallback — several routes previously trusted
 * `User-Agent: vercel-cron/1.0` as a stand-in for a real credential, but
 * that header is entirely client-controlled, so anyone who knew a route's
 * URL could trigger it (including routes that call paid external APIs or
 * send push notifications to real users) without any secret at all.
 *
 * If INTERNAL_API_SECRET isn't configured, every request is denied — there
 * is no "open" fallback mode. Configure the cron caller (Vercel Cron,
 * GitHub Actions, etc.) to send the secret as the x-internal-secret header.
 */
export function isInternalRequestAuthorized(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;

  const provided = request.headers.get(INTERNAL_SECRET_HEADER);
  if (!provided) return false;

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    // Buffers must be the same length for timingSafeEqual.
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Standard 401 response for an unauthorized /api/internal/* request. */
export function unauthorizedInternalResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}
