import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const SHOTS = path.join(process.cwd(), "test-screenshots");

fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });

const snap = async (page, name) => {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
};

const navLinks = async (page) =>
  page.$$eval("header nav a", (elements) =>
    elements.map((element) => ({
      text: element.textContent.trim(),
      href: element.getAttribute("href"),
    })),
  );

const hasText = async (page, text) =>
  page.getByText(text, { exact: false }).isVisible().catch(() => false);

console.log("\n--- TEST 1: Logged-out homepage ---");
{
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  const links = await navLinks(page);
  console.log("  Navbar links:", JSON.stringify(links));

  const businessCTA = await hasText(page, "Güzellik uzmanı mısınız?");
  const signInBtn = await hasText(page, "Giriş Yap");
  const registerBtn = await hasText(page, "Kayıt Ol");

  console.log("  HomeBusinessCTA visible:", businessCTA, businessCTA ? "OK" : "FAIL");
  console.log("  Sign-in button visible:", signInBtn, signInBtn ? "OK" : "FAIL");
  console.log("  Register button visible:", registerBtn, registerBtn ? "OK" : "FAIL");

  const hasExplore = links.some((link) => link.href === "/explore");
  const hasBusiness = links.some((link) => link.href === "/for-business");
  const noAccount = !links.some((link) => link.href === "/account");
  const noDashboard = !links.some((link) => link.href === "/business/dashboard");

  console.log("  /explore in nav:", hasExplore ? "OK" : "FAIL");
  console.log("  /for-business in nav:", hasBusiness ? "OK" : "FAIL");
  console.log("  /account NOT in nav:", noAccount ? "OK" : "FAIL");
  console.log(
    "  /business/dashboard NOT in nav:",
    noDashboard ? "OK" : "FAIL",
  );

  const file = await snap(page, "1-logged-out-homepage");
  console.log("  Screenshot:", file);
  await page.close();
}

const email = process.env.BUSINESS_TEST_EMAIL;
const password = process.env.BUSINESS_TEST_PASSWORD;

if (!email || !password) {
  console.log(
    "\n--- TEST 2: Skipped (no credentials) ---\n" +
      "  Rerun with: BUSINESS_TEST_EMAIL=... BUSINESS_TEST_PASSWORD=... node test-navbar.mjs",
  );
} else {
  console.log(`\n--- TEST 2: Signing in as ${email} ---`);

  const page = await browser.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await snap(page, "2a-login-page");

  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre").fill(password);
  await page.getByRole("button", { name: /Giriş yap/i }).click();

  await page.waitForTimeout(3000);
  await snap(page, "2b-after-login-attempt");

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const url = page.url();
  console.log("  Current URL:", url);

  const links = await navLinks(page);
  console.log("  Navbar links:", JSON.stringify(links));

  const hasDashboardLink = links.some(
    (link) => link.href === "/business/dashboard",
  );
  const noBusinessCTA = !(await hasText(page, "Güzellik uzmanı mısınız?"));
  const noSignInBtn = !(await hasText(page, "Giriş Yap"));

  console.log(
    "  /business/dashboard in nav:",
    hasDashboardLink ? "OK" : "FAIL",
  );
  console.log("  HomeBusinessCTA hidden:", noBusinessCTA ? "OK" : "FAIL");
  console.log("  Sign-in button gone:", noSignInBtn ? "OK" : "FAIL");

  const file = await snap(page, "2c-business-owner-homepage");
  console.log("  Screenshot:", file);
  await page.close();
}

await browser.close();
console.log("\nDone. Screenshots at:", SHOTS);
