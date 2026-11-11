import { test, expect, Page } from '@playwright/test';

async function login(page: Page, username: string, password = 'secret_sauce') {
  await page.goto('/');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-button').click();
}

test('[SL-01] Valid login with standard credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill('standard_user');
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('login-button').click();

  await expect(page.getByTestId('inventory-container')).toBeVisible();
  await expect(page).toHaveURL(/\/inventory\.html$/);
});

test('[SL-02] Login attempt with locked-out user', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill('locked_out_user');
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('login-button').click();

  await expect(page.getByTestId('login-button')).toBeVisible();
  await expect(page).not.toHaveURL(/inventory/);
  await expect(page.getByTestId('error')).toHaveText(
    'Epic sadface: Sorry, this user has been locked out.',
  );
});

test('[SL-03] Sort products by price ascending', async ({ page }) => {
  await login(page, 'standard_user');
  await expect(page.getByTestId('inventory-container')).toBeVisible();

  await page.getByTestId('product-sort-container').selectOption({ label: 'Price (low to high)' });

  const firstItem = page.getByTestId('inventory-item').first();
  await expect(firstItem.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Onesie');
  await expect(firstItem.getByTestId('inventory-item-price')).toHaveText('$7.99');
});

test('[SL-04] Complete end-to-end checkout flow', async ({ page }) => {
  await login(page, 'standard_user');
  await expect(page.getByTestId('inventory-container')).toBeVisible();

  await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
  await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();
  await page.getByTestId('shopping-cart-link').click();
  await page.getByTestId('checkout').click();

  await page.getByTestId('firstName').fill('John');
  await page.getByTestId('lastName').fill('Doe');
  await page.getByTestId('postalCode').fill('12345');
  await page.getByTestId('continue').click();
  await page.getByTestId('finish').click();

  await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  await expect(page).toHaveURL(/\/checkout-complete\.html$/);
});
