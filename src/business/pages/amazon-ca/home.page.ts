import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly searchBox: Locator;
  readonly languageLink: Locator;
  readonly frenchSearchBox: Locator;

  constructor(private readonly page: Page) {
    this.frenchSearchBox = page.getByRole("searchbox", {
      name: "Rechercher Amazon.ca",
      exact: true,
    });
    this.searchBox = page.getByRole("searchbox", {
      name: /^(Search|Rechercher) Amazon\.ca$/,
    });
    this.languageLink = page.getByRole("link", {
      name: /^(Choose a language for shopping in Amazon Canada|Choisissez en quelle langue magasiner sur AmazonCanada)/,
    });
  }

  async goto() {
    await this.page.goto("/");
  }

  async search(term: string) {
    await this.searchBox.fill(term);
    await this.searchBox.press("Enter");
  }

  async openLanguageSettings() {
    await this.languageLink.click();
  }
}
