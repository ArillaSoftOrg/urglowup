import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiError } from "./response";
import type { NextResponse } from "next/server";

export interface ApiRateLimitOptions {
  scope: string;
  subjectId?: string;
  ipLimit: number;
  subjectLimit?: number;
}

/** Returns a 429 NextResponse if the caller is over the limit, else null. */
export async function enforceApiRateLimit(options: ApiRateLimitOptions): Promise<NextResponse | null> {
  const result = await enforceRateLimit({
    scope: options.scope,
    headers: await headers(),
    subjectId: options.subjectId,
    ipLimit: options.ipLimit,
    subjectLimit: options.subjectLimit,
  });
  if (!result.ok) {
    return apiError("RATE_LIMITED", result.message);
  }
  return null;
}
