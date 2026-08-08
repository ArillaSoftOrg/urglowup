import { getCurrentUser } from "@/lib/auth";
import { apiError } from "./response";
import type { NextResponse } from "next/server";

type RequireApiUserResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; response: NextResponse };

/**
 * Session check for /api/v1 routes. Accepts both the existing cookie
 * session (web) and `Authorization: Bearer <token>` (mobile, via
 * better-auth's `bearer` plugin, registered in src/lib/auth.ts) — no
 * branching needed here, better-auth resolves either transparently before
 * getCurrentUser()'s getSession() call sees it.
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
