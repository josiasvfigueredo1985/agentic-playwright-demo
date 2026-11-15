import type { Locator, Page } from "@playwright/test";

export class InventoryPage {
  readonly title: Locator;
  readonly sortSelect: Locator;
  readonly items: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId("title");
    this.sortSelect = page.getByTestId("product-sort-container");
    this.items = page.getByTestId("inventory-item");
    this.cartLink = page.getByTestId("shopping-cart-link");
  }

  item(name: string): Locator {
    return this.items.filter({
      has: this.page
        .getByTestId("inventory-item-name")
        .getByText(name, { exact: true }),
    });
  }

  async sortBy(option: string) {
    await this.sortSelect.selectOption({ label: option });
  }

  async addToCart(name: string) {
    await this.item(name).getByRole("button", { name: "Add to cart" }).click();
  }

  async openCart() {
    await this.cartLink.click();
  }
}
