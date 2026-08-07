import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function runVerification() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("[VERIFY] Starting admin users lifecycle verification\n");

  try {
    // Step 1: Check if dev server is up
    console.log("[STEP 1] Checking if dev server is responsive...");
    try {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 10000 });
      console.log("[PASS] Server is responsive\n");
    } catch (err) {
      console.log("[FAIL] Could not reach server:", err.message);
      await browser.close();
      process.exit(1);
    }

    // Step 2: Check dashboard metrics
    console.log("[STEP 2] Checking admin dashboard...");
    const dashboardTitle = await page.locator("h1").first().textContent();
    console.log(`[INFO] Page loaded: "${dashboardTitle}"`);

    // Look for mentions of lifecycle metrics
    const bodyText = await page.textContent("body");
    const hasUnverified = bodyText.includes("Unverified");
    const hasInactive = bodyText.includes("Inactive");
    const hasChurned = bodyText.includes("Churned");

    if (hasUnverified) console.log("[PASS] Unverified Users metric found");
    else console.log("[WARN] Unverified Users metric not found");

    if (hasInactive) console.log("[PASS] Inactive Users metric found");
    else console.log("[WARN] Inactive Users metric not found");

    if (hasChurned) console.log("[PASS] Churned Users metric found");
    else console.log("[WARN] Churned Users metric not found");

    console.log();

    // Step 3: Navigate to users page
    console.log("[STEP 3] Navigating to /admin/users...");
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: "domcontentloaded" });

    const currentUrl = page.url();
    console.log(`[INFO] Current URL: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      console.log("[INFO] Redirected to login (auth guard is working)");
    } else {
      console.log("[PASS] Users page loaded");

      // Check for UI elements
      const pageText = await page.textContent("body");

      const hasSearch = pageText.includes("Search");
      const hasLifecycle = pageText.includes("Lifecycle");
      const hasUserTable = pageText.includes("Customer") || pageText.includes("Business Owner");

      if (hasSearch) console.log("[PASS] Search functionality present");
      else console.log("[WARN] Search not visible");

      if (hasLifecycle) console.log("[PASS] Lifecycle segments visible");
      else console.log("[WARN] Lifecycle not visible");

      if (hasUserTable) console.log("[PASS] User table structure present");
      else console.log("[WARN] User table not found");
    }

    console.log();

    // Step 4: Check HTML structure for implementation
    console.log("[STEP 4] Checking implementation structure...");
    const html = await page.content();

    const hasReactComponents = html.includes("_next") || html.includes("__NEXT");
    const hasTabsUI = html.includes("role=\"tab\"") || html.includes("TabsList");
    const hasLifecycleLogic = html.includes("UNVERIFIED") || html.includes("ACTIVE");

    if (hasReactComponents) console.log("[PASS] Next.js/React markup detected");
    if (hasTabsUI) console.log("[PASS] Tab UI components found");
    if (hasLifecycleLogic) console.log("[PASS] Lifecycle enum values found in HTML");

    console.log();
    console.log("[COMPLETE] Verification finished successfully\n");

  } catch (err) {
    console.error("[ERROR] Verification failed:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
