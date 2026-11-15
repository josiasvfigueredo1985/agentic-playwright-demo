import { test, expect } from "@fixtures/network";
import { LoginPage } from "../../src/business/pages/saucedemo/login.page";
import { InventoryPage } from "../../src/business/pages/saucedemo/inventory.page";
import {
  CartPage,
  CheckoutPage,
} from "../../src/business/pages/saucedemo/checkout.page";

test.describe("Sauce Demo E-commerce Application", () => {
  let login: LoginPage;
  let inventory: InventoryPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    inventory = new InventoryPage(page);
    await login.goto();
  });

  test("[SL-01] Valid login with standard credentials", async ({ page }) => {
    await login.username.fill("standard_user");
    await login.password.fill("secret_sauce");
    await login.loginButton.click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.title).toHaveText("Products");
  });

  test("[SL-02] Login attempt with locked-out user", async ({ page }) => {
    await login.username.fill("locked_out_user");
    await login.password.fill("secret_sauce");
    await login.loginButton.click();

    await expect(login.loginButton).toBeVisible();
    await expect(page).not.toHaveURL(/inventory/);
    await expect(login.error).toHaveText(
      "Epic sadface: Sorry, this user has been locked out.",
    );
  });

  test("[SL-03] Sort products by price ascending", async () => {
    await login.login("standard_user", "secret_sauce");
    await expect(inventory.title).toHaveText("Products");

    await inventory.sortBy("Price (low to high)");

    const first = inventory.items.first();
    await expect(inventory.itemName(first)).toHaveText("Sauce Labs Onesie");
    await expect(inventory.itemPrice(first)).toHaveText("$7.99");
  });

  test("[SL-04] Complete end-to-end checkout flow", async ({ page }) => {
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await login.login("standard_user", "secret_sauce");
    await expect(inventory.title).toHaveText("Products");

    await inventory.addToCart("Sauce Labs Backpack");
    await inventory.addToCart("Sauce Labs Bike Light");
    await inventory.openCart();
    await cart.proceedToCheckout();
    await checkout.enterInformation({
      firstName: "John",
      lastName: "Doe",
      zipCode: "12345",
    });
    await checkout.complete();

    await expect(checkout.confirmation).toBeVisible();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
  });
});
