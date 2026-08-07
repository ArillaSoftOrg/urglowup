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

test("email reset callback link lands on reset flow", async ({ page }) => {
  await page.goto(
    `/reset-password/email-callback-${Date.now()}?callbackURL=%2Freset-password`,
  );

  await expect(page).toHaveURL(/\/reset-password\?token=email-callback-/);
  await expect(page.getByLabel("Yeni şifre", { exact: true })).toBeVisible();
});

test("admin email reset callback link lands on admin reset flow", async ({
  page,
}) => {
  await page.goto(
    `/reset-password/admin-email-callback-${Date.now()}?callbackURL=%2Fadmin%2Freset-password`,
  );

  await expect(page).toHaveURL(
    /\/admin\/reset-password\?token=admin-email-callback-/,
  );
  await expect(page.getByLabel("Yeni şifre", { exact: true })).toBeVisible();
});

test("protected account route redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/account");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("E-posta")).toBeVisible();
});

test("protected admin appointments route redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/admin/appointments");

  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("E-posta")).toBeVisible();
});

test("admin auth routes are public but admin MFA challenge is protected", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel("E-posta")).toBeVisible();

  await page.goto("/admin/forgot-password");
  await expect(page.getByLabel("E-posta")).toBeVisible();

  await page.goto("/admin/reset-password?error=INVALID_TOKEN");
  await expect(page.locator("body")).toContainText(
    /Sifre sifirlama baglantisi gecersiz|Şifre sıfırlama bağlantısı geçersiz/,
  );

  await page.goto("/admin/mfa/challenge");
  await expect(page).toHaveURL(/\/admin\/login/);
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

test("forgot-password uses generic success message for unknown emails", async ({
  page,
}) => {
  const email = `unknown-reset-user-${Date.now()}@example.com`;

  await page.goto("/forgot-password");

  await page.getByLabel("E-posta").fill(email);
  await page.waitForTimeout(1600);
  await page
    .getByRole("button", { name: "Sıfırlama bağlantısı gönder" })
    .click();

  await expect(
    page.getByText(
      "Eğer bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi.",
    ),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Hesap bulunamadı");
});

test("forgot-password accepts uppercase registered email input when configured", async ({
  page,
}) => {
  const resetEmail = process.env.E2E_RESET_EMAIL;
  test.skip(
    !resetEmail,
    "Set E2E_RESET_EMAIL to a seeded email account to verify normalization",
  );

  await page.goto("/forgot-password");

  await page.getByLabel("E-posta").fill(resetEmail!.toUpperCase());
  await page.waitForTimeout(1600);
  await page
    .getByRole("button", { name: "Sıfırlama bağlantısı gönder" })
    .click();

  await expect(
    page.getByText(
      "Eğer bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi.",
    ),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Hesap bulunamadı");
});

test("login page shows password-reset success message when ?reset=success", async ({
  page,
}) => {
  await page.goto("/login?reset=success");
  await expect(page.getByText("Şifreniz güncellendi")).toBeVisible();
});

test("reset-password with fake token renders form then rejects securely", async ({
  page,
}) => {
  await page.goto(`/reset-password?token=fake-customer-${Date.now()}`);

  await expect(page.getByLabel("Yeni şifre", { exact: true })).toBeVisible();
  await page.getByLabel("Yeni şifre", { exact: true }).fill("Validpass1!");
  await page.getByLabel("Yeni şifre tekrar").fill("Validpass1!");
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Şifreyi güncelle" }).click();

  await expect(
    page.getByText(
      "Bağlantı artık geçerli değil. Güvenliğiniz için yeni bir bağlantı isteyin.",
    ),
  ).toBeVisible();
});

test("admin reset-password keeps admin context with fake token", async ({
  page,
}) => {
  await page.goto(`/admin/reset-password?token=fake-admin-${Date.now()}&next=/admin`);

  await expect(page.getByLabel("Yeni şifre", { exact: true })).toBeVisible();
  await page.getByLabel("Yeni şifre", { exact: true }).fill("Validpass1!");
  await page.getByLabel("Yeni şifre tekrar").fill("Validpass1!");
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Şifreyi güncelle" }).click();

  await expect(
    page.getByText(
      "Bağlantı artık geçerli değil. Güvenliğiniz için yeni bir bağlantı isteyin.",
    ),
  ).toBeVisible();
  await expect(page.locator('a[href="/admin/login"]')).toHaveText(
    /Giris yap|Giriş yap/,
  );
  await expect(page.locator('a[href="/admin/login"]')).toHaveAttribute(
    "href",
    "/admin/login",
  );
});

test("login page shows an error for invalid credentials", async ({ page }) => {
  const email = `unknown-login-${Date.now()}@example.com`;

  await page.goto("/login");

  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel(/^Şifre$/).fill("Definitely-wrong-1!");
  await page.getByRole("button", { name: "Giriş yap" }).click();

  await expect(
    page.getByText("E-posta adresi veya şifre hatalı."),
  ).toBeVisible();
});

test("login rate limit returns a safe generic message", async ({ page }) => {
  const email = `rate-limit-${Date.now()}@example.com`;

  await page.goto("/login");

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel(/^Şifre$/).fill(`Definitely-wrong-${attempt}!`);
    await expect(page.getByLabel("E-posta")).toHaveValue(email);
    await expect(page.getByLabel(/^Şifre$/)).toHaveValue(
      `Definitely-wrong-${attempt}!`,
    );
    await page.getByRole("button", { name: "Giriş yap" }).click();

    await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled({
      timeout: 10_000,
    });
  }

  await expect(
    page.getByText(
      /çok fazla istek|çok fazla deneme|kısa süre içinde çok fazla/i,
    ),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("hesap bulunamadı");
});

test("verify-email footer link navigates back to login", async ({ page }) => {
  await page.goto("/verify-email");
  await expect(
    page.getByRole("link", { name: "Giriş yap" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("login page shows Google sign-in button when configured", async ({
  page,
}) => {
  test.skip(
    !process.env.GOOGLE_AUTH_CLIENT_ID,
    "Google Sign-In not configured, set GOOGLE_AUTH_CLIENT_ID to run this test",
  );
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /Google ile devam et/ }),
  ).toBeVisible();
});

test("register page shows Google sign-in button when configured", async ({
  page,
}) => {
  test.skip(
    !process.env.GOOGLE_AUTH_CLIENT_ID,
    "Google Sign-In not configured, set GOOGLE_AUTH_CLIENT_ID to run this test",
  );
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: /Google ile devam et/ }),
  ).toBeVisible();
});
