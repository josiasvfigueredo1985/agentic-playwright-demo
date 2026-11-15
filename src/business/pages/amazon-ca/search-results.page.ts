import type { Locator, Page } from "@playwright/test";

export class SearchResultsPage {
  readonly availableResult: Locator;

  constructor(private readonly page: Page) {
    this.availableResult = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading") })
      .filter({
        has: page.getByRole("button", {
          name: /^(Add to cart|Ajouter au panier)$/,
        }),
      });
  }

  /** Adds the first result with an enabled purchase action and returns its title. */
  async addAvailableResultToCart(): Promise<string> {
    const result = this.availableResult.first();
    const title = (await result.getByRole("heading").first().innerText()).trim();
    await result
      .getByRole("button", { name: /^(Add to cart|Ajouter au panier)$/ })
      .click();
    return title;
  }
}

export class CartPage {
  readonly goToCartLink: Locator;

  constructor(private readonly page: Page) {
    this.goToCartLink = page.getByRole("link", {
      name: /^(Go to cart|Aller au panier)$/,
    });
  }

  /** Opens the cart from the confirmation shown after adding a product. */
  async open() {
    await this.goToCartLink.click();
  }

  item(title: string): Locator {
    return this.page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: this.page.getByRole("heading", { name: title }) });
  }
}
