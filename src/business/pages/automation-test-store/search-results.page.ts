import type { Page } from "@playwright/test";

export class SearchResultsPage {
  constructor(private readonly page: Page) {}

  get bronzerPrice() {
    return this.page
      .getByText(/Skinsheen Bronzer Stick\s+View\s+Write Review\s+[\d,.]+\s*€/i)
      .getByText(/^[\d,.]+\s*€$/);
  }

  async openProduct(name: string) {
    await this.page.getByRole("link", { name, exact: true }).click();
  }
}
