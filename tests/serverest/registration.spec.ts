import { test, expect } from '@playwright/test';

const API = 'https://serverest.dev';

test('[SR-01] Register a new user and log in', async ({ page, request }) => {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const name = `Synthetic User ${unique}`;
  const email = `synthetic.${unique}@example.com`;
  const password = `Pw${unique}`;

  try {
    // Given I am on the ServeRest login page
    await page.goto('/login');
    await expect(page.getByTestId('entrar')).toBeVisible();

    // When I open the registration form
    await page.getByTestId('cadastrar').click();
    await expect(page).toHaveURL(/\/cadastrarusuarios$/);

    // And I register a new non-administrator user with a unique email and password
    await page.getByTestId('nome').fill(name);
    await page.getByTestId('email').fill(email);
    await page.getByTestId('password').fill(password);
    await expect(page.getByTestId('checkbox')).not.toBeChecked();
    await page.getByTestId('cadastrar').click();

    // Then I should be signed in
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId('logout')).toBeVisible();

    // When I log out
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);

    // And I log in with the new user's email and password
    await page.getByTestId('email').fill(email);
    await page.getByTestId('senha').fill(password);
    await page.getByTestId('entrar').click();

    // Then I should be signed in on the home page
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByTestId('logout')).toBeVisible();
  } finally {
    const lookup = await request.get(`${API}/usuarios`, { params: { email } });
    await expect(lookup, 'Look up the synthetic account for cleanup').toBeOK();
    const { usuarios } = await lookup.json();
    expect(Array.isArray(usuarios), 'The user lookup must return a users list').toBe(true);
    for (const user of usuarios) {
      if (user.email === email) {
        const deletion = await request.delete(`${API}/usuarios/${user._id}`);
        await expect(deletion, 'Delete the synthetic account').toBeOK();
      }
    }
  }
});
