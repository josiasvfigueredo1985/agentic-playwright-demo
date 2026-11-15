import type { Locator, Page } from "@playwright/test";

export class StorePage {
  readonly selectedEuro: Locator;

  constructor(private readonly page: Page) {
    this.selectedEuro = page.getByText("€ Euro", { exact: true }).filter({
      visible: true,
    });
  }

  async goto() {
    await this.page.goto("/");
  }

  async openCurrencyMenu() {
    await this.page
      .getByText("$ US Dollar", { exact: true })
      .filter({ visible: true })
      .hover();
  }

  readonly selectCurrency = {
    euro: async () => {
      await this.page.getByRole("link", { name: "€ Euro", exact: true }).click();
    },
  };

  async fillSearch(item: string) {
    await this.page.getByRole("textbox", { name: "Search Keywords" }).fill(item);
  }

  async submitSearch() {
    await this.page.getByRole("textbox", { name: "Search Keywords" }).press("Enter");
  }
}
