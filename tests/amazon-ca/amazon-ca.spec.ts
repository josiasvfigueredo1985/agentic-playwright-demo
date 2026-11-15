import { test, expect } from "@fixtures/network";
import { HomePage } from "../../src/business/pages/amazon-ca/home.page";
import { LanguageSettingsPage } from "../../src/business/pages/amazon-ca/language-settings.page";
import {
  CartPage,
  SearchResultsPage,
} from "../../src/business/pages/amazon-ca/search-results.page";

test.describe("Amazon Canada shopping cart", () => {
  let home: HomePage;
  let results: SearchResultsPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    results = new SearchResultsPage(page);
    cart = new CartPage(page);
    await home.goto();
  });

  test("[AM-01] Search for a notebook and add it to the cart", async () => {
    await home.search("notebook");
    const title = await results.addAvailableResultToCart();
    await cart.open();

    await expect(cart.item(title)).toBeVisible();
  });

  test("[AM-02] Change language to French in Canadian Amazon", async ({
    page,
  }) => {
    const language = new LanguageSettingsPage(page);

    await expect(home.frenchSearchBox).toHaveCount(0);
    await home.openLanguageSettings();
    await language.select("français - FR");

    await expect(home.frenchSearchBox).toBeVisible();

    await home.search("notebook");
    const title = await results.addAvailableResultToCart();
    await cart.open();

    await expect(cart.item(title)).toBeVisible();
  });
});
