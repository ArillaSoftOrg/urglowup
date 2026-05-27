export const COOKIE_CONSENT_NAME = "ugl_cookie_consent";

export type CookieConsentValue = "necessary" | "all";

export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export function setClientCookie(
  name: string,
  value: string,
  maxAge: number,
) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
