# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: consent.spec.ts >> cookie policy table has category badge for each row
- Location: e2e\consent.spec.ts:317:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Zorunlu').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Zorunlu').first()

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
  223 |     .getByRole("button", { name: "Tercihleri kaydet" })
  224 |     .click();
  225 | 
  226 |   const value = await getConsentCookieValue(page);
  227 |   expect(value).toBe("v1:analytics=0,marketing=0");
  228 | });
  229 | 
  230 | // ─────────────────────────────────────────────────────────────────────────────
  231 | // Banner persistence (should NOT re-appear after consent)
  232 | // ─────────────────────────────────────────────────────────────────────────────
  233 | 
  234 | test("banner does not appear after accept all on subsequent navigation", async ({
  235 |   page,
  236 | }) => {
  237 |   await freshVisit(page);
  238 |   await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();
  239 | 
  240 |   // Navigate to another page — banner must NOT re-appear
  241 |   await page.goto("/login");
  242 |   await expect(
  243 |     page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  244 |   ).not.toBeVisible();
  245 | });
  246 | 
  247 | test("banner does not appear after reject on subsequent navigation", async ({
  248 |   page,
  249 | }) => {
  250 |   await freshVisit(page);
  251 |   await page.getByRole("button", { name: "Sadece gerekli" }).click();
  252 | 
  253 |   await page.goto("/login");
  254 |   await expect(
  255 |     page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  256 |   ).not.toBeVisible();
  257 | });
  258 | 
  259 | // ─────────────────────────────────────────────────────────────────────────────
  260 | // Footer "Çerez Ayarları" re-open
  261 | // ─────────────────────────────────────────────────────────────────────────────
  262 | 
  263 | test("footer Çerez Ayarları button re-opens banner after prior consent", async ({
  264 |   page,
  265 | }) => {
  266 |   await freshVisit(page);
  267 | 
  268 |   // Accept all → banner goes away
  269 |   await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();
  270 |   await expect(
  271 |     page.getByRole("dialog", { name: "Çerez Kullanımı" }),
  272 |   ).not.toBeVisible();
  273 | 
  274 |   // Click footer button → banner + panel re-appear
  275 |   await page.getByRole("button", { name: "Çerez Ayarları" }).click();
  276 | 
  277 |   const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  278 |   await expect(banner).toBeVisible();
  279 |   await expect(page.locator("#cookie-preferences-panel")).toBeVisible();
  280 | });
  281 | 
  282 | // ─────────────────────────────────────────────────────────────────────────────
  283 | // Cookie Policy page — COOKIE_REGISTRY-driven table
  284 | // ─────────────────────────────────────────────────────────────────────────────
  285 | 
  286 | test("cookie policy page renders without errors", async ({ page }) => {
  287 |   await page.goto("/cookie-policy");
  288 | 
  289 |   await expect(page.locator("body")).not.toContainText("404");
  290 |   await expect(page.locator("body")).not.toContainText("500");
  291 | 
  292 |   await expect(
  293 |     page.getByRole("heading", { name: "Çerez Politikası", level: 1 }),
  294 |   ).toBeVisible();
  295 | });
  296 | 
  297 | test("cookie policy table contains all 6 registered cookies", async ({
  298 |   page,
  299 | }) => {
  300 |   await page.goto("/cookie-policy");
  301 | 
  302 |   // All six cookies from COOKIE_REGISTRY must appear in the table
  303 |   const expectedNames = [
  304 |     "urglowup.session_token",
  305 |     "ugl_cookie_consent",
  306 |     "ugl_theme",
  307 |     "NEXT_LOCALE",
  308 |     "google_oauth_state",
  309 |     "google_oauth_pending",
  310 |   ];
  311 | 
  312 |   for (const name of expectedNames) {
  313 |     await expect(page.getByText(name).first()).toBeVisible();
  314 |   }
  315 | });
  316 | 
  317 | test("cookie policy table has category badge for each row", async ({
  318 |   page,
  319 | }) => {
  320 |   await page.goto("/cookie-policy");
  321 | 
  322 |   // "Zorunlu" (necessary) badge should appear at least once
> 323 |   await expect(page.getByText("Zorunlu").first()).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  324 |   // "Tercih" (preference) badge for ugl_theme / NEXT_LOCALE
  325 |   await expect(page.getByText("Tercih").first()).toBeVisible();
  326 | });
  327 | 
  328 | test("cookie policy page links to Google Cookie Policy", async ({ page }) => {
  329 |   await page.goto("/cookie-policy");
  330 | 
  331 |   const googleLink = page.getByRole("link", { name: "Google Çerez Politikası" });
  332 |   await expect(googleLink).toBeVisible();
  333 |   await expect(googleLink).toHaveAttribute(
  334 |     "href",
  335 |     "https://policies.google.com/technologies/cookies",
  336 |   );
  337 | });
  338 | 
  339 | // ─────────────────────────────────────────────────────────────────────────────
  340 | // Privacy policy page
  341 | // ─────────────────────────────────────────────────────────────────────────────
  342 | 
  343 | test("privacy policy page renders key KVKK sections", async ({ page }) => {
  344 |   await page.goto("/privacy-policy");
  345 | 
  346 |   await expect(page.locator("body")).not.toContainText("404");
  347 |   await expect(page.locator("body")).not.toContainText("500");
  348 | 
  349 |   await expect(page.getByText(/Kişisel Veri/i).first()).toBeVisible();
  350 |   await expect(page.getByText(/KVKK/i).first()).toBeVisible();
  351 | });
  352 | 
  353 | // ─────────────────────────────────────────────────────────────────────────────
  354 | // Manage-preferences panel — close button (toggle off)
  355 | // ─────────────────────────────────────────────────────────────────────────────
  356 | 
  357 | test("clicking Tercihleri yönet again collapses the panel", async ({ page }) => {
  358 |   await freshVisit(page);
  359 | 
  360 |   const manageBtn = page.getByRole("button", { name: "Tercihleri yönet" });
  361 | 
  362 |   // Open
  363 |   await manageBtn.click();
  364 |   await expect(page.locator("#cookie-preferences-panel")).toBeVisible();
  365 | 
  366 |   // Close
  367 |   await manageBtn.click();
  368 |   await expect(page.locator("#cookie-preferences-panel")).not.toBeVisible();
  369 | });
  370 | 
  371 | // ─────────────────────────────────────────────────────────────────────────────
  372 | // Accept all from within panel
  373 | // ─────────────────────────────────────────────────────────────────────────────
  374 | 
  375 | test("accept all from within panel — cookie analytics=1,marketing=1", async ({
  376 |   page,
  377 | }) => {
  378 |   await freshVisit(page);
  379 | 
  380 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  381 | 
  382 |   // The panel also exposes an "Accept all" button
  383 |   await page
  384 |     .locator("#cookie-preferences-panel")
  385 |     .getByRole("button", { name: "Tümünü kabul et" })
  386 |     .click();
  387 | 
  388 |   const value = await getConsentCookieValue(page);
  389 |   expect(value).toBe("v1:analytics=1,marketing=1");
  390 | });
  391 | 
```