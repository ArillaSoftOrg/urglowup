import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3000";
const SHOTS = path.join(process.cwd(), "test-screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });

const snap = async (page, name) => {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
};

// ── Helper: get navbar link texts ────────────────────────────────────────────
const navLinks = async (page) =>
  page.$$eval("header nav a", (els) =>
    els.map((e) => ({ text: e.textContent.trim(), href: e.getAttribute("href") }))
  );

const hasText = async (page, text) =>
  page.getByText(text, { exact: false }).isVisible().catch(() => false);

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1 — Logged-out homepage
// ═══════════════════════════════════════════════════════════════════════════
console.log("\n── TEST 1: Logged-out homepage ──────────────────────────────────");
{
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  const links = await navLinks(page);
  console.log("  Navbar links:", JSON.stringify(links));

  const businessCTA = await hasText(page, "Güzellik uzmanı mısınız?");
  const signInBtn   = await hasText(page, "Giriş Yap");
  const registerBtn = await hasText(page, "Kayıt Ol");

  console.log("  HomeBusinessCTA visible:", businessCTA, businessCTA ? "✓" : "✗ FAIL");
  console.log("  Sign-in button visible:", signInBtn, signInBtn ? "✓" : "✗ FAIL");
  console.log("  Register button visible:", registerBtn, registerBtn ? "✓" : "✗ FAIL");

  const hasExplore   = links.some((l) => l.href === "/explore");
  const hasBusiness  = links.some((l) => l.href === "/for-business");
  const noAccount    = !links.some((l) => l.href === "/account");
  const noDashboard  = !links.some((l) => l.href === "/business/dashboard");
  console.log("  /explore in nav:", hasExplore ? "✓" : "✗ FAIL");
  console.log("  /for-business in nav:", hasBusiness ? "✓" : "✗ FAIL");
  console.log("  /account NOT in nav:", noAccount ? "✓" : "✗ FAIL");
  console.log("  /business/dashboard NOT in nav:", noDashboard ? "✓" : "✗ FAIL");

  const f = await snap(page, "1-logged-out-homepage");
  console.log("  Screenshot:", f);
  await page.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2 — Business-owner signed in
// Reads Clerk session from .env.local BUSINESS_TEST_EMAIL / BUSINESS_TEST_PASSWORD
// Falls back to env vars passed on the command line.
// ═══════════════════════════════════════════════════════════════════════════
const email    = process.env.BUSINESS_TEST_EMAIL;
const password = process.env.BUSINESS_TEST_PASSWORD;

if (!email || !password) {
  console.log(
    "\n── TEST 2: Skipped (no credentials) ─────────────────────────────────\n" +
    "  Rerun with:  BUSINESS_TEST_EMAIL=... BUSINESS_TEST_PASSWORD=... node test-navbar.mjs"
  );
} else {
  console.log(`\n── TEST 2: Signing in as ${email} ──────────────────────────────────`);

  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Open Clerk modal
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await page.waitForTimeout(2000);
  await snap(page, "2a-clerk-modal");

  // Fill email
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.fill(email);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);

  // Fill password (if on password step)
  try {
    const pwInput = page.locator('input[type="password"]').first();
    if (await pwInput.isVisible({ timeout: 3000 })) {
      await pwInput.fill(password);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(3000);
    }
  } catch { /* single-step flow */ }

  await snap(page, "2b-after-login-attempt");

  // Wait for redirect back to homepage
  await page.waitForURL(BASE + "**", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log("  Current URL:", url);

  const links = await navLinks(page);
  console.log("  Navbar links:", JSON.stringify(links));

  const hasDashboardLink = links.some((l) => l.href === "/business/dashboard");
  const noBusinessCTA    = !(await hasText(page, "Güzellik uzmanı mısınız?"));
  const noSignInBtn      = !(await hasText(page, "Giriş Yap"));

  console.log("  /business/dashboard in nav:", hasDashboardLink ? "✓" : "✗ FAIL");
  console.log("  HomeBusinessCTA hidden:", noBusinessCTA ? "✓" : "✗ FAIL");
  console.log("  Sign-in button gone:", noSignInBtn ? "✓" : "✗ FAIL");

  const f = await snap(page, "2c-business-owner-homepage");
  console.log("  Screenshot:", f);
  await page.close();
}

await browser.close();
console.log("\n✓ Done. Screenshots at:", SHOTS);
