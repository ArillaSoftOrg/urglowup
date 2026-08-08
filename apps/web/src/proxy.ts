import { getSessionCookie } from "better-auth/cookies";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  INTL_LOCALES,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n-config";
import { isAdminIpAllowed } from "@/lib/admin-ip-allowlist";
import { env } from "@/lib/env";

const PROTECTED_PREFIXES = ["/account", "/business", "/admin"];
const PUBLIC_BUSINESS_PREFIXES = ["/business/register", "/business/invite"];
const PUBLIC_ADMIN_AUTH_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];
const COOKIE_NAME = "NEXT_LOCALE";
const AUTH_COOKIE_PREFIX = "urglowup";

function getLocaleFromRequest(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = request.headers.get("Accept-Language") ?? "";
  const headers = { "accept-language": acceptLanguage || "tr" };

  try {
    const languages = new Negotiator({ headers }).languages();
    return match(languages, [...SUPPORTED_LOCALES], DEFAULT_LOCALE) as Locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

const LOCALE_BYPASS_PREFIXES = [
  "/api/",
  "/api",
  "/admin",
  "/business",
  "/account",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/help",
];

function needsLocaleRouting(pathname: string): boolean {
  return !LOCALE_BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

// CORS for the API surface a mobile client calls. Browsers enforce CORS;
// React Native's fetch doesn't, so this mainly matters for Expo web/dev
// tooling and any browser-based API testing — but it's also the only gate
// that would stop an arbitrary web page from making credentialed requests
// against these routes, so it stays strict (reflected-origin, allowlist
// only, no wildcard). Reuses BETTER_AUTH_TRUSTED_ORIGINS — once Phase 7
// picks the Expo app's custom scheme / dev origin, adding it there covers
// both better-auth's own origin check and this.
const CORS_PREFIXES = ["/api/v1/", "/api/auth/"];

function isCorsScopedPath(pathname: string): boolean {
  return CORS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getTrustedOrigins(): string[] {
  return (
    env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

function withCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (!origin || !getTrustedOrigins().includes(origin)) {
    return response;
  }
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.append("Vary", "Origin");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCorsScopedPath(pathname)) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      const preflight = withCorsHeaders(new NextResponse(null, { status: 204 }), origin);
      preflight.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      preflight.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Idempotency-Key",
      );
      preflight.headers.set("Access-Control-Max-Age", "86400");
      return preflight;
    }

    return withCorsHeaders(NextResponse.next(), origin);
  }

  // Optional network gate: when ADMIN_IP_ALLOWLIST is configured, restrict the
  // entire /admin surface to allowlisted IPs. Disabled (no-op) when unset.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdminIpAllowed(request.headers)) {
      console.warn("[admin.ip_denied]", {
        path: pathname,
        ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
      });
      return new NextResponse(null, { status: 404 });
    }
  }

  const isPublicBusinessPath = PUBLIC_BUSINESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  const isPublicAdminAuthPath = PUBLIC_ADMIN_AUTH_PATHS.some(
    (path) => pathname === path,
  );

  if (
    !isPublicBusinessPath &&
    !isPublicAdminAuthPath &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    )
  ) {
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: AUTH_COOKIE_PREFIX,
    });
    if (!sessionCookie) {
      const authUrl = new URL(
        pathname === "/business/onboarding"
          ? "/register"
          : pathname === "/admin" || pathname.startsWith("/admin/")
            ? "/admin/login"
            : "/login",
        request.url,
      );
      const redirectTarget = `${pathname}${request.nextUrl.search}`;
      authUrl.searchParams.set("redirect_url", redirectTarget);
      return NextResponse.redirect(authUrl);
    }
    return NextResponse.next();
  }

  if (!needsLocaleRouting(pathname)) {
    return;
  }

  const reqHeaders = new Headers(request.headers);

  for (const locale of INTL_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      reqHeaders.set("x-locale", locale);
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
  }

  const locale = getLocaleFromRequest(request);

  if (INTL_LOCALES.includes(locale as (typeof INTL_LOCALES)[number])) {
    const redirectUrl = new URL(
      `/${locale}${pathname === "/" ? "" : pathname}`,
      request.url,
    );
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  reqHeaders.set("x-locale", "tr");
  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
