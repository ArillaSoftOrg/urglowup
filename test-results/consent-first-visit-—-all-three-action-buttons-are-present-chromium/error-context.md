# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: consent.spec.ts >> first visit — all three action buttons are present
- Location: e2e\consent.spec.ts:51:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Sadece gerekli' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Sadece gerekli' })

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
  - paragraph: Beauty & Personal Care
  - heading "Discover beauty professionals near you" [level=1]
  - paragraph: Choose the right service, location, and professional. See real work, read verified reviews, and book with confidence.
  - searchbox
  - combobox:
    - option "Choose area or district" [selected]
    - option "Antalya"
    - option "Tavşanlı"
  - combobox:
    - option "Choose category" [selected]
    - option "Kuaför"
    - option "Tırnak Stüdyosu"
    - option "Dövme & Piercing"
  - button "Search"
  - text: "Popular searches:"
  - link "Hair salon":
    - /url: /en/explore?category=hair-salon
  - text: ·
  - link "Nails":
    - /url: /en/explore?category=nail-salon
  - text: ·
  - link "Skin care":
    - /url: /en/explore?category=skin-care
  - text: ·
  - link "Tattoo & Piercing":
    - /url: /en/explore?category=tattoo-piercing
  - paragraph: Categories
  - heading "Popular services" [level=2]
  - link "Explore all →":
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
  - link "See all professionals →":
    - /url: /en/explore
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
  - heading "Randevu almak hiç bu kadar kolay olmamıştı." [level=2]
  - text: "1"
  - heading "Uzmanını keşfet" [level=3]
  - paragraph: Kategoriye, şehre veya isme göre ara. Gerçek çalışmaları ve doğrulanmış yorumları incele.
  - text: "2"
  - heading "Profili incele" [level=3]
  - paragraph: Hizmetleri, çalışma saatlerini ve müşteri deneyimlerini detaylıca gör. Sana en uygun uzmanı seç.
  - text: "3"
  - heading "Randevunu al" [level=3]
  - paragraph: Birkaç tıklamayla randevu talebini ilet. Uzmanın onayladıktan sonra hazırsın.
  - link "Hemen Başla":
    - /url: /explore
  - heading "Her yorum gerçek bir deneyimden gelir." [level=2]
  - paragraph: UrGlowUp'ta yorum bırakabilmek için o işletmede tamamlanmış bir randevun olması gerekir. Sahte veya teşvik edilmiş yorum yoktur — sadece gerçek müşteri deneyimleri.
  - list:
    - listitem: Sadece tamamlanan randevular değerlendirilebilir
    - listitem: Her yorum ekibimiz tarafından incelenir
    - listitem: Ortalama puan; gerçek, doğrulanmış randevulara dayanır
  - link "Puanlama sistemimizi incele →":
    - /url: /puanlama-sistemi
  - paragraph: "%100"
  - paragraph: Doğrulanmış Değerlendirme
  - paragraph: Her değerlendirme, gerçek bir randevuya dayanır.
  - paragraph: İşletmenizi Büyütün
  - heading "Güzellik uzmanı mısınız?" [level=2]
  - paragraph: Ücretsiz profilinizi oluşturun, çalışmalarınızı sergileyin ve yeni müşterilere randevu kapısı açın. Kurulum birkaç dakika sürer.
  - paragraph: Kredi kartı gerekmez.
  - link "Ücretsiz Kayıt Olun":
    - /url: /business/register
  - link "Nasıl çalışır →":
    - /url: /for-business
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
  1   | /**
  2   |  * Cookie/Consent e2e tests (Phase 8 of the consent implementation plan)
  3   |  *
  4   |  * These tests cover the public-facing consent flow only — no DB-backed
  5   |  * authenticated flows (those require a seeded test user and are tested in
  6   |  * consent-preferences.spec.ts).
  7   |  *
  8   |  * Coverage:
  9   |  *  1. First visit: banner is visible
  10  |  *  2. Reject non-essential: banner dismissed, cookie set to analytics=0,marketing=0
  11  |  *  3. Accept all: banner dismissed, cookie set to analytics=1,marketing=1
  12  |  *  4. Manage preferences: panel opens with toggle rows
  13  |  *  5. Save preferences: custom choice written to cookie; banner dismissed
  14  |  *  6. After consent: banner does NOT reappear on a fresh navigation
  15  |  *  7. Footer "Çerez Ayarları" re-opens banner even with existing consent cookie
  16  |  *  8. Cookie policy page renders the cookie table driven by COOKIE_REGISTRY
  17  |  *  9. Privacy policy page renders key sections
  18  |  */
  19  | 
  20  | import { expect, test, type Page } from "@playwright/test";
  21  | 
  22  | // ─────────────────────────────────────────────────────────────────────────────
  23  | // Helpers
  24  | // ─────────────────────────────────────────────────────────────────────────────
  25  | 
  26  | const CONSENT_COOKIE = "ugl_cookie_consent";
  27  | 
  28  | /** Navigate to the home page with NO prior cookies (clean state). */
  29  | async function freshVisit(page: Page) {
  30  |   await page.context().clearCookies();
  31  |   await page.goto("/");
  32  | }
  33  | 
  34  | /** Read the consent cookie value from the browser context. */
  35  | async function getConsentCookieValue(page: Page): Promise<string | undefined> {
  36  |   const cookies = await page.context().cookies();
  37  |   return cookies.find((c) => c.name === CONSENT_COOKIE)?.value;
  38  | }
  39  | 
  40  | // ─────────────────────────────────────────────────────────────────────────────
  41  | // Banner visibility
  42  | // ─────────────────────────────────────────────────────────────────────────────
  43  | 
  44  | test("first visit — banner is visible", async ({ page }) => {
  45  |   await freshVisit(page);
  46  | 
  47  |   const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  48  |   await expect(banner).toBeVisible();
  49  | });
  50  | 
  51  | test("first visit — all three action buttons are present", async ({ page }) => {
  52  |   await freshVisit(page);
  53  | 
  54  |   await expect(
  55  |     page.getByRole("button", { name: "Sadece gerekli" }),
> 56  |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  57  |   await expect(
  58  |     page.getByRole("button", { name: "Tercihleri yönet" }),
  59  |   ).toBeVisible();
  60  |   await expect(
  61  |     page.getByRole("button", { name: "Tümünü kabul et" }),
  62  |   ).toBeVisible();
  63  | });
  64  | 
  65  | // ─────────────────────────────────────────────────────────────────────────────
  66  | // Reject non-essential
  67  | // ─────────────────────────────────────────────────────────────────────────────
  68  | 
  69  | test("reject non-essential — banner dismissed", async ({ page }) => {
  70  |   await freshVisit(page);
  71  | 
  72  |   await page.getByRole("button", { name: "Sadece gerekli" }).click();
  73  | 
  74  |   const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  75  |   await expect(banner).not.toBeVisible();
  76  | });
  77  | 
  78  | test("reject non-essential — consent cookie analytics=0,marketing=0", async ({
  79  |   page,
  80  | }) => {
  81  |   await freshVisit(page);
  82  | 
  83  |   await page.getByRole("button", { name: "Sadece gerekli" }).click();
  84  | 
  85  |   const value = await getConsentCookieValue(page);
  86  |   expect(value).toBe("v1:analytics=0,marketing=0");
  87  | });
  88  | 
  89  | // ─────────────────────────────────────────────────────────────────────────────
  90  | // Accept all
  91  | // ─────────────────────────────────────────────────────────────────────────────
  92  | 
  93  | test("accept all — banner dismissed", async ({ page }) => {
  94  |   await freshVisit(page);
  95  | 
  96  |   await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();
  97  | 
  98  |   const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  99  |   await expect(banner).not.toBeVisible();
  100 | });
  101 | 
  102 | test("accept all — consent cookie analytics=1,marketing=1", async ({
  103 |   page,
  104 | }) => {
  105 |   await freshVisit(page);
  106 | 
  107 |   await page.getByRole("button", { name: "Tümünü kabul et" }).first().click();
  108 | 
  109 |   const value = await getConsentCookieValue(page);
  110 |   expect(value).toBe("v1:analytics=1,marketing=1");
  111 | });
  112 | 
  113 | // ─────────────────────────────────────────────────────────────────────────────
  114 | // Manage preferences panel
  115 | // ─────────────────────────────────────────────────────────────────────────────
  116 | 
  117 | test("manage preferences — panel opens on click", async ({ page }) => {
  118 |   await freshVisit(page);
  119 | 
  120 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  121 | 
  122 |   // Panel is identified by its stable id
  123 |   await expect(page.locator("#cookie-preferences-panel")).toBeVisible();
  124 | });
  125 | 
  126 | test("manage preferences — panel has four rows (Necessary, Preference, Analitik, Pazarlama)", async ({
  127 |   page,
  128 | }) => {
  129 |   await freshVisit(page);
  130 | 
  131 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  132 | 
  133 |   const panel = page.locator("#cookie-preferences-panel");
  134 |   await expect(panel.getByText("Zorunlu")).toBeVisible();
  135 |   await expect(panel.getByText("Tercih")).toBeVisible();
  136 |   await expect(panel.getByText("Analitik")).toBeVisible();
  137 |   await expect(panel.getByText("Pazarlama")).toBeVisible();
  138 | });
  139 | 
  140 | test("manage preferences — Necessary and Preference rows show 'Her zaman etkin' lock badge", async ({
  141 |   page,
  142 | }) => {
  143 |   await freshVisit(page);
  144 | 
  145 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  146 | 
  147 |   const panel = page.locator("#cookie-preferences-panel");
  148 |   const badges = panel.getByText("Her zaman etkin");
  149 |   // Two locked rows → two badges
  150 |   await expect(badges).toHaveCount(2);
  151 | });
  152 | 
  153 | test("manage preferences — analytics toggle starts as 'Devre dışı' (default OFF)", async ({
  154 |   page,
  155 | }) => {
  156 |   await freshVisit(page);
```