import { test, expect } from '../fixtures/network';

test('Add location, search for a pizza and add it to the cart', async ({ page }) => {
  // Given I open the Domino's Brasil home page
  await page.goto('/');
  await expect(page).toHaveURL(/\/tabs\/home$/);

  // And I accept the cookies
  await page.getByRole('button', { name: 'Aceitar todos' }).click();
  await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeHidden();

  // And I select my location
  await page.getByText('Selecione a localização').click();
  await expect(page.getByRole('textbox', { name: 'CEP' })).toBeVisible();

  // When I set my delivery location with the following address:
  await page.getByRole('textbox', { name: 'CEP' }).fill('30130-003');
  await page.getByRole('textbox', { name: 'Número' }).fill('123');

  // And I confirm my delivery location
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Avenida Afonso Pena, 123')).toBeVisible();

  // And I search for the pizza "Calabresa"
  await page.getByRole('link', { name: 'Menu' }).click();
  await expect(page).toHaveURL(/\/tabs\/menu$/);
  await page.getByRole('group').filter({ hasText: 'Pizzas' }).first().click();
  const pizza = page.getByRole('heading', { name: 'Calabresa', exact: true });
  await expect(pizza).toBeVisible();

  // And I add the pizza "Calabresa" to the cart
  await pizza.click();
  await expect(page).toHaveURL(/\/product-details\/CALABR$/);
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await page.getByRole('img', { name: 'botão fechar' }).click();

  // Then the cart should contain the pizza "Calabresa"
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Calabresa', exact: true })).toBeVisible();
});
