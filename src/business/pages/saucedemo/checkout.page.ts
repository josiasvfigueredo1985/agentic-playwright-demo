import type { Locator, Page } from "@playwright/test";

export class CheckoutPage {
  readonly checkoutButton: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly zipCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.checkoutButton = page.getByRole("button", { name: "Checkout" });
    this.firstName = page.getByPlaceholder("First Name");
    this.lastName = page.getByPlaceholder("Last Name");
    this.zipCode = page.getByPlaceholder("Zip/Postal Code");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.finishButton = page.getByRole("button", { name: "Finish" });
    this.confirmation = page.getByRole("heading", {
      name: "Thank you for your order!",
    });
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async fillFirstName(value: string) {
    await this.firstName.fill(value);
  }

  async fillLastName(value: string) {
    await this.lastName.fill(value);
  }

  async fillZipCode(value: string) {
    await this.zipCode.fill(value);
  }

  async continueToOverview() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }
}
