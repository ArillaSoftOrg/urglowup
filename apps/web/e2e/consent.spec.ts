/**
 * Cookie/Consent e2e tests (Phase 8 of the consent implementation plan)
 *
 * These tests cover the public-facing consent flow only — no DB-backed
 * authenticated flows (those require a seeded test user and are tested in
 * consent-preferences.spec.ts).
 *
 * Coverage:
 *  1. First visit: banner is visible
 *  2. Reject non-essential: banner dismissed, cookie set to analytics=0,marketing=0
 *  3. Accept all: banner dismissed, cookie set to analytics=1,marketing=1
 *  4. Manage preferences: panel opens with toggle rows
 *  5. Save preferences: custom choice written to cookie; banner dismissed
 *  6. After consent: banner does NOT reappear on a fresh navigation
 *  7. Footer "Çerez Ayarları" re-opens banner even with existing consent cookie
 *  8. Cookie policy page renders the cookie table driven by COOKIE_REGISTRY
 *  9. Privacy policy page renders key sections
 */

import { expect, test, type Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONSENT_COOKIE = "ugl_cookie_consent";

/** Navigate to the home page with NO prior cookies (clean state). */
async function freshVisit(page: Page) {
  await page.context().clearCookies();
  await page.goto("/");
}

/** Read the consent cookie value from the browser context. */
async function getConsentCookieValue(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === CONSENT_COOKIE)?.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner visibility
// ─────────────────────────────────────────────────────────────────────────────

test("first visit — banner is visible", async ({ page }) => {
  await freshVisit(page);

  const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  await expect(banner).toBeVisible();
});

test("first visit — all three action buttons are present", async ({ page }) => {
  await freshVisit(page);

  await expect(
    page.getByRole("button", { name: "Sadece gerekli" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tercihleri yönet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tümünü kabul et" }),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Reject non-essential
// ─────────────────────────────────────────────────────────────────────────────

test("reject non-essential — banner dismissed", async ({ page }) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Sadece gerekli" }).click();

  const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  await expect(banner).not.toBeVisible();
});

test("reject non-essential — consent cookie analytics=0,marketing=0", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Sadece gerekli" }).click();

  const value = await getConsentCookieValue(page);
  expect(value).toBe("v1:analytics=0,marketing=0");
});

// ─────────────────────────────────────────────────────────────────────────────
// Accept all
// ─────────────────────────────────────────────────────────────────────────────

test("accept all — banner dismissed", async ({ page }) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();

  const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  await expect(banner).not.toBeVisible();
});

test("accept all — consent cookie analytics=1,marketing=1", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();

  const value = await getConsentCookieValue(page);
  expect(value).toBe("v1:analytics=1,marketing=1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Manage preferences panel
// ─────────────────────────────────────────────────────────────────────────────

test("manage preferences — panel opens on click", async ({ page }) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  // Panel is identified by its stable id
  await expect(page.locator("#cookie-preferences-panel")).toBeVisible();
});

test("manage preferences — panel has four rows (Necessary, Preference, Analitik, Pazarlama)", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  const panel = page.locator("#cookie-preferences-panel");
  await expect(panel.getByText("Zorunlu")).toBeVisible();
  await expect(panel.getByText("Tercih")).toBeVisible();
  await expect(panel.getByText("Analitik")).toBeVisible();
  await expect(panel.getByText("Pazarlama")).toBeVisible();
});

test("manage preferences — Necessary and Preference rows show 'Her zaman etkin' lock badge", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  const panel = page.locator("#cookie-preferences-panel");
  const badges = panel.getByText("Her zaman etkin");
  // Two locked rows → two badges
  await expect(badges).toHaveCount(2);
});

test("manage preferences — analytics toggle starts as 'Devre dışı' (default OFF)", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  const panel = page.locator("#cookie-preferences-panel");
  // Both analytics and marketing toggles default to OFF — look for 2 Devre dışı buttons
  const disabledButtons = panel.getByRole("button", { name: "Devre dışı" });
  await expect(disabledButtons).toHaveCount(2);
});

test("manage preferences — toggling analytics changes button label to 'Etkin'", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  const panel = page.locator("#cookie-preferences-panel");

  // First "Devre dışı" button corresponds to Analytics
  await panel.getByRole("button", { name: "Devre dışı" }).first().click();

  // After toggle, that button should now read "Etkin"
  await expect(panel.getByRole("button", { name: "Etkin" })).toHaveCount(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// Save preferences
// ─────────────────────────────────────────────────────────────────────────────

test("save preferences — banner dismissed", async ({ page }) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  await page.locator("#cookie-preferences-panel").getByRole("button", { name: "Tercihleri kaydet" }).click();

  const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  await expect(banner).not.toBeVisible();
});

test("save preferences (analytics ON, marketing OFF) — cookie reflects custom choice", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  const panel = page.locator("#cookie-preferences-panel");

  // Toggle analytics ON (first Devre dışı button = analytics row)
  await panel.getByRole("button", { name: "Devre dışı" }).first().click();

  // Save
  await panel.getByRole("button", { name: "Tercihleri kaydet" }).click();

  const value = await getConsentCookieValue(page);
  expect(value).toBe("v1:analytics=1,marketing=0");
});

test("save preferences (both OFF) — cookie is analytics=0,marketing=0", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  await page
    .locator("#cookie-preferences-panel")
    .getByRole("button", { name: "Tercihleri kaydet" })
    .click();

  const value = await getConsentCookieValue(page);
  expect(value).toBe("v1:analytics=0,marketing=0");
});

// ─────────────────────────────────────────────────────────────────────────────
// Banner persistence (should NOT re-appear after consent)
// ─────────────────────────────────────────────────────────────────────────────

test("banner does not appear after accept all on subsequent navigation", async ({
  page,
}) => {
  await freshVisit(page);
  await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();

  // Navigate to another page — banner must NOT re-appear
  await page.goto("/login");
  await expect(
    page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  ).not.toBeVisible();
});

test("banner does not appear after reject on subsequent navigation", async ({
  page,
}) => {
  await freshVisit(page);
  await page.getByRole("button", { name: "Sadece gerekli" }).click();

  await page.goto("/login");
  await expect(
    page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  ).not.toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Footer "Çerez Ayarları" re-open
// ─────────────────────────────────────────────────────────────────────────────

test("footer Çerez Ayarları button re-opens banner after prior consent", async ({
  page,
}) => {
  await freshVisit(page);

  // Accept all → banner goes away
  await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  ).not.toBeVisible();

  // Click footer button → banner + panel re-appear
  await page.getByRole("button", { name: "Çerez Ayarları" }).click();

  const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  await expect(banner).toBeVisible();
  await expect(page.locator("#cookie-preferences-panel")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Cookie Policy page — COOKIE_REGISTRY-driven table
// ─────────────────────────────────────────────────────────────────────────────

test("cookie policy page renders without errors", async ({ page }) => {
  await page.goto("/cookie-policy");

  await expect(page.locator("body")).not.toContainText("404");
  await expect(page.locator("body")).not.toContainText("500");

  await expect(
    page.getByRole("heading", { name: "Çerez Politikası", level: 1 }),
  ).toBeVisible();
});

test("cookie policy table contains all 6 registered cookies", async ({
  page,
}) => {
  await page.goto("/cookie-policy");

  // All six cookies from COOKIE_REGISTRY must appear in the table
  const expectedNames = [
    "urglowup.session_token",
    "ugl_cookie_consent",
    "ugl_theme",
    "NEXT_LOCALE",
    "google_oauth_state",
    "google_oauth_pending",
  ];

  for (const name of expectedNames) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
});

test("cookie policy table has category badge for each row", async ({
  page,
}) => {
  await page.goto("/cookie-policy");

  // "Zorunlu" (necessary) badge should appear at least once
  await expect(page.getByText("Zorunlu").first()).toBeVisible();
  // "Tercih" (preference) badge for ugl_theme / NEXT_LOCALE
  await expect(page.getByText("Tercih").first()).toBeVisible();
});

test("cookie policy page links to Google Cookie Policy", async ({ page }) => {
  await page.goto("/cookie-policy");

  const googleLink = page.getByRole("link", { name: "Google Çerez Politikası" });
  await expect(googleLink).toBeVisible();
  await expect(googleLink).toHaveAttribute(
    "href",
    "https://policies.google.com/technologies/cookies",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Privacy policy page
// ─────────────────────────────────────────────────────────────────────────────

test("privacy policy page renders key KVKK sections", async ({ page }) => {
  await page.goto("/privacy-policy");

  await expect(page.locator("body")).not.toContainText("404");
  await expect(page.locator("body")).not.toContainText("500");

  await expect(page.getByText(/Kişisel Veri/i).first()).toBeVisible();
  await expect(page.getByText(/KVKK/i).first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Manage-preferences panel — close button (toggle off)
// ─────────────────────────────────────────────────────────────────────────────

test("clicking Tercihleri yönet again collapses the panel", async ({ page }) => {
  await freshVisit(page);

  const manageBtn = page.getByRole("button", { name: "Tercihleri yönet" });

  // Open
  await manageBtn.click();
  await expect(page.locator("#cookie-preferences-panel")).toBeVisible();

  // Close
  await manageBtn.click();
  await expect(page.locator("#cookie-preferences-panel")).not.toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Accept all from within panel
// ─────────────────────────────────────────────────────────────────────────────

test("accept all from within panel — cookie analytics=1,marketing=1", async ({
  page,
}) => {
  await freshVisit(page);

  await page.getByRole("button", { name: "Tercihleri yönet" }).click();

  // The panel also exposes an "Accept all" button
  await page
    .locator("#cookie-preferences-panel")
    .getByRole("button", { name: "Tümünü kabul et" })
    .click();

  const value = await getConsentCookieValue(page);
  expect(value).toBe("v1:analytics=1,marketing=1");
});
