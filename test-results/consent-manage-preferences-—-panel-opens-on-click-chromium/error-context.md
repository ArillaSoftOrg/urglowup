# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: consent.spec.ts >> manage preferences — panel opens on click
- Location: e2e\consent.spec.ts:117:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Tercihleri yönet' })

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
      - generic [ref=e29]:
        - paragraph [ref=e30]: Beauty & Personal Care
        - heading "Discover beauty professionals near you" [level=1] [ref=e31]
        - paragraph [ref=e32]: Choose the right service, location, and professional. See real work, read verified reviews, and book with confidence.
        - generic [ref=e34]:
          - generic [ref=e35]:
            - img [ref=e36]
            - searchbox [ref=e39]
          - generic [ref=e40]:
            - img [ref=e41]
            - combobox [ref=e44]:
              - option "Choose area or district" [selected]
              - option "Antalya"
              - option "Tavşanlı"
            - img
          - generic [ref=e45]:
            - img [ref=e46]
            - combobox [ref=e50]:
              - option "Choose category" [selected]
              - option "Kuaför"
              - option "Tırnak Stüdyosu"
              - option "Dövme & Piercing"
            - img
          - button "Search" [ref=e51]
        - generic [ref=e52]:
          - generic [ref=e53]: "Popular searches:"
          - link "Hair salon" [ref=e54] [cursor=pointer]:
            - /url: /en/explore?category=hair-salon
          - generic [ref=e55]: ·
          - link "Nails" [ref=e56] [cursor=pointer]:
            - /url: /en/explore?category=nail-salon
          - generic [ref=e57]: ·
          - link "Skin care" [ref=e58] [cursor=pointer]:
            - /url: /en/explore?category=skin-care
          - generic [ref=e59]: ·
          - link "Tattoo & Piercing" [ref=e60] [cursor=pointer]:
            - /url: /en/explore?category=tattoo-piercing
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]:
            - paragraph [ref=e65]: Categories
            - heading "Popular services" [level=2] [ref=e66]
          - link "Explore all →" [ref=e67] [cursor=pointer]:
            - /url: /en/explore
        - generic [ref=e68]:
          - link "Hair Salon Kuaför" [ref=e69] [cursor=pointer]:
            - /url: /en/category/hair-salon
            - img "Hair Salon" [ref=e71]
            - paragraph [ref=e73]: Kuaför
          - link "Nail Salon Tırnak Stüdyosu" [ref=e74] [cursor=pointer]:
            - /url: /en/category/nail-salon
            - img "Nail Salon" [ref=e76]
            - paragraph [ref=e78]: Tırnak Stüdyosu
          - link "Tattoo & Piercing Dövme & Piercing" [ref=e79] [cursor=pointer]:
            - /url: /en/category/tattoo-piercing
            - img "Tattoo & Piercing" [ref=e81]
            - paragraph [ref=e83]: Dövme & Piercing
      - generic [ref=e85]:
        - link "See all professionals →" [ref=e87] [cursor=pointer]:
          - /url: /en/explore
        - generic [ref=e89]:
          - link "No.1 Tatto & Piercing kapak görseli Yeni No.1 Tatto & Piercing Tattoo & Piercing · konyaaltı" [ref=e90] [cursor=pointer]:
            - /url: /en/b/no1-tatto-piercing
            - generic [ref=e91]:
              - img "No.1 Tatto & Piercing kapak görseli" [ref=e92]
              - generic [ref=e93]: Yeni
            - generic [ref=e94]:
              - paragraph [ref=e96]: No.1 Tatto & Piercing
              - paragraph [ref=e97]: Tattoo & Piercing · konyaaltı
          - link "Yeni CHARM BEAUTY NAİL Nail Salon · konyaaltı" [ref=e98] [cursor=pointer]:
            - /url: /en/b/charm-beauty-nail
            - generic [ref=e101]: Yeni
            - generic [ref=e102]:
              - paragraph [ref=e104]: CHARM BEAUTY NAİL
              - paragraph [ref=e105]: Nail Salon · konyaaltı
          - link "Salon ELNUHA kapak görseli Salon ELNUHA 9.0 / 10 Hair Salon · ömerbey" [ref=e106] [cursor=pointer]:
            - /url: /en/b/salon-elnuha
            - img "Salon ELNUHA kapak görseli" [ref=e108]
            - generic [ref=e109]:
              - generic [ref=e110]:
                - paragraph [ref=e111]: Salon ELNUHA
                - generic [ref=e112]: 9.0 / 10
              - paragraph [ref=e113]: Hair Salon · ömerbey
      - generic [ref=e115]:
        - heading "Randevu almak hiç bu kadar kolay olmamıştı." [level=2] [ref=e117]:
          - text: Randevu almak hiç bu kadar
          - text: kolay olmamıştı.
        - generic [ref=e118]:
          - generic [ref=e119]:
            - generic [ref=e120]: "1"
            - img [ref=e122]
            - generic [ref=e125]:
              - heading "Uzmanını keşfet" [level=3] [ref=e126]
              - paragraph [ref=e127]: Kategoriye, şehre veya isme göre ara. Gerçek çalışmaları ve doğrulanmış yorumları incele.
          - generic [ref=e128]:
            - generic [ref=e129]: "2"
            - img [ref=e131]
            - generic [ref=e134]:
              - heading "Profili incele" [level=3] [ref=e135]
              - paragraph [ref=e136]: Hizmetleri, çalışma saatlerini ve müşteri deneyimlerini detaylıca gör. Sana en uygun uzmanı seç.
          - generic [ref=e137]:
            - generic [ref=e138]: "3"
            - img [ref=e140]
            - generic [ref=e143]:
              - heading "Randevunu al" [level=3] [ref=e144]
              - paragraph [ref=e145]: Birkaç tıklamayla randevu talebini ilet. Uzmanın onayladıktan sonra hazırsın.
        - link "Hemen Başla" [ref=e147] [cursor=pointer]:
          - /url: /explore
      - generic [ref=e150]:
        - generic [ref=e151]:
          - heading "Her yorum gerçek bir deneyimden gelir." [level=2] [ref=e152]
          - paragraph [ref=e153]: UrGlowUp'ta yorum bırakabilmek için o işletmede tamamlanmış bir randevun olması gerekir. Sahte veya teşvik edilmiş yorum yoktur — sadece gerçek müşteri deneyimleri.
          - list [ref=e154]:
            - listitem [ref=e155]:
              - img [ref=e156]
              - generic [ref=e159]: Sadece tamamlanan randevular değerlendirilebilir
            - listitem [ref=e160]:
              - img [ref=e161]
              - generic [ref=e164]: Her yorum ekibimiz tarafından incelenir
            - listitem [ref=e165]:
              - img [ref=e166]
              - generic [ref=e168]: Ortalama puan; gerçek, doğrulanmış randevulara dayanır
          - link "Puanlama sistemimizi incele →" [ref=e169] [cursor=pointer]:
            - /url: /puanlama-sistemi
        - generic [ref=e170]:
          - img [ref=e172]
          - paragraph [ref=e175]: "%100"
          - paragraph [ref=e176]:
            - text: Doğrulanmış
            - text: Değerlendirme
          - paragraph [ref=e177]:
            - text: Her değerlendirme, gerçek
            - text: bir randevuya dayanır.
      - generic [ref=e180]:
        - generic [ref=e181]:
          - paragraph [ref=e182]: İşletmenizi Büyütün
          - heading "Güzellik uzmanı mısınız?" [level=2] [ref=e183]
          - paragraph [ref=e184]: Ücretsiz profilinizi oluşturun, çalışmalarınızı sergileyin ve yeni müşterilere randevu kapısı açın. Kurulum birkaç dakika sürer.
          - paragraph [ref=e185]: Kredi kartı gerekmez.
        - generic [ref=e186]:
          - link "Ücretsiz Kayıt Olun" [ref=e187] [cursor=pointer]:
            - /url: /business/register
          - link "Nasıl çalışır →" [ref=e188] [cursor=pointer]:
            - /url: /for-business
  - contentinfo [ref=e189]:
    - generic [ref=e190]:
      - generic [ref=e191]:
        - generic [ref=e192]:
          - link "UrGlowUp" [ref=e193] [cursor=pointer]:
            - /url: /
          - paragraph [ref=e194]: Guzelligini kesfet.
        - generic [ref=e195]:
          - paragraph [ref=e196]: Kesfet
          - list [ref=e197]:
            - listitem [ref=e198]:
              - link "Tum Uzmanlar" [ref=e199] [cursor=pointer]:
                - /url: /explore
            - listitem [ref=e200]:
              - link "Kategoriler" [ref=e201] [cursor=pointer]:
                - /url: /explore
        - generic [ref=e202]:
          - paragraph [ref=e203]: Isletmeler
          - list [ref=e204]:
            - listitem [ref=e205]:
              - link "Isletmeler Icin" [ref=e206] [cursor=pointer]:
                - /url: /for-business
            - listitem [ref=e207]:
              - link "Isletme Kaydi" [ref=e208] [cursor=pointer]:
                - /url: /business/register
        - generic [ref=e209]:
          - paragraph [ref=e210]: Hesap
          - list [ref=e211]:
            - listitem [ref=e212]:
              - link "Giris Yap" [ref=e213] [cursor=pointer]:
                - /url: /login
            - listitem [ref=e214]:
              - link "Kayit Ol" [ref=e215] [cursor=pointer]:
                - /url: /register
            - listitem [ref=e216]:
              - link "Yardım Merkezi" [ref=e217] [cursor=pointer]:
                - /url: /help
        - generic [ref=e218]:
          - paragraph [ref=e219]: Yasal
          - list [ref=e220]:
            - listitem [ref=e221]:
              - link "Gizlilik Politikası" [ref=e222] [cursor=pointer]:
                - /url: /privacy-policy
            - listitem [ref=e223]:
              - link "Çerez Politikası" [ref=e224] [cursor=pointer]:
                - /url: /cookie-policy
            - listitem [ref=e225]:
              - link "KVKK Aydınlatma" [ref=e226] [cursor=pointer]:
                - /url: /kvkk
            - listitem [ref=e227]:
              - link "Kullanım Koşulları" [ref=e228] [cursor=pointer]:
                - /url: /kullanim-kosullari
            - listitem [ref=e229]:
              - link "KVKK Başvuru" [ref=e230] [cursor=pointer]:
                - /url: /kvkk-basvuru
            - listitem [ref=e231]:
              - button "Çerez Ayarları" [ref=e232]
      - paragraph [ref=e234]: © 2026 UrGlowUp. Tum haklari saklidir.
  - dialog "Cookie Usage" [ref=e235]:
    - generic [ref=e237]:
      - generic [ref=e238]:
        - paragraph [ref=e239]: Cookie Usage
        - paragraph [ref=e240]:
          - text: We use cookies to keep the site secure, remember your language preference, and improve your experience. See our
          - link "Cookie Policy" [ref=e241] [cursor=pointer]:
            - /url: /cookie-policy
          - text: "&"
          - link "Privacy Policy" [ref=e242] [cursor=pointer]:
            - /url: /privacy-policy
          - text: .
      - generic [ref=e243]:
        - button "Necessary only" [ref=e244]
        - button "Manage preferences" [ref=e245]
        - button "Accept all" [ref=e246]
```

# Test source

```ts
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
  56  |   ).toBeVisible();
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
> 120 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
      |                                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  157 | 
  158 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  159 | 
  160 |   const panel = page.locator("#cookie-preferences-panel");
  161 |   // Both analytics and marketing toggles default to OFF — look for 2 Devre dışı buttons
  162 |   const disabledButtons = panel.getByRole("button", { name: "Devre dışı" });
  163 |   await expect(disabledButtons).toHaveCount(2);
  164 | });
  165 | 
  166 | test("manage preferences — toggling analytics changes button label to 'Etkin'", async ({
  167 |   page,
  168 | }) => {
  169 |   await freshVisit(page);
  170 | 
  171 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  172 | 
  173 |   const panel = page.locator("#cookie-preferences-panel");
  174 | 
  175 |   // First "Devre dışı" button corresponds to Analytics
  176 |   await panel.getByRole("button", { name: "Devre dışı" }).first().click();
  177 | 
  178 |   // After toggle, that button should now read "Etkin"
  179 |   await expect(panel.getByRole("button", { name: "Etkin" })).toHaveCount(1);
  180 | });
  181 | 
  182 | // ─────────────────────────────────────────────────────────────────────────────
  183 | // Save preferences
  184 | // ─────────────────────────────────────────────────────────────────────────────
  185 | 
  186 | test("save preferences — banner dismissed", async ({ page }) => {
  187 |   await freshVisit(page);
  188 | 
  189 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  190 |   await page.locator("#cookie-preferences-panel").getByRole("button", { name: "Tercihleri kaydet" }).click();
  191 | 
  192 |   const banner = page.getByRole("dialog", { name: "Çerez Kullanımı" });
  193 |   await expect(banner).not.toBeVisible();
  194 | });
  195 | 
  196 | test("save preferences (analytics ON, marketing OFF) — cookie reflects custom choice", async ({
  197 |   page,
  198 | }) => {
  199 |   await freshVisit(page);
  200 | 
  201 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
  202 | 
  203 |   const panel = page.locator("#cookie-preferences-panel");
  204 | 
  205 |   // Toggle analytics ON (first Devre dışı button = analytics row)
  206 |   await panel.getByRole("button", { name: "Devre dışı" }).first().click();
  207 | 
  208 |   // Save
  209 |   await panel.getByRole("button", { name: "Tercihleri kaydet" }).click();
  210 | 
  211 |   const value = await getConsentCookieValue(page);
  212 |   expect(value).toBe("v1:analytics=1,marketing=0");
  213 | });
  214 | 
  215 | test("save preferences (both OFF) — cookie is analytics=0,marketing=0", async ({
  216 |   page,
  217 | }) => {
  218 |   await freshVisit(page);
  219 | 
  220 |   await page.getByRole("button", { name: "Tercihleri yönet" }).click();
```