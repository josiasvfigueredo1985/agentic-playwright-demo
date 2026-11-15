import type { Locator, Page } from "@playwright/test";

export class CartPage {
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.checkoutButton = page.getByRole("button", { name: "Checkout" });
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly zipCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.firstName = page.getByRole("textbox", { name: "First Name" });
    this.lastName = page.getByRole("textbox", { name: "Last Name" });
    this.zipCode = page.getByRole("textbox", { name: "Zip/Postal Code" });
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.finishButton = page.getByRole("button", { name: "Finish" });
    this.confirmation = page.getByRole("heading", {
      name: "Thank you for your order!",
    });
  }

  async enterInformation(info: {
    firstName: string;
    lastName: string;
    zipCode: string;
  }) {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.zipCode.fill(info.zipCode);
    await this.continueButton.click();
  }

  async complete() {
    await this.finishButton.click();
  }
}
