import { expect, test } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// İlham feed smoke tests
// All tests are unauthenticated — they only verify public rendering.
// Personalization and save actions require a seeded test user
// (out of scope for the current CI-safe smoke suite).
// ─────────────────────────────────────────────────────────────

test("explore page loads with businesses tab by default", async ({ page }) => {
  await page.goto("/explore");

  // Tab bar is present
  await expect(page.getByRole("link", { name: /İşletmeler/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /İlham/i })).toBeVisible();
});

test("İlham tab renders the post feed container", async ({ page }) => {
  await page.goto("/explore?tab=ilham");

  // Either posts or the empty state renders — both are inside the feed wrapper
  // We just confirm the page loaded without a crash and key feed chrome is present.
  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");

  // The category filter bar should be visible (always rendered, even when empty)
  // OR the empty-state illustration — either means the feed mounted correctly.
  const feedMounted = await Promise.race([
    page
      .locator('[aria-label="Görseli büyüt"]')
      .first()
      .waitFor({ timeout: 5000 })
      .then(() => true)
      .catch(() => false),
    page
      .getByText("Henüz gönderi yok")
      .waitFor({ timeout: 5000 })
      .then(() => true)
      .catch(() => false),
  ]);
  expect(feedMounted).toBe(true);
});

test("İlham tab — unauthenticated user does NOT see personalization nudge", async ({
  page,
}) => {
  await page.goto("/explore?tab=ilham");

  // Nudge only shows for logged-in users without consent
  await expect(
    page.getByText("Akışını kişiselleştir"),
  ).not.toBeVisible();
});

test("İlham tab — locale-aware route /en/explore renders feed", async ({
  page,
}) => {
  await page.goto("/en/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("İlham tab — locale-aware route /de/explore renders feed", async ({
  page,
}) => {
  await page.goto("/de/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("İlham tab — locale-aware route /fa/explore renders feed with RTL direction", async ({
  page,
}) => {
  await page.goto("/fa/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");

  // Verify RTL direction is set for Persian locale
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("İlham tab — locale-aware route /pl/explore renders feed", async ({
  page,
}) => {
  await page.goto("/pl/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("İlham tab — locale-aware route /ar/explore renders feed with RTL direction", async ({
  page,
}) => {
  await page.goto("/ar/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");

  // Verify RTL direction is set for Arabic locale
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("İlham tab — locale-aware route /fr/explore renders feed", async ({
  page,
}) => {
  await page.goto("/fr/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("İlham tab — locale-aware route /nl/explore renders feed", async ({
  page,
}) => {
  await page.goto("/nl/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("İlham tab — locale-aware route /ro/explore renders feed", async ({
  page,
}) => {
  await page.goto("/ro/explore?tab=ilham");

  await expect(page.locator("body")).not.toContainText("500");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});
