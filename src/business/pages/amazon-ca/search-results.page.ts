import type { Locator, Page } from "@playwright/test";

export class SearchResultsPage {
  private readonly addToCartName = /^(Add to cart|Ajouter au panier)$/;
  readonly firstAvailableProduct: Locator;

  constructor(private readonly page: Page) {
    this.firstAvailableProduct = page
      .getByRole("listitem")
      .filter({
        has: page.getByRole("button", { name: this.addToCartName }),
      })
      .first();
  }

  /** Full name of the first result that has an enabled purchase action. */
  async availableProductName(): Promise<string> {
    const name = await this.firstAvailableProduct
      .getByRole("heading", { level: 2 })
      .innerText();
    return name.trim();
  }

  async addFirstAvailableProductToCart() {
    await this.firstAvailableProduct
      .getByRole("button", { name: this.addToCartName })
      .click();
  }
}
