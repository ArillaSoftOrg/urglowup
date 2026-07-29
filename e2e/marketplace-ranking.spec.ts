import { expect, test } from "@playwright/test";

test("explore exposes stable marketplace sort options", async ({ page }) => {
  await page.goto("/explore");

  const sort = page.getByLabel(/Sıralama|Sort/);
  await expect(sort).toBeVisible();
  await expect(sort).toHaveValue("recommended");

  await sort.selectOption("rating");
  await expect(page).toHaveURL(/sort=rating/);
  await expect(sort).toHaveValue("rating");

  await sort.selectOption("reviewCount");
  await expect(page).toHaveURL(/sort=reviewCount/);

  await sort.selectOption("newest");
  await expect(page).toHaveURL(/sort=newest/);
});

test("zero-review cards never receive the generic Yeni badge", async ({
  page,
}) => {
  await page.goto("/explore");

  const zeroReviewCopy = page
    .getByText(/Henüz UrGlowUp yorumu yok|No UrGlowUp reviews yet/)
    .first();
  if ((await zeroReviewCopy.count()) === 0) {
    test.skip(true, "Seed data has no zero-review marketplace business.");
  }

  const card = zeroReviewCopy.locator("xpath=ancestor::a[1]");
  await expect(card.getByText("Yeni", { exact: true })).toHaveCount(0);
});

test("admin business detail exposes editorial recommendation controls", async ({
  page,
}) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const businessId = process.env.E2E_ADMIN_BUSINESS_ID;

  test.skip(
    !email || !password || !businessId,
    "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD and E2E_ADMIN_BUSINESS_ID for the authenticated admin scenario.",
  );

  await page.goto("/admin/login");
  await page.getByLabel("E-posta").fill(email!);
  await page.getByLabel("Şifre").fill(password!);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.waitForURL(/\/admin(?:\/mfa\/challenge)?(?:$|[/?])/);

  test.skip(
    /\/admin\/mfa\/challenge/.test(page.url()),
    "The configured admin account requires an interactive MFA code.",
  );

  await page.goto(`/admin/businesses/${businessId}`);
  await expect(
    page.getByRole("heading", { name: "Lansman önerisi", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Gösterim sırası")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Lansman önerisine ekle|Öneriden çıkar/,
    }),
  ).toBeVisible();
});
