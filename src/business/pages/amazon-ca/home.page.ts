import { errors, type Locator, type Page } from "@playwright/test";

export class AmazonHomePage {
  readonly searchBox: Locator;
  readonly interestNoticeContinue: Locator;

  constructor(private readonly page: Page) {
    this.searchBox = page.getByRole("searchbox", {
      name: /^(Search|Rechercher) Amazon\.ca$/,
    });
    this.interestNoticeContinue = page.getByRole("button", {
      name: "Continue Shopping",
    });
  }

  async goto() {
    await this.page.goto("/");
  }

  /** The notice is optional and can appear shortly after page load. */
  async dismissInterestNoticeIfShown() {
    try {
      await this.interestNoticeContinue.waitFor({
        state: "visible",
        timeout: 5_000,
      });
    } catch (error) {
      if (error instanceof errors.TimeoutError) return;
      throw error;
    }
    await this.interestNoticeContinue.click();
  }

  async fillSearch(term: string) {
    await this.searchBox.fill(term);
  }

  async submitSearch() {
    await this.searchBox.press("Enter");
  }
}
