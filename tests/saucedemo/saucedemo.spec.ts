import { test, expect } from "@fixtures/base";
import { CheckoutPage } from "../../src/business/pages/saucedemo/checkout.page";
import { InventoryPage } from "../../src/business/pages/saucedemo/inventory.page";
import { LoginPage } from "../../src/business/pages/saucedemo/login.page";

test.describe("Sauce Demo E-commerce Application", () => {
  let login: LoginPage;
  let inventory: InventoryPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    inventory = new InventoryPage(page);
    checkout = new CheckoutPage(page);
    await login.goto();
  });

  test("[SL-01] Valid login with standard credentials", async ({ page }) => {
    await login.fillUsername("standard_user");
    await login.fillPassword("secret_sauce");
    await login.clickLogin();

    await expect(inventory.title).toHaveText("Products");
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  test("[SL-02] Login attempt with locked-out user", async ({ page }) => {
    await login.fillUsername("locked_out_user");
    await login.fillPassword("secret_sauce");
    await login.clickLogin();

    await expect(page).not.toHaveURL(/\/inventory\.html$/);
    await expect(login.loginButton).toBeVisible();
    await expect(login.error).toHaveText(
      "Epic sadface: Sorry, this user has been locked out.",
    );
  });

  test("[SL-03] Sort products by price ascending", async () => {
    await login.loginAs("standard_user");
    await expect(inventory.title).toHaveText("Products");

    await inventory.sortBy("Price (low to high)");

    const first = inventory.items.first();
    await expect(first.getByTestId("inventory-item-name")).toHaveText(
      "Sauce Labs Onesie",
    );
    await expect(first.getByTestId("inventory-item-price")).toHaveText("$7.99");
  });

  test("[SL-04] Complete end-to-end checkout flow", async ({ page }) => {
    await login.loginAs("standard_user");
    await expect(inventory.title).toHaveText("Products");

    await inventory.addToCart("Sauce Labs Backpack");
    await inventory.addToCart("Sauce Labs Bike Light");
    await inventory.openCart();
    await checkout.proceedToCheckout();
    await checkout.fillFirstName("John");
    await checkout.fillLastName("Doe");
    await checkout.fillZipCode("12345");
    await checkout.continueToOverview();
    await checkout.finish();

    await expect(checkout.confirmation).toBeVisible();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
  });
});
