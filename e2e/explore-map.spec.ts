import { expect, test, type Page } from "@playwright/test";

test.use({ locale: "tr-TR" });

async function waitForLocationControlHydration(page: Page) {
  await page
    .locator('[data-location-control-hydrated="true"]')
    .waitFor({ state: "visible" });
}

test("legacy map route preserves filters and redirects to explore map view", async ({
  page,
}) => {
  await page.goto("/map?city=Antalya&q=kuafor");

  await expect(page).toHaveURL(
    /\/explore\?(?=.*city=Antalya)(?=.*q=kuafor)(?=.*view=map)/,
  );
  await expect(
    page.getByRole("link", { name: "Harita", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("list and map views preserve active discovery filters", async ({ page }) => {
  await page.goto("/explore?city=Antalya");

  const mapLink = page.getByRole("link", { name: "Harita", exact: true });
  await expect(mapLink).toHaveAttribute(
    "href",
    "/explore?city=Antalya&view=map",
  );
  await mapLink.click();

  await expect(page).toHaveURL(/\/explore\?city=Antalya&view=map/);
  await expect(
    page.getByRole("link", { name: "Liste", exact: true }),
  ).toHaveAttribute("href", "/explore?city=Antalya");
  await expect(
    page.getByRole("button", { name: "Konumumu kullan" }),
  ).toBeVisible();
});

test("location control reports successful positioning", async ({ page }) => {
  await page.goto("/explore?view=map");
  await waitForLocationControlHydration(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              accuracy: 20,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              latitude: 36.8969,
              longitude: 30.7133,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          } as GeolocationPosition),
      },
    });
  });
  await page.getByRole("button", { name: "Konumumu kullan" }).click();

  await expect(
    page.getByText(
      "Konumunuz kullanılıyor. Harita yakınınızdaki alana taşındı.",
    ),
  ).toBeVisible();
});

test("location denial keeps city discovery available", async ({ page }) => {
  await page.goto("/explore?view=map");
  await waitForLocationControlHydration(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) =>
          error({
            code: 1,
            message: "Permission denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      },
    });
  });
  await page.getByRole("button", { name: "Konumumu kullan" }).click();

  await expect(
    page.getByText(
      "Konum izni verilmedi. Şehir veya ilçe seçerek devam edebilirsiniz.",
    ),
  ).toBeVisible();
  await expect(page.locator("select").first()).toBeEnabled();
});
