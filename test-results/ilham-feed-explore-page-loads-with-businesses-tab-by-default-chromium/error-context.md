# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ilham-feed.spec.ts >> explore page loads with businesses tab by default
- Location: e2e\ilham-feed.spec.ts:10:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /İşletmeler/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /İşletmeler/i })

```

```yaml
- banner:
  - link "UrGlowUp":
    - /url: /en
  - navigation:
    - link "Explore":
      - /url: /en/explore
    - link "For Business":
      - /url: /en/for-business
  - button "Dil seçin": EN
  - link "Sign In":
    - /url: /login
  - link "List your business":
    - /url: /en/for-business
  - button "Open menu": Menü
- main:
  - button "Keşfet"
  - button "İlham"
  - link "Deals":
    - /url: /en/deals
  - heading "Search services" [level=1]
  - paragraph: Search by service, business, or category.
  - searchbox "Uzman, hizmet veya işletme ara"
  - combobox:
    - option "Bölge veya ilçe seç" [selected]
    - option "Antalya"
    - option "Tavşanlı"
  - combobox:
    - option "Kategori seç" [selected]
    - option "Kuaför"
    - option "Tırnak Stüdyosu"
    - option "Dövme & Piercing"
  - button "Filtreler"
  - button "Ara"
  - heading "What are you looking for?" [level=2]
  - link "All categories →":
    - /url: /en/explore
  - link "Hair Salon Kuaför":
    - /url: /en/category/hair-salon
    - img "Hair Salon"
    - paragraph: Kuaför
  - link "Nail Salon Tırnak Stüdyosu":
    - /url: /en/category/nail-salon
    - img "Nail Salon"
    - paragraph: Tırnak Stüdyosu
  - link "Tattoo & Piercing Dövme & Piercing":
    - /url: /en/category/tattoo-piercing
    - img "Tattoo & Piercing"
    - paragraph: Dövme & Piercing
  - heading "Explore by region" [level=2]
  - link "Antalya (2)":
    - /url: /en/city/Antalya
  - link "Tavşanlı (1)":
    - /url: /en/city/Tav%C5%9Fanl%C4%B1
  - link "No.1 Tatto & Piercing kapak görseli Yeni No.1 Tatto & Piercing Tattoo & Piercing · konyaaltı":
    - /url: /en/b/no1-tatto-piercing
    - img "No.1 Tatto & Piercing kapak görseli"
    - text: Yeni
    - paragraph: No.1 Tatto & Piercing
    - paragraph: Tattoo & Piercing · konyaaltı
  - link "Yeni CHARM BEAUTY NAİL Nail Salon · konyaaltı":
    - /url: /en/b/charm-beauty-nail
    - text: Yeni
    - paragraph: CHARM BEAUTY NAİL
    - paragraph: Nail Salon · konyaaltı
  - link "Salon ELNUHA kapak görseli Salon ELNUHA 9.0 / 10 Hair Salon · ömerbey":
    - /url: /en/b/salon-elnuha
    - img "Salon ELNUHA kapak görseli"
    - paragraph: Salon ELNUHA
    - text: 9.0 / 10
    - paragraph: Hair Salon · ömerbey
- contentinfo:
  - link "UrGlowUp":
    - /url: /
  - paragraph: Guzelligini kesfet.
  - paragraph: Kesfet
  - list:
    - listitem:
      - link "Tum Uzmanlar":
        - /url: /explore
    - listitem:
      - link "Kategoriler":
        - /url: /explore
  - paragraph: Isletmeler
  - list:
    - listitem:
      - link "Isletmeler Icin":
        - /url: /for-business
    - listitem:
      - link "Isletme Kaydi":
        - /url: /business/register
  - paragraph: Hesap
  - list:
    - listitem:
      - link "Giris Yap":
        - /url: /login
    - listitem:
      - link "Kayit Ol":
        - /url: /register
    - listitem:
      - link "Yardım Merkezi":
        - /url: /help
  - paragraph: Yasal
  - list:
    - listitem:
      - link "Gizlilik Politikası":
        - /url: /privacy-policy
    - listitem:
      - link "Çerez Politikası":
        - /url: /cookie-policy
    - listitem:
      - link "KVKK Aydınlatma":
        - /url: /kvkk
    - listitem:
      - link "Kullanım Koşulları":
        - /url: /kullanim-kosullari
    - listitem:
      - link "KVKK Başvuru":
        - /url: /kvkk-basvuru
    - listitem:
      - button "Çerez Ayarları"
  - paragraph: © 2026 UrGlowUp. Tum haklari saklidir.
- dialog "Cookie Usage":
  - paragraph: Cookie Usage
  - paragraph:
    - text: We use cookies to keep the site secure, remember your language preference, and improve your experience. See our
    - link "Cookie Policy":
      - /url: /cookie-policy
    - text: "&"
    - link "Privacy Policy":
      - /url: /privacy-policy
    - text: .
  - button "Necessary only"
  - button "Manage preferences"
  - button "Accept all"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | // ─────────────────────────────────────────────────────────────
  4  | // İlham feed smoke tests
  5  | // All tests are unauthenticated — they only verify public rendering.
  6  | // Personalization and save actions require a seeded test user
  7  | // (out of scope for the current CI-safe smoke suite).
  8  | // ─────────────────────────────────────────────────────────────
  9  | 
  10 | test("explore page loads with businesses tab by default", async ({ page }) => {
  11 |   await page.goto("/explore");
  12 | 
  13 |   // Tab bar is present
> 14 |   await expect(page.getByRole("link", { name: /İşletmeler/i })).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  15 |   await expect(page.getByRole("link", { name: /İlham/i })).toBeVisible();
  16 | });
  17 | 
  18 | test("İlham tab renders the post feed container", async ({ page }) => {
  19 |   await page.goto("/explore?tab=ilham");
  20 | 
  21 |   // Either posts or the empty state renders — both are inside the feed wrapper
  22 |   // We just confirm the page loaded without a crash and key feed chrome is present.
  23 |   await expect(page.locator("body")).not.toContainText("500");
  24 |   await expect(page.locator("body")).not.toContainText("Internal Server Error");
  25 | 
  26 |   // The category filter bar should be visible (always rendered, even when empty)
  27 |   // OR the empty-state illustration — either means the feed mounted correctly.
  28 |   const feedMounted = await Promise.race([
  29 |     page
  30 |       .locator('[aria-label="Görseli büyüt"]')
  31 |       .first()
  32 |       .waitFor({ timeout: 5000 })
  33 |       .then(() => true)
  34 |       .catch(() => false),
  35 |     page
  36 |       .getByText("Henüz gönderi yok")
  37 |       .waitFor({ timeout: 5000 })
  38 |       .then(() => true)
  39 |       .catch(() => false),
  40 |   ]);
  41 |   expect(feedMounted).toBe(true);
  42 | });
  43 | 
  44 | test("İlham tab — unauthenticated user does NOT see personalization nudge", async ({
  45 |   page,
  46 | }) => {
  47 |   await page.goto("/explore?tab=ilham");
  48 | 
  49 |   // Nudge only shows for logged-in users without consent
  50 |   await expect(
  51 |     page.getByText("Akışını kişiselleştir"),
  52 |   ).not.toBeVisible();
  53 | });
  54 | 
  55 | test("İlham tab — locale-aware route /en/explore renders feed", async ({
  56 |   page,
  57 | }) => {
  58 |   await page.goto("/en/explore?tab=ilham");
  59 | 
  60 |   await expect(page.locator("body")).not.toContainText("500");
  61 |   await expect(page.locator("body")).not.toContainText("Internal Server Error");
  62 | });
  63 | 
  64 | test("İlham tab — locale-aware route /de/explore renders feed", async ({
  65 |   page,
  66 | }) => {
  67 |   await page.goto("/de/explore?tab=ilham");
  68 | 
  69 |   await expect(page.locator("body")).not.toContainText("500");
  70 |   await expect(page.locator("body")).not.toContainText("Internal Server Error");
  71 | });
  72 | 
```