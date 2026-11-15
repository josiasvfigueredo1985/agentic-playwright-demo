import { expect, type Locator, type Page } from "@playwright/test";

export class LanguageSettingsPage {
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.saveButton = page.getByRole("button", {
      name: /^(Save changes|Enregistrer les modifications)\.?$/,
    });
  }

  language(name: string): Locator {
    return this.page.getByRole("radio", { name });
  }

  async select(name: string) {
    await this.page.getByText(name, { exact: true }).click();
    await expect(this.language(name)).toBeChecked();
    await this.saveButton.click();
  }
}
