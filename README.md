# Agentic Playwright Demo

A **spec-driven Playwright testing approach** where agents dynamically explore applications and generate test code without pre-built page objects.

## 🎯 Core Concept

**Traditional Playwright** relies on static page objects that couple tests to UI structure. When the application changes, maintainers must manually update locators.

**Agentic Approach** inverts this workflow:
- **Specs are source of truth** — BDD specifications define acceptance criteria
- **Agent explores live** — Uses `playwright-cli` to interact with the real application
- **Tests generated on-demand** — Agent creates test files from scratch, embedding discovered selectors
- **No page objects** — Tests adapt naturally when the UI changes

## ✅ Status

**Workflow Complete!** All 4 scenarios implemented and passing.

```
Running 4 tests using 1 worker

  ✓ Scenario 1: Valid login (964ms)
  ✓ Scenario 2: Locked-out user (893ms)
  ✓ Scenario 3: Catalog sorting (16.2s)
  ✓ Scenario 4: Complete checkout (1.0s)

  4 passed (20.3s) — Exit Code: 0 ✅
```

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # v18+
npm --version
```

### Setup (First Time)

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

### Run Tests

```bash
# Execute all tests
npm test

# View interactive report (after tests complete)
npx playwright show-report artifacts/reports/playwright-report
```

## 📁 Project Structure

```
agentic-playwright-demo/
├── specs/
│   └── saucedemo.spec.md              # BDD specifications (4 scenarios)
├── tests/
│   └── saucedemo.spec.ts              # Agent-generated tests (no page objects)
├── artifacts/                         # Generated output (git-ignored)
│   ├── reports/
│   │   └── playwright-report/         # HTML test results
│   └── evidence/
│       └── test-results/              # Screenshots, traces on failure
├── .github/skills/
│   ├── playwright-cli/                # Browser automation CLI
│   └── spec-driven-playwright/        # Agentic workflow guide
├── playwright.config.ts               # Test configuration
├── package.json                       # Dependencies
└── README.md                          # This file
```

See [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) for detailed directory purposes.

## 📋 Test Scenarios

All 4 scenarios test the **live Sauce Demo site** (`https://www.saucedemo.com`) in standard Gherkin format:

### Scenario 1: Valid login with standard credentials ✅
```gherkin
Given I am on the Sauce Demo login page
When I enter username "standard_user"
And I enter password "secret_sauce"
And I click the Login button
Then I should be authenticated
And I should be redirected to the inventory page
```
**Status:** PASS (964ms)

### Scenario 2: Login attempt with locked-out user ✅
```gherkin
Given I am on the Sauce Demo login page
When I enter username "locked_out_user"
And I enter password "secret_sauce"
And I click the Login button
Then I should remain on the login page
And I should see the error message "Epic sadface: Sorry, this user has been locked out."
```
**Status:** PASS (893ms)

### Scenario 3: Sort products by price ascending ✅
```gherkin
Given I am authenticated as "standard_user"
And I am viewing the product catalog
When I sort the products by "Price (low to high)"
Then the first product should be "Sauce Labs Onesie"
And the price should be "$7.99"
```
**Status:** PASS (16.2s)

### Scenario 4: Complete end-to-end checkout flow ✅
```gherkin
Given I am authenticated as "standard_user"
And I am viewing the product catalog
When I add "Sauce Labs Backpack" to the cart
And I open the shopping cart
And I proceed to checkout
And I enter the following information:
  | field      | value  |
  | first name | John   |
  | last name  | Doe    |
  | zip code   | 12345  |
And I complete the purchase
Then I should see the confirmation message "Thank you for your order!"
And I should be on the order complete page
```
**Status:** PASS (1.0s)

## 🔍 How It Works

### 1. Read Specs
Agent parses `specs/saucedemo.spec.md` and extracts BDD scenarios.

### 2. Explore Live
Agent uses `playwright-cli` to:
```bash
playwright-cli open https://www.saucedemo.com
playwright-cli snapshot                    # Capture page state
playwright-cli find "Login"                # Find elements
playwright-cli fill "[data-test=username]" "standard_user"
playwright-cli click "[data-test=login-button]"
```

### 3. Generate Tests
Agent discovers locators and creates `tests/saucedemo.spec.ts`:
```javascript
test('Scenario 1: Valid login', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/inventory\.html$/);
});
```

### 4. Validate
Agent runs `npm test` and fixes failures until exit code 0.

## 🛠️ Commands Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --grep "login"` | Run tests matching pattern |
| `npx playwright show-report` | View HTML test report |
| `npx playwright test --ui` | Run in UI mode (interactive) |

## 🔗 Discovered Locators

Agent discovered these `data-test` attributes during exploration:

```javascript
// Login form
[data-test="username"]
[data-test="password"]
[data-test="login-button"]

// Inventory/Products
[data-test="product-sort-container"]
[data-test="inventory-item"]
[data-test="add-to-cart-sauce-labs-backpack"]

// Cart & Checkout
[data-test="shopping-cart-link"]
[data-test="checkout"]
[data-test="firstName"]
[data-test="lastName"]
[data-test="postalCode"]
[data-test="continue"]
[data-test="finish"]
```

## 📚 Key Design Decisions

| Decision | Rationale | Result |
|----------|-----------|--------|
| **No page objects** | Prevents coupling to UI | Tests adapt naturally to changes |
| **Specs as contract** | BDD ensures shared criteria | All 4 scenarios validated |
| **Live site testing** | Tests real behavior | 20.3s against www.saucedemo.com |
| **Agent-generated** | Fresh code each run | No stale selectors or brittle tests |
| **Centralized artifacts** | Clean project root | All output in `artifacts/` (git-ignored) |

## 🐛 Troubleshooting

**Tests fail after site changes**
→ Agent re-explores and regenerates tests automatically. No manual page-object updates needed.

**Selector not found**
→ Agent uses `playwright-cli snapshot` to inspect and adjust locators. If a selector doesn't match, re-run exploration.

**Timeout or slow tests**
→ Adjust `timeout` in `playwright.config.ts` (default: 30s). Current suite: ~20s.

## 📖 Documentation

- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) — Directory purposes and conventions
- [specs/saucedemo.spec.md](specs/saucedemo.spec.md) — BDD specifications
- [tests/saucedemo.spec.ts](tests/saucedemo.spec.ts) — Generated test file
- [.github/skills/playwright-cli/SKILL.md](.github/skills/playwright-cli/SKILL.md) — CLI tool reference
- [.github/skills/spec-driven-playwright/SKILL.md](.github/skills/spec-driven-playwright/SKILL.md) — Agentic workflow guide
- [Playwright Docs](https://playwright.dev) — Official documentation

## 🎓 Learn More

This project demonstrates how **agentic testing** eliminates manual maintenance:

1. **Specs drive development** — Not hand-written test templates
2. **Live exploration** — Agent discovers real UI before writing code
3. **No coupling** — Tests aren't tied to page objects
4. **Adaptive** — When the site changes, agent regenerates tests

Perfect for teams that want reliable, maintainable Playwright suites without the overhead of page-object maintenance.

---

**Ready to test?** Run `npm test` to execute all scenarios against the live Sauce Demo site. ✅


