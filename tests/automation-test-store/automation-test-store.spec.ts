import { test, expect } from "@fixtures/base";
import { CartPage } from "../../src/business/pages/automation-test-store/cart.page";
import { ProductPage } from "../../src/business/pages/automation-test-store/product.page";
import { SearchResultsPage } from "../../src/business/pages/automation-test-store/search-results.page";
import { StorePage } from "../../src/business/pages/automation-test-store/store.page";

test.describe("Automation Test Store shopping cart", () => {
  let store: StorePage;
  let results: SearchResultsPage;
  let product: ProductPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    store = new StorePage(page);
    results = new SearchResultsPage(page);
    product = new ProductPage(page);
    cart = new CartPage(page);
    await store.goto();
  });

  test("[ATS-01] Search for a bronzer and add it to the cart", async () => {
    await store.fillSearch("bronzer");
    await store.submitSearch();
    await results.openProduct("Skinsheen Bronzer Stick");
    await product.addToCart();

    await expect(cart.product("Skinsheen Bronzer Stick")).toBeVisible();
  });

  for (const { item, productName } of [
    { item: "bronzer", productName: "Skinsheen Bronzer Stick" },
    { item: "shampoo", productName: "Curls to straight Shampoo" },
    { item: "cream", productName: "Total Moisture Facial Cream" },
  ]) {
    test(`[ATS-02] Change currency to euros and search for ${item}`, async () => {
      await store.openCurrencyMenu();
      await store.selectCurrency.euro();
      await expect(store.selectedEuro).toBeVisible();

      await store.fillSearch(item);
      await store.submitSearch();
      await results.openProduct(productName);
      await product.addToCart();

      await expect(cart.product(productName)).toBeVisible();
    });
  }

  test("[ATS-03] Display product prices in euros in search results and cart", async () => {
    await store.openCurrencyMenu();
    await store.selectCurrency.euro();
    await store.fillSearch("bronzer");
    await store.submitSearch();

    const euroPrice = /^\d+\.\d{2}€$/;
    await expect(results.bronzerPrice).toHaveText(euroPrice);
    const searchPrice = await results.bronzerPrice.innerText();

    await results.openProduct("Skinsheen Bronzer Stick");
    await product.addToCart();

    await expect(cart.unitPrice("Skinsheen Bronzer Stick")).toHaveText(euroPrice);
    await expect(cart.unitPrice("Skinsheen Bronzer Stick")).toHaveText(searchPrice);
  });
});
