// Canonical client-IP resolver, shared by rate limiting and the admin IP gate.
// It is dependency-free so it can run in the proxy.

export type HeaderReader = Pick<Headers, "get">;

/**
 * Prefer the platform-provided real peer address over x-forwarded-for.
 * x-forwarded-for remains a best-effort fallback for non-Vercel environments.
 */
export function resolveClientIp(headers: HeaderReader): string | null {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return null;
}
