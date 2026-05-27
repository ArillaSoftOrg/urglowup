import { expect, test } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");

  await expect(page).toHaveTitle(/Giriş Yap \| UrGlowUp/);
  await expect(page.getByText("UrGlowUp", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel(/^Şifre$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeVisible();
});

test("register page renders", async ({ page }) => {
  await page.goto("/register");

  await expect(page).toHaveTitle(/Hesap Oluştur \| UrGlowUp/);
  await expect(page.getByLabel("Ad soyad")).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel(/^Şifre$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hesap oluştur" }),
  ).toBeVisible();
});

test("forgot-password page renders", async ({ page }) => {
  await page.goto("/forgot-password");

  await expect(page.getByText("UrGlowUp", { exact: true })).toBeVisible();
  await expect(page.getByText("Şifreni sıfırla", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }),
  ).toBeVisible();
});

test("verify-email page renders", async ({ page }) => {
  await page.goto("/verify-email");

  await expect(
    page.getByText("E-posta adresini doğrula", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Doğrulama bağlantısı gönder" }),
  ).toBeVisible();
});

test("invalid reset token shows hardened state", async ({ page }) => {
  await page.goto("/reset-password?error=INVALID_TOKEN");

  await expect(page.locator("body")).toContainText(
    "Şifre sıfırlama bağlantısı geçersiz",
  );
  await expect(
    page.getByRole("link", { name: "Yeni bağlantı iste" }),
  ).toBeVisible();
});

test("protected route redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/account");

  // /account does redirect("/login") — no redirect_url appended for the default route
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("E-posta")).toBeVisible();
});

test("login 'Şifremi unuttum' link navigates to forgot-password", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Şifremi unuttum" }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(
    page.getByText("Şifreni sıfırla", { exact: true }),
  ).toBeVisible();
});

test("forgot-password footer link navigates back to login", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByRole("link", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("E-posta")).toBeVisible();
});

test("login page shows password-reset success message when ?reset=success", async ({
  page,
}) => {
  await page.goto("/login?reset=success");
  await expect(page.getByText("Şifreniz güncellendi")).toBeVisible();
});

test("verify-email footer link navigates back to login", async ({ page }) => {
  await page.goto("/verify-email");
  await expect(
    page.getByRole("link", { name: "Giriş ekranına dön" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Giriş ekranına dön" }).click();
  await expect(page).toHaveURL(/\/login/);
});
