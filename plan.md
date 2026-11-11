Act as a Senior QA Engineer specializing in Spec-Driven Testing (SDD) and Playwright automation. Create a complete automated test suite from scratch for the Sauce Labs Demo (`https://saucedemo.com`), following these exact steps in the terminal and workspace:

### Phase 1: Project Setup and Playwright CLI
1. Initialize a Node.js project (`npm init -y`), install Playwright Test (`npm install -D @playwright/test @types/node`), and install the required browser (`npx playwright install chromium`).
2. Install the Playwright CLI globally (`npm install -g @playwright/cli@latest`) and install its native skills (`playwright-cli install --skills`).
3. Ensure the skills installed by `playwright-cli` are accessible in `.github/skills/playwright-cli/` so GitHub Copilot can recognize them natively.
4. Create `playwright.config.ts`, configured to run in Chromium, with `baseURL: 'https://saucedemo.com'`, `testIdAttribute: 'data-test'`, screenshots on failure, and an HTML report.

### Phase 2: Creating the Spec-Driven Skill
5. Create `.github/skills/spec-driven-playwright/SKILL.md` with clear instructions to:
   - Read specifications in `specs/*.spec.md`.
   - Explore and validate scenarios in a real browser using `playwright-cli open`, `playwright-cli snapshot`, and interaction commands before writing code.
   - Generate clean test files in `tests/*.spec.ts` using the Page Object Model (POM) or resilient selectors (`getByTestId`, `getByRole`, `getByPlaceholder`).
   - Run `npx playwright test` to verify that the suite passes, then close the session with `playwright-cli close`.

### Phase 3: Functional Specification (Spec)
6. Create `specs/saucedemo.spec.md`, detailing the acceptance criteria in BDD (Given/When/Then) format for:
   - **Scenario 1 (Valid login):** Authenticate with `standard_user` / `secret_sauce` and verify the redirect to `/inventory.html`.
   - **Scenario 2 (Locked-out user):** Attempt to log in with `locked_out_user` / `secret_sauce` and verify the lockout message.
   - **Scenario 3 (Catalog sorting):** Log in, sort products by "Price (low to high)", and verify that the first item is the cheapest ($7.99).
   - **Scenario 4 (Complete E2E checkout flow):** Add "Sauce Labs Backpack" to the cart, go to the cart, check out by entering a first name, last name, and ZIP code, complete the purchase, and verify "Thank you for your order!".

### Phase 4: Live Execution and Suite Generation
7. Follow the skill you just created: use `playwright-cli` in the terminal to open `https://saucedemo.com`, inspect the actual elements using snapshots, and validate the flows.
8. Create the Page Objects structure in `pages/` (e.g., `LoginPage.ts`, `InventoryPage.ts`, `CartPage.ts`, `CheckoutPage.ts`) and the test suite in `tests/saucedemo.spec.ts`.
9. Run `npx playwright test` in the terminal, fixing any failures until 100% of the tests pass. Close the CLI browser (`playwright-cli close`) and present the final file structure.

