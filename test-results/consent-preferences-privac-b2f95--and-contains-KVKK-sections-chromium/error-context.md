# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: consent-preferences.spec.ts >> privacy policy page renders and contains KVKK sections
- Location: e2e\consent-preferences.spec.ts:16:5

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: locator('body')
Expected substring: not "404"
Received string: "404Page not foundThe page you're looking for doesn't exist or has been moved.Go home"
Timeout: 5000ms

Call log:
  - Expect "not toContainText" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body class="flex min-h-full flex-col font-sans">…</body>
       - unexpected value "404Page not foundThe page you're looking for doesn't exist or has been moved.Go home"

```

```yaml
- heading "404" [level=1]
- heading "Page not found" [level=2]
- paragraph: The page you're looking for doesn't exist or has been moved.
- link "Go home":
  - /url: /
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | // ─────────────────────────────────────────────────────────────
  4  | // Consent & personalization smoke tests
  5  | // Authenticated flows (toggle persistence, audit log) require
  6  | // a seeded test user and are out of scope for the CI smoke suite.
  7  | // ─────────────────────────────────────────────────────────────
  8  | 
  9  | test("account settings redirects unauthenticated users to login", async ({
  10 |   page,
  11 | }) => {
  12 |   await page.goto("/account/settings");
  13 |   await expect(page).toHaveURL(/\/login/);
  14 | });
  15 | 
  16 | test("privacy policy page renders and contains KVKK sections", async ({
  17 |   page,
  18 | }) => {
  19 |   await page.goto("/privacy-policy");
  20 | 
> 21 |   await expect(page.locator("body")).not.toContainText("404");
     |                                          ^ Error: expect(locator).not.toContainText(expected) failed
  22 |   await expect(page.locator("body")).not.toContainText("500");
  23 | 
  24 |   // Key consent-related sections should be present
  25 |   await expect(page.getByText(/Kişisel Veri/i).first()).toBeVisible();
  26 |   await expect(page.getByText(/KVKK/i).first()).toBeVisible();
  27 | });
  28 | 
  29 | test("personalization nudge link points to account settings privacy anchor", async ({
  30 |   page,
  31 | }) => {
  32 |   // We can't render the nudge without being logged in, but we can confirm the
  33 |   // destination route returns a login redirect (proving the URL is correct).
  34 |   await page.goto("/account/settings#privacy");
  35 |   await expect(page).toHaveURL(/\/login/);
  36 | });
  37 | 
```