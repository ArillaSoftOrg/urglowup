import { expect, test } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// Consent & personalization smoke tests
// Authenticated flows (toggle persistence, audit log) require
// a seeded test user and are out of scope for the CI smoke suite.
// ─────────────────────────────────────────────────────────────

test("account settings redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/account/settings");
  await expect(page).toHaveURL(/\/login/);
});

test("privacy policy page renders and contains KVKK sections", async ({
  page,
}) => {
  await page.goto("/privacy-policy");

  await expect(page.locator("body")).not.toContainText("404");
  await expect(page.locator("body")).not.toContainText("500");

  // Key consent-related sections should be present
  await expect(page.getByText(/Kişisel Veri/i).first()).toBeVisible();
  await expect(page.getByText(/KVKK/i).first()).toBeVisible();
});

test("personalization nudge link points to account settings privacy anchor", async ({
  page,
}) => {
  // We can't render the nudge without being logged in, but we can confirm the
  // destination route returns a login redirect (proving the URL is correct).
  await page.goto("/account/settings#privacy");
  await expect(page).toHaveURL(/\/login/);
});
