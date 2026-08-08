import { getCurrentUser } from "@/lib/auth";
import { apiError } from "./response";
import type { NextResponse } from "next/server";

type RequireApiUserResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; response: NextResponse };

/**
 * Session check for /api/v1 routes. Currently cookie-session only, same as
 * the rest of the app — mobile bearer-token support lands in Phase 4
 * (better-auth's `bearer` plugin), at which point this is the one place
 * that needs to start accepting `Authorization: Bearer <token>` too.
 */
export async function requireApiUser(): Promise<RequireApiUserResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: apiError("UNAUTHORIZED", "Authentication required.") };
  }
  return { ok: true, user };
}

/** IDOR guard: the resource's owning user id must match the caller. */
export function requireOwnership(resourceUserId: string, callerUserId: string): NextResponse | null {
  if (resourceUserId !== callerUserId) {
    return apiError("NOT_FOUND", "Resource not found.");
  }
  return null;
}
