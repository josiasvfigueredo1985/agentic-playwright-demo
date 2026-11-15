import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder("Username");
    this.password = page.getByPlaceholder("Password");
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.error = page.getByTestId("error");
  }

  async goto() {
    await this.page.goto("/");
  }

  async fillUsername(username: string) {
    await this.username.fill(username);
  }

  async fillPassword(password: string) {
    await this.password.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  /** Precondition helper for scenarios that only need an authenticated user. */
  async loginAs(username: string, password = "secret_sauce") {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }
}
