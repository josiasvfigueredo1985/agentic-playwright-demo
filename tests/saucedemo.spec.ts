import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.saucedemo.com';

test.describe('Sauce Demo Functional Specifications', () => {
  test('[SL-01] Valid login', async ({ page }) => {
    // Given: user is on the login page
    await page.goto(`${BASE_URL}/`);
    
    // When: user enters standard_user and secret_sauce and submits
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    
    // Then: user is authenticated and navigates to /inventory.html
    await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('[SL-02] Locked-out user', async ({ page }) => {
    // Given: user is on the login page
    await page.goto(`${BASE_URL}/`);
    
    // When: user enters locked_out_user and secret_sauce and submits
    await page.locator('[data-test="username"]').fill('locked_out_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    
    // Then: user remains on login page and error message is displayed
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.locator('text=Epic sadface: Sorry, this user has been locked out.')).toBeVisible();
  });

  test('[SL-03] Catalog sorting', async ({ page }) => {
    // Given: standard_user is authenticated and product catalog is displayed
    await page.goto(`${BASE_URL}/`);
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
    
    // When: user sorts products by "Price (low to high)"
    await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
    await page.waitForLoadState('networkidle');
    
    // Then: first product is "Sauce Labs Onesie" with price $7.99
    const firstProductItem = page.locator('[data-test="inventory-item"]').first();
    await expect(firstProductItem.locator('text=Sauce Labs Onesie')).toBeVisible();
    await expect(firstProductItem.locator('text=$7.99')).toBeVisible();
  });

  test('[SL-04] Complete checkout', async ({ page }) => {
    // Given: standard_user is authenticated and product catalog is displayed
    await page.goto(`${BASE_URL}/`);
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
    
    // When: user adds "Sauce Labs Backpack" to cart
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    
    // And: opens cart and starts checkout
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/cart.html`);
    await page.locator('[data-test="checkout"]').click();
    
    // And: enters first name, last name, and ZIP code
    await expect(page).toHaveURL(`${BASE_URL}/checkout-step-one.html`);
    await page.locator('[data-test="firstName"]').fill('John');
    await page.locator('[data-test="lastName"]').fill('Doe');
    await page.locator('[data-test="postalCode"]').fill('12345');
    await page.locator('[data-test="continue"]').click();
    
    // And: reviews the order and completes purchase
    await expect(page).toHaveURL(`${BASE_URL}/checkout-step-two.html`);
    await page.locator('[data-test="finish"]').click();
    
    // Then: page displays "Thank you for your order!"
    await expect(page).toHaveURL(`${BASE_URL}/checkout-complete.html`);
    await expect(page.locator('text=Thank you for your order!')).toBeVisible();
  });
});
