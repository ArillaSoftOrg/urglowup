import { expect, test } from "@playwright/test";

test("admin can resume the photo setup for a draft Google business", async ({
  page,
}) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const businessId = process.env.E2E_ADMIN_DRAFT_GOOGLE_BUSINESS_ID;

  test.skip(
    !email || !password || !businessId,
    "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD and E2E_ADMIN_DRAFT_GOOGLE_BUSINESS_ID for this authenticated scenario.",
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
    page.getByRole("heading", { name: "Fotoğrafları tamamlayın" }),
  ).toBeVisible();
  await expect(page.getByText("Yayınlanmamış taslak")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Google Maps referansları" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kalıcı profil kapakları" }),
  ).toBeVisible();

  const rightsConfirmation = page.getByRole("checkbox", {
    name: /Bu dosyaları kullanma hakkım var/,
  });
  const uploadButton = page.getByRole("button", { name: /Dosya seç/ });
  const finalizeButton = page.getByRole("button", {
    name: "İşletmeyi yayınla",
  });

  await expect(rightsConfirmation).not.toBeChecked();
  await expect(uploadButton).toBeDisabled();
  await expect(finalizeButton).toBeDisabled();

  await rightsConfirmation.check();
  await expect(uploadButton).toBeEnabled();
  await expect(finalizeButton).toBeDisabled();

  await expect(page.getByLabel("Google fotoğrafları yükleniyor")).toBeHidden();
  expect(await page.getByRole("button", { pressed: false }).count()).toBeLessThanOrEqual(6);
});
