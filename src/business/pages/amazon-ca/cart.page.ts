import type { Locator, Page } from "@playwright/test";

export class CartPage {
  readonly headerLink: Locator;

  constructor(private readonly page: Page) {
    this.headerLink = page.getByRole("link", {
      name: /^\d+ (items? in cart|articles? dans le panier)/,
    });
  }

  async open() {
    await this.headerLink.click();
  }

  /** Matches the cart product title link; its name starts with the search result name. */
  product(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.page.getByRole("link", { name: new RegExp(`^${escaped}`) });
  }
}
