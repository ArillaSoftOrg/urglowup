# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ilham-feed.spec.ts >> İlham tab renders the post feed container
- Location: e2e\ilham-feed.spec.ts:18:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "UrGlowUp" [ref=e4] [cursor=pointer]:
        - /url: /en
        - img [ref=e6]
        - generic [ref=e9]: UrGlowUp
      - navigation [ref=e10]:
        - link "Explore" [ref=e11] [cursor=pointer]:
          - /url: /en/explore
        - link "For Business" [ref=e12] [cursor=pointer]:
          - /url: /en/for-business
      - generic [ref=e13]:
        - button "Dil seçin" [ref=e15]:
          - img [ref=e16]
          - generic [ref=e19]: EN
          - img [ref=e20]
        - link "Sign In" [ref=e22] [cursor=pointer]:
          - /url: /login
        - link "List your business" [ref=e23] [cursor=pointer]:
          - /url: /en/for-business
        - button "Open menu" [ref=e24]:
          - generic [ref=e25]: Menü
          - img
  - main [ref=e26]:
    - generic [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - button "Keşfet" [ref=e30]
          - button "İlham" [ref=e31]
        - link "Deals" [ref=e32] [cursor=pointer]:
          - /url: /en/deals
          - img [ref=e33]
          - text: Deals
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]:
            - button "Tümü" [ref=e39]
            - button "Hair Salon" [ref=e40]
            - button "Nail Salon" [ref=e41]
            - button "Tattoo & Piercing" [ref=e42]
          - generic [ref=e43]:
            - button "Tümü" [ref=e44]
            - button "#Butterfly Cut" [ref=e45]
            - button "#Taper Fade" [ref=e46]
            - button "#Mid Fade" [ref=e47]
            - button "#Low Fade" [ref=e48]
            - button "#Buzz Cut" [ref=e49]
            - button "#Crew Cut" [ref=e50]
            - button "#Wolf Cut" [ref=e51]
            - button "#Blunt Cut" [ref=e52]
            - button "#Balayage" [ref=e53]
            - button "#Keratin Bakımı" [ref=e54]
            - button "#Ombre Saç" [ref=e55]
            - button "#Fine Line" [ref=e56]
            - button "#Minimal Dövme" [ref=e57]
            - button "#Blackwork" [ref=e58]
            - button "#Realism" [ref=e59]
        - generic [ref=e60]:
          - article [ref=e61]:
            - generic [ref=e62]:
              - link "S" [ref=e64] [cursor=pointer]:
                - /url: /b/salon-elnuha
                - generic [ref=e66]: S
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - link "Salon ELNUHA" [ref=e69] [cursor=pointer]:
                    - /url: /b/salon-elnuha
                  - generic [ref=e70]: · SAÇ-SAKAL
                  - generic [ref=e71]: Hair Salon
                - paragraph [ref=e72]: Denemelik
                - link "#Butterfly Cut" [ref=e74] [cursor=pointer]:
                  - /url: /styles/butterfly-cut
                - button "Gorseli buyut" [ref=e76] [cursor=pointer]:
                  - img "Denemelik" [ref=e77]
                - generic [ref=e78]:
                  - button "Kaydet" [ref=e79]:
                    - img [ref=e80]
                  - link "Randevu al" [ref=e82] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e83]
                  - link "Mesaj gonder" [ref=e85] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e86]
          - article [ref=e88]:
            - generic [ref=e89]:
              - link "S" [ref=e91] [cursor=pointer]:
                - /url: /b/salon-elnuha
                - generic [ref=e93]: S
              - generic [ref=e94]:
                - generic [ref=e95]:
                  - link "Salon ELNUHA" [ref=e96] [cursor=pointer]:
                    - /url: /b/salon-elnuha
                  - generic [ref=e97]: · SAÇ-SAKAL
                  - generic [ref=e98]: Hair Salon
                - paragraph [ref=e99]: Denemelik
                - link "#Butterfly Cut" [ref=e101] [cursor=pointer]:
                  - /url: /styles/butterfly-cut
                - button "Gorseli buyut" [ref=e103] [cursor=pointer]:
                  - img "Denemelik" [ref=e104]
                - generic [ref=e105]:
                  - button "Kaydet" [ref=e106]:
                    - img [ref=e107]
                  - link "Randevu al" [ref=e109] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e110]
                  - link "Mesaj gonder" [ref=e112] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e113]
          - article [ref=e115]:
            - generic [ref=e116]:
              - link "C" [ref=e118] [cursor=pointer]:
                - /url: /b/charm-beauty-nail
                - generic [ref=e120]: C
              - generic [ref=e121]:
                - link "CHARM BEAUTY NAİL" [ref=e123] [cursor=pointer]:
                  - /url: /b/charm-beauty-nail
                - paragraph [ref=e124]: "[ILHAM_TEST] Karma medya — 3 öğe: iki fotoğraf ve bir video."
                - button "Gorseli buyut" [ref=e126] [cursor=pointer]:
                  - 'img "[ILHAM_TEST] Karma medya — 3 öğe: iki fotoğraf ve bir video." [ref=e127]'
                  - generic: 1/3
                  - button "Sonraki" [ref=e128]:
                    - img [ref=e129]
                - generic [ref=e131]:
                  - button "Kaydet" [ref=e132]:
                    - img [ref=e133]
                  - link "Randevu al" [ref=e135] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e136]
                  - link "Mesaj gonder" [ref=e138] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e139]
          - article [ref=e141]:
            - generic [ref=e142]:
              - link "C" [ref=e144] [cursor=pointer]:
                - /url: /b/charm-beauty-nail
                - generic [ref=e146]: C
              - generic [ref=e147]:
                - link "CHARM BEAUTY NAİL" [ref=e149] [cursor=pointer]:
                  - /url: /b/charm-beauty-nail
                - paragraph [ref=e150]: "[ILHAM_TEST] Boyama işlemi canlı çekim — dikey format."
                - button "Gorseli buyut" [ref=e152] [cursor=pointer]:
                  - img "[ILHAM_TEST] Boyama işlemi canlı çekim — dikey format." [ref=e153]
                  - button "Videoyu oynat" [ref=e154]:
                    - img [ref=e156]
                - generic [ref=e158]:
                  - button "Kaydet" [ref=e159]:
                    - img [ref=e160]
                  - link "Randevu al" [ref=e162] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e163]
                  - link "Mesaj gonder" [ref=e165] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e166]
          - article [ref=e168]:
            - generic [ref=e169]:
              - link "C" [ref=e171] [cursor=pointer]:
                - /url: /b/charm-beauty-nail
                - generic [ref=e173]: C
              - generic [ref=e174]:
                - link "CHARM BEAUTY NAİL" [ref=e176] [cursor=pointer]:
                  - /url: /b/charm-beauty-nail
                - button "Gorseli buyut" [ref=e178] [cursor=pointer]:
                  - img "Gonderi gorseli" [ref=e179]
                - generic [ref=e180]:
                  - button "Kaydet" [ref=e181]:
                    - img [ref=e182]
                  - link "Randevu al" [ref=e184] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e185]
                  - link "Mesaj gonder" [ref=e187] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e188]
          - article [ref=e190]:
            - generic [ref=e191]:
              - link "C" [ref=e193] [cursor=pointer]:
                - /url: /b/charm-beauty-nail
                - generic [ref=e195]: C
              - generic [ref=e196]:
                - link "CHARM BEAUTY NAİL" [ref=e198] [cursor=pointer]:
                  - /url: /b/charm-beauty-nail
                - paragraph [ref=e199]: "[ILHAM_TEST] Saç bakımında doğal yöntemler her zaman en iyisidir. Haftada iki kez protein maskesi uygulamanızı tavsiye ediyoruz. Detaylı bilgi için bizi ziyaret edin."
                - generic [ref=e200]:
                  - button "Kaydet" [ref=e201]:
                    - img [ref=e202]
                  - link "Randevu al" [ref=e204] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e205]
                  - link "Mesaj gonder" [ref=e207] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e208]
          - article [ref=e210]:
            - generic [ref=e211]:
              - link "S" [ref=e213] [cursor=pointer]:
                - /url: /b/salon-elnuha
                - generic [ref=e215]: S
              - generic [ref=e216]:
                - generic [ref=e217]:
                  - link "Salon ELNUHA" [ref=e218] [cursor=pointer]:
                    - /url: /b/salon-elnuha
                  - generic [ref=e219]: · SAÇ-SAKAL
                  - generic [ref=e220]: Hair Salon
                - paragraph [ref=e221]: Denemelik bişeyler yükledik ya hade bakam
                - button "Gorseli buyut" [ref=e223] [cursor=pointer]:
                  - img "Denemelik bişeyler yükledik ya hade bakam" [ref=e224]
                  - button "Videoyu oynat" [ref=e225]:
                    - img [ref=e227]
                  - generic: 1/3
                  - button "Sonraki" [ref=e229]:
                    - img [ref=e230]
                - generic [ref=e232]:
                  - button "Kaydet" [ref=e233]:
                    - img [ref=e234]
                  - link "Randevu al" [ref=e236] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e237]
                  - link "Mesaj gonder" [ref=e239] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e240]
          - article [ref=e242]:
            - generic [ref=e243]:
              - link "S" [ref=e245] [cursor=pointer]:
                - /url: /b/salon-elnuha
                - generic [ref=e247]: S
              - generic [ref=e248]:
                - generic [ref=e249]:
                  - link "Salon ELNUHA" [ref=e250] [cursor=pointer]:
                    - /url: /b/salon-elnuha
                  - generic [ref=e251]: · SAÇ-SAKAL
                  - generic [ref=e252]: Hair Salon
                - paragraph [ref=e253]: Denemelik bişeyler yükledik ya hade bakam
                - button "Gorseli buyut" [ref=e255] [cursor=pointer]:
                  - img "Denemelik bişeyler yükledik ya hade bakam" [ref=e256]
                  - button "Videoyu oynat" [ref=e257]:
                    - img [ref=e259]
                  - generic: 1/3
                  - button "Sonraki" [ref=e261]:
                    - img [ref=e262]
                - generic [ref=e264]:
                  - button "Kaydet" [ref=e265]:
                    - img [ref=e266]
                  - link "Randevu al" [ref=e268] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e269]
                  - link "Mesaj gonder" [ref=e271] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e272]
  - contentinfo [ref=e274]:
    - generic [ref=e275]:
      - generic [ref=e276]:
        - generic [ref=e277]:
          - link "UrGlowUp" [ref=e278] [cursor=pointer]:
            - /url: /
          - paragraph [ref=e279]: Guzelligini kesfet.
        - generic [ref=e280]:
          - paragraph [ref=e281]: Kesfet
          - list [ref=e282]:
            - listitem [ref=e283]:
              - link "Tum Uzmanlar" [ref=e284] [cursor=pointer]:
                - /url: /explore
            - listitem [ref=e285]:
              - link "Kategoriler" [ref=e286] [cursor=pointer]:
                - /url: /explore
        - generic [ref=e287]:
          - paragraph [ref=e288]: Isletmeler
          - list [ref=e289]:
            - listitem [ref=e290]:
              - link "Isletmeler Icin" [ref=e291] [cursor=pointer]:
                - /url: /for-business
            - listitem [ref=e292]:
              - link "Isletme Kaydi" [ref=e293] [cursor=pointer]:
                - /url: /business/register
        - generic [ref=e294]:
          - paragraph [ref=e295]: Hesap
          - list [ref=e296]:
            - listitem [ref=e297]:
              - link "Giris Yap" [ref=e298] [cursor=pointer]:
                - /url: /login
            - listitem [ref=e299]:
              - link "Kayit Ol" [ref=e300] [cursor=pointer]:
                - /url: /register
            - listitem [ref=e301]:
              - link "Yardım Merkezi" [ref=e302] [cursor=pointer]:
                - /url: /help
        - generic [ref=e303]:
          - paragraph [ref=e304]: Yasal
          - list [ref=e305]:
            - listitem [ref=e306]:
              - link "Gizlilik Politikası" [ref=e307] [cursor=pointer]:
                - /url: /privacy-policy
            - listitem [ref=e308]:
              - link "Çerez Politikası" [ref=e309] [cursor=pointer]:
                - /url: /cookie-policy
            - listitem [ref=e310]:
              - link "KVKK Aydınlatma" [ref=e311] [cursor=pointer]:
                - /url: /kvkk
            - listitem [ref=e312]:
              - link "Kullanım Koşulları" [ref=e313] [cursor=pointer]:
                - /url: /kullanim-kosullari
            - listitem [ref=e314]:
              - link "KVKK Başvuru" [ref=e315] [cursor=pointer]:
                - /url: /kvkk-basvuru
            - listitem [ref=e316]:
              - button "Çerez Ayarları" [ref=e317]
      - paragraph [ref=e319]: © 2026 UrGlowUp. Tum haklari saklidir.
  - dialog "Cookie Usage" [ref=e320]:
    - generic [ref=e322]:
      - generic [ref=e323]:
        - paragraph [ref=e324]: Cookie Usage
        - paragraph [ref=e325]:
          - text: We use cookies to keep the site secure, remember your language preference, and improve your experience. See our
          - link "Cookie Policy" [ref=e326] [cursor=pointer]:
            - /url: /cookie-policy
          - text: "&"
          - link "Privacy Policy" [ref=e327] [cursor=pointer]:
            - /url: /privacy-policy
          - text: .
      - generic [ref=e328]:
        - button "Necessary only" [ref=e329]
        - button "Manage preferences" [ref=e330]
        - button "Accept all" [ref=e331]
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
  14 |   await expect(page.getByRole("link", { name: /İşletmeler/i })).toBeVisible();
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
> 41 |   expect(feedMounted).toBe(true);
     |                       ^ Error: expect(received).toBe(expected) // Object.is equality
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