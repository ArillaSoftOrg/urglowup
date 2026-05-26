import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

// ─── Auth ─────────────────────────────────────────────────────────────────────

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/business(.*)",
  "/admin(.*)",
]);

// ─── Locale ───────────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES = ["tr", "en", "de", "ru", "es"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "tr";
const INTL_LOCALES = ["en", "de", "ru", "es"] as const;
const COOKIE_NAME = "NEXT_LOCALE";

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

// Paths that should not receive locale routing (protected or non-public)
const LOCALE_BYPASS_PREFIXES = [
  "/api/",
  "/api",
  "/admin",
  "/business",
  "/account",
  "/login",
  "/register",
];

function needsLocaleRouting(pathname: string): boolean {
  return !LOCALE_BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

export const proxy = clerkMiddleware(async (auth, request) => {
  // 1. Protect authenticated routes
  if (isProtectedRoute(request)) {
    await auth.protect();
    return; // Let Clerk handle the response; no locale routing needed here
  }

  const { pathname } = request.nextUrl;

  // 2. Skip locale routing for API / dashboard paths
  if (!needsLocaleRouting(pathname)) {
    return;
  }

  const reqHeaders = new Headers(request.headers);

  // 3. Already has explicit /en /de /ru /es prefix — inject locale header, pass through
  for (const locale of INTL_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      reqHeaders.set("x-locale", locale);
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
  }

  // 4. No locale prefix — detect preferred locale from cookie / Accept-Language
  const locale = getLocaleFromRequest(request);

  if (INTL_LOCALES.includes(locale as (typeof INTL_LOCALES)[number])) {
    // Redirect EN / DE users to their locale-prefixed URL
    const redirectUrl = new URL(
      `/${locale}${pathname === "/" ? "" : pathname}`,
      request.url,
    );
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Turkish (default) — serve at root, inject locale header for root layout
  reqHeaders.set("x-locale", "tr");
  return NextResponse.next({ request: { headers: reqHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
