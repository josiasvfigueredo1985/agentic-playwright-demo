import type { Page } from "@playwright/test";

export class CartPage {
  constructor(private readonly page: Page) {}

  product(name: string) {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("link", { name, exact: true }),
    });
  }

  unitPrice(name: string) {
    // The cart table's Unit Price is its fourth column.
    return this.product(name).getByRole("cell").nth(3);
  }
}
