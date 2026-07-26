export const RECENT_BUSINESSES_STORAGE_KEY =
  "urglowup:recent-businesses";
export const RECENT_BUSINESSES_COOKIE_KEY = "urg_recent_businesses";
export const MAX_RECENT_BUSINESSES = 12;

export function parseRecentBusinessIds(value?: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .filter(
      (id) =>
        id.length > 0 &&
        id.length <= 64 &&
        /^[a-zA-Z0-9_-]+$/.test(id),
    )
    .slice(0, MAX_RECENT_BUSINESSES);
}

export function readRecentBusinessIds(): string[] {
  try {
    const stored = window.localStorage.getItem(RECENT_BUSINESSES_STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberBusinessView(businessId: string) {
  const nextIds = [
    businessId,
    ...readRecentBusinessIds().filter((id) => id !== businessId),
  ].slice(0, MAX_RECENT_BUSINESSES);

  try {
    window.localStorage.setItem(
      RECENT_BUSINESSES_STORAGE_KEY,
      JSON.stringify(nextIds),
    );
  } catch {
    // Browsing history is an enhancement; blocked storage should not affect navigation.
  }

  void fetch("/api/recent-businesses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessId }),
    keepalive: true,
  }).catch(() => {
    // The local history remains available when the server sync is unavailable.
  });
}
