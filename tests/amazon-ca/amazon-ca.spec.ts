import { test, expect } from "@fixtures/network";
import { CartPage } from "../../src/business/pages/amazon-ca/cart.page";
import { AmazonHomePage } from "../../src/business/pages/amazon-ca/home.page";
import { LanguageSettingsPage } from "../../src/business/pages/amazon-ca/language-settings.page";
import { SearchResultsPage } from "../../src/business/pages/amazon-ca/search-results.page";

test.describe("Amazon Canada shopping cart", () => {
  let home: AmazonHomePage;
  let language: LanguageSettingsPage;
  let results: SearchResultsPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    home = new AmazonHomePage(page);
    language = new LanguageSettingsPage(page);
    results = new SearchResultsPage(page);
    cart = new CartPage(page);
    await home.goto();
    await home.dismissInterestNoticeIfShown();
  });

  test("[AM-01] Search for a notebook and add it to the cart", async () => {
    await home.fillSearch("notebook");
    await home.submitSearch();
    const productName = await results.availableProductName();
    await results.addFirstAvailableProductToCart();
    await cart.open();

    await expect(cart.product(productName)).toBeVisible();
  });

  for (const item of ["notebook", "laptop", "smartphone"]) {
    test(`[AM-02] Change language to French in Canadian Amazon and search for ${item}`, async () => {
      await expect(home.searchBox).toHaveAccessibleName("Search Amazon.ca");

      await language.open();
      await language.select.french();
      await language.save();

      await expect(home.searchBox).toHaveAccessibleName("Rechercher Amazon.ca", {
        timeout: 15_000,
      });

      await home.fillSearch(item);
      await home.submitSearch();
      const productName = await results.availableProductName();
      await results.addFirstAvailableProductToCart();
      await cart.open();

      await expect(cart.product(productName)).toBeVisible();
    });
  }
});
