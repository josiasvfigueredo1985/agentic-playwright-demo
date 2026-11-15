import type { Locator, Page } from "@playwright/test";

export class LanguageSettingsPage {
  readonly openLink: Locator;
  readonly saveButton: Locator;
  readonly select: { french: () => Promise<void> };

  constructor(private readonly page: Page) {
    this.openLink = page.getByRole("link", {
      name: /^Choose a language for shopping in Amazon Canada\./,
    });
    // The button label is localized as soon as a language is selected.
    this.saveButton = page.getByRole("button", {
      name: /^(Save changes|Enregistrer les modifications)\.?$/,
    });
    this.select = {
      french: async () => {
        // The native radio input is covered by a styled icon, so click its label.
        await this.page.getByText("français - FR", { exact: true }).click();
      },
    };
  }

  async open() {
    await this.openLink.click();
  }

  async save() {
    await this.saveButton.click();
  }
}
