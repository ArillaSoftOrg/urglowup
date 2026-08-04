import { expect, test } from "@playwright/test";

test.use({ locale: "tr-TR" });

test("unclaimed business profile offers a verified removal request flow", async ({
  page,
}) => {
  await page.goto("/b/kuafr-onur-dvenli");

  const removalLink = page.getByRole("link", {
    name: "Bu sayfanın kaldırılmasını iste",
    exact: true,
  });
  await expect(removalLink).toBeVisible();
  await expect(removalLink).toHaveAttribute(
    "href",
    /\/remove-business\?businessId=.+/,
  );

  await removalLink.click();
  await expect(page).toHaveURL(
    /\/login\?redirect_url=%2Fremove-business%3FbusinessId%3D/,
  );
});
