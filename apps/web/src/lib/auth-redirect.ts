const DEFAULT_AUTH_REDIRECT = "/account";

export function normalizeAuthRedirect(
  value: FormDataEntryValue | string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function buildVerificationCallbackURL(redirectTo?: string | null) {
  const next = normalizeAuthRedirect(redirectTo);
  const params = new URLSearchParams();

  if (next !== DEFAULT_AUTH_REDIRECT) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `/verify-email/status?${query}` : "/verify-email/status";
}

export function buildAuthRedirectQuery(redirectTo?: string | null) {
  const next = normalizeAuthRedirect(redirectTo);

  if (next === DEFAULT_AUTH_REDIRECT) {
    return "";
  }

  return `?redirect_url=${encodeURIComponent(next)}`;
}
