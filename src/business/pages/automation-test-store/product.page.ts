import type { Page } from "@playwright/test";

export class ProductPage {
  constructor(private readonly page: Page) {}

  async addToCart() {
    await this.page.getByRole("link", { name: /Add to Cart$/ }).click();
  }
}
