function resolveBaseUrl() {
  const fromArg = process.argv[2];
  const fromEnv = process.env.SMOKE_BASE_URL;
  const raw = fromArg ?? fromEnv;

  if (!raw) {
    throw new Error(
      "Provide a base URL as the first argument or via SMOKE_BASE_URL, for example: npm run smoke:deploy -- https://urglowup.com",
    );
  }

  const url = new URL(raw);
  return url.origin;
}

async function fetchCheck(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: options.redirect ?? "follow",
    headers: {
      "user-agent": "UrGlowUpSmokeCheck/1.0",
    },
  });

  return response;
}

function logResult(ok, label, detail) {
  const status = ok ? "[OK]" : "[FAIL]";
  console.log(`${status} ${label}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const baseUrl = resolveBaseUrl();

  console.log("Post-deploy smoke check");
  console.log("=======================");
  console.log(`Base URL: ${baseUrl}`);

  const failures = [];

  const healthResponse = await fetchCheck(baseUrl, "/api/health");
  let healthJson = null;

  try {
    healthJson = await healthResponse.json();
  } catch {
    healthJson = null;
  }

  const healthOk =
    healthResponse.status === 200 && healthJson?.status === "ok";
  logResult(
    healthOk,
    "GET /api/health",
    `status=${healthResponse.status}${healthJson?.status ? ` body.status=${healthJson.status}` : ""}`,
  );
  if (!healthOk) {
    failures.push("Health endpoint is not returning status=ok.");
  }

  const publicPages = [
    { path: "/", label: "Home page" },
    { path: "/login", label: "Login page" },
    { path: "/register", label: "Register page" },
    { path: "/forgot-password", label: "Forgot-password page" },
    { path: "/verify-email", label: "Verify-email page" },
  ];

  for (const page of publicPages) {
    const response = await fetchCheck(baseUrl, page.path);
    const ok = response.status === 200;
    logResult(ok, page.label, `status=${response.status}`);

    if (!ok) {
      failures.push(`${page.path} returned ${response.status}.`);
    }
  }

  const protectedResponse = await fetchCheck(baseUrl, "/account");
  const protectedRedirectedToLogin =
    protectedResponse.ok &&
    new URL(protectedResponse.url).pathname.startsWith("/login");

  logResult(
    protectedRedirectedToLogin,
    "Protected route redirect",
    `final=${new URL(protectedResponse.url).pathname}`,
  );

  if (!protectedRedirectedToLogin) {
    failures.push("/account did not end up on /login for an anonymous request.");
  }

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
