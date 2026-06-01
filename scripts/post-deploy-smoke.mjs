const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000);

const PUBLIC_HTML_PAGES = [
  { path: "/", label: "Home page" },
  { path: "/explore", label: "Explore page" },
  { path: "/for-business", label: "For-business page" },
  { path: "/styles", label: "Styles page" },
  { path: "/map", label: "Map page" },
  { path: "/privacy-policy", label: "Privacy policy" },
  { path: "/cookie-policy", label: "Cookie policy" },
  { path: "/kvkk", label: "KVKK page" },
  { path: "/kullanim-kosullari", label: "Terms page" },
  { path: "/kvkk-basvuru", label: "KVKK application page" },
  { path: "/puanlama-sistemi", label: "Rating system page" },
];

const AUTH_NOINDEX_PAGES = [
  { path: "/login", label: "Login page" },
  { path: "/register", label: "Register page" },
  { path: "/forgot-password", label: "Forgot-password page" },
  { path: "/verify-email", label: "Verify-email page" },
];

const PROTECTED_ROUTES = [
  { path: "/account", label: "Customer account" },
  { path: "/business/dashboard", label: "Business dashboard" },
  { path: "/admin", label: "Admin dashboard" },
];

const ROBOTS_DISALLOWS = [
  "/admin/",
  "/business/",
  "/account/",
  "/api/",
  "/login/",
  "/register/",
  "/forgot-password/",
  "/reset-password/",
  "/verify-email/",
];

const SITEMAP_PUBLIC_PATHS = [
  "",
  "/explore",
  "/for-business",
  "/styles",
  "/map",
  "/privacy-policy",
  "/cookie-policy",
  "/kvkk",
  "/kullanim-kosullari",
  "/kvkk-basvuru",
  "/puanlama-sistemi",
];

function resolveBaseUrl() {
  const fromArg = process.argv[2];
  const fromEnv = process.env.SMOKE_BASE_URL;
  const raw = fromArg ?? fromEnv;

  if (!raw) {
    throw new Error(
      "Provide a base URL as the first argument or via SMOKE_BASE_URL, for example: npm run smoke:deploy -- https://urglowup.vercel.app",
    );
  }

  const url = new URL(raw);
  return url.origin;
}

async function fetchCheck(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${baseUrl}${path}`, {
      redirect: options.redirect ?? "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "UrGlowUpSmokeCheck/2.0",
        accept: options.accept ?? "*/*",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(baseUrl, path, options = {}) {
  const response = await fetchCheck(baseUrl, path, options);
  const text = await response.text().catch(() => "");
  return { response, text };
}

function logResult(ok, label, detail) {
  const status = ok ? "[OK]" : "[FAIL]";
  console.log(`${status} ${label}${detail ? ` - ${detail}` : ""}`);
}

function pushFailure(failures, label, message) {
  failures.push(`${label}: ${message}`);
}

function getTitle(html) {
  return html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ?? "";
}

function getMetaDescription(html) {
  const byNameFirst = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  if (byNameFirst?.[1]) return byNameFirst[1].trim();

  const byContentFirst = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
  );
  return byContentFirst?.[1]?.trim() ?? "";
}

function hasRobotsNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
    html,
  );
}

function hasCanonical(html, baseUrl, path) {
  const normalizedPath = path === "/" ? "" : path;
  const expected = `${baseUrl}${normalizedPath}`;
  const expectedWithSlash = expected.endsWith("/") ? expected : `${expected}/`;
  return (
    html.includes(`rel="canonical"`) &&
    (html.includes(`href="${expected}"`) || html.includes(`href="${expectedWithSlash}"`))
  );
}

async function checkHealth(baseUrl, failures) {
  const response = await fetchCheck(baseUrl, "/api/health", {
    accept: "application/json",
  });
  let healthJson = null;

  try {
    healthJson = await response.json();
  } catch {
    healthJson = null;
  }

  const ok = response.status === 200 && healthJson?.status === "ok";
  logResult(
    ok,
    "GET /api/health",
    `status=${response.status}${healthJson?.status ? ` body.status=${healthJson.status}` : ""}`,
  );
  if (!ok) {
    pushFailure(failures, "GET /api/health", "Health endpoint is not returning status=ok.");
  }
}

async function checkPublicHtml(baseUrl, failures) {
  for (const page of PUBLIC_HTML_PAGES) {
    const { response, text } = await fetchText(baseUrl, page.path, {
      accept: "text/html",
    });
    const title = getTitle(text);
    const description = getMetaDescription(text);
    const ok =
      response.status === 200 &&
      title.length > 2 &&
      description.length >= 40 &&
      !hasRobotsNoindex(text) &&
      hasCanonical(text, baseUrl, page.path);

    logResult(
      ok,
      page.label,
      `status=${response.status} title=${title ? "yes" : "no"} description=${description.length} canonical=${hasCanonical(text, baseUrl, page.path) ? "yes" : "no"}`,
    );

    if (response.status !== 200) {
      pushFailure(failures, page.label, `${page.path} returned ${response.status}.`);
    }
    if (!title) {
      pushFailure(failures, page.label, "Missing <title>.");
    }
    if (description.length < 40) {
      pushFailure(failures, page.label, "Missing or too-short meta description.");
    }
    if (hasRobotsNoindex(text)) {
      pushFailure(failures, page.label, "Public page is marked noindex.");
    }
    if (!hasCanonical(text, baseUrl, page.path)) {
      pushFailure(failures, page.label, "Missing expected canonical URL.");
    }
  }
}

async function checkAuthNoindex(baseUrl, failures) {
  for (const page of AUTH_NOINDEX_PAGES) {
    const { response, text } = await fetchText(baseUrl, page.path, {
      accept: "text/html",
    });
    const ok = response.status === 200 && hasRobotsNoindex(text);

    logResult(
      ok,
      `${page.label} noindex`,
      `status=${response.status} noindex=${hasRobotsNoindex(text) ? "yes" : "no"}`,
    );

    if (response.status !== 200) {
      pushFailure(failures, page.label, `${page.path} returned ${response.status}.`);
    }
    if (!hasRobotsNoindex(text)) {
      pushFailure(failures, page.label, "Auth page is not marked noindex.");
    }
  }
}

async function checkProtectedRedirects(baseUrl, failures) {
  for (const route of PROTECTED_ROUTES) {
    const response = await fetchCheck(baseUrl, route.path, {
      redirect: "manual",
      accept: "text/html",
    });
    const location = response.headers.get("location");
    const locationPath = location ? new URL(location, baseUrl).pathname : "";
    const redirectStatus = [301, 302, 303, 307, 308].includes(response.status);
    const ok = redirectStatus && locationPath.startsWith("/login");

    logResult(
      ok,
      `${route.label} anonymous redirect`,
      `status=${response.status} location=${locationPath || "none"}`,
    );

    if (!ok) {
      pushFailure(
        failures,
        route.label,
        `${route.path} should redirect anonymous users to /login.`,
      );
    }
  }
}

async function checkRobots(baseUrl, failures) {
  const { response, text } = await fetchText(baseUrl, "/robots.txt", {
    accept: "text/plain",
  });

  const missingDisallows = ROBOTS_DISALLOWS.filter(
    (path) => !text.includes(`Disallow: ${path}`),
  );
  const hasSitemap = text.includes(`Sitemap: ${baseUrl}/sitemap.xml`);
  const ok = response.status === 200 && missingDisallows.length === 0 && hasSitemap;

  logResult(
    ok,
    "robots.txt",
    `status=${response.status} disallows=${ROBOTS_DISALLOWS.length - missingDisallows.length}/${ROBOTS_DISALLOWS.length} sitemap=${hasSitemap ? "yes" : "no"}`,
  );

  if (response.status !== 200) {
    pushFailure(failures, "robots.txt", `Returned ${response.status}.`);
  }
  for (const path of missingDisallows) {
    pushFailure(failures, "robots.txt", `Missing Disallow: ${path}`);
  }
  if (!hasSitemap) {
    pushFailure(failures, "robots.txt", "Missing canonical sitemap URL.");
  }
}

async function checkSitemap(baseUrl, failures) {
  const { response, text } = await fetchText(baseUrl, "/sitemap.xml", {
    accept: "application/xml",
  });

  const missingPaths = SITEMAP_PUBLIC_PATHS.filter((path) => {
    const url = `${baseUrl}${path}`;
    const withSlash = url.endsWith("/") ? url : `${url}/`;
    return !text.includes(`<loc>${url}</loc>`) && !text.includes(`<loc>${withSlash}</loc>`);
  });
  const privateLeaks = ["/admin", "/account", "/business/dashboard", "/login"].filter((path) =>
    text.includes(`<loc>${baseUrl}${path}`),
  );
  const ok = response.status === 200 && missingPaths.length === 0 && privateLeaks.length === 0;

  logResult(
    ok,
    "sitemap.xml",
    `status=${response.status} public=${SITEMAP_PUBLIC_PATHS.length - missingPaths.length}/${SITEMAP_PUBLIC_PATHS.length} privateLeaks=${privateLeaks.length}`,
  );

  if (response.status !== 200) {
    pushFailure(failures, "sitemap.xml", `Returned ${response.status}.`);
  }
  for (const path of missingPaths) {
    pushFailure(failures, "sitemap.xml", `Missing public URL: ${path || "/"}`);
  }
  for (const path of privateLeaks) {
    pushFailure(failures, "sitemap.xml", `Private/auth URL leaked: ${path}`);
  }
}

async function main() {
  const baseUrl = resolveBaseUrl();

  console.log("Post-deploy smoke check");
  console.log("=======================");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Timeout: ${REQUEST_TIMEOUT_MS}ms`);

  const failures = [];

  await checkHealth(baseUrl, failures);
  await checkPublicHtml(baseUrl, failures);
  await checkAuthNoindex(baseUrl, failures);
  await checkProtectedRedirects(baseUrl, failures);
  await checkRobots(baseUrl, failures);
  await checkSitemap(baseUrl, failures);

  if (failures.length > 0) {
    console.log("");
    console.log("Failures:");
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("Smoke check passed.");
}

main().catch((error) => {
  console.error("[FAIL] Smoke check crashed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
