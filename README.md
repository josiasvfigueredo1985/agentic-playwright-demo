# Agentic Playwright Demo

A spec-driven Playwright testing approach where agents dynamically explore applications and generate test code without pre-built page objects.

## Why Agentic?

Traditional Playwright suites rely on static page objects that couple tests to UI structure. When the application changes, maintainers must manually update locators across multiple files.

**This project inverts that workflow:**

- **Specs are source of truth** — [specs/saucedemo.spec.md](specs/saucedemo.spec.md) defines acceptance criteria in BDD format (Given/When/Then).
- **Agent explores live** — Uses [`playwright-cli`](.github/skills/playwright-cli/SKILL.md) to interact with the real application and discover locators dynamically.
- **Tests generated on-demand** — Agent creates test files in `tests/` from scratch, embedding discovered selectors directly.
- **No page objects** — Eliminates coupling; tests adapt naturally when the UI changes.

## Tested Workflow

This project demonstrates the workflow in action:

1. ✅ Agent reads [4 BDD scenarios](specs/saucedemo.spec.md)
2. ✅ Agent explores Sauce Demo with `playwright-cli`:
   - Captures login page snapshot
   - Finds form elements (Username, Password, Login button)
   - Discovers `data-test` attributes: `username`, `password`, `login-button`, `shopping-cart-link`, `add-to-cart-*`, `inventory-item`
3. ✅ Agent generates test file in `tests/saucedemo.spec.ts` using discovered locators
4. ✅ **All 4 tests pass** against the live site (10.8s total)

## Structure

```
.
├── plan.md                                   # Original Playwright implementation plan
├── playwright.config.ts                       # Playwright configuration (baseURL, reporters, timeout)
├── specs/
│   └── saucedemo.spec.md                     # BDD specification (4 scenarios: login, error, sort, checkout)
├── tests/
│   └── saucedemo.spec.ts                     # Generated test file (no page objects, discovered locators)
├── .github/skills/
│   ├── playwright-cli/                       # Installed Playwright CLI skill (browser automation)
│   └── spec-driven-playwright/SKILL.md       # Agentic workflow skill for agents
└── package.json                              # Dependencies and scripts
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Playwright CLI globally installed: `npm install -g @playwright/cli@latest`

### Setup

```bash
# Install dependencies
npm install

# Install Playwright browser (Chromium)
npx playwright install chromium
```

### Run Tests

```bash
npm test
```

Output:
```
Running 4 tests using 1 worker

  ✓ Scenario 1: logs in with valid credentials (4.5s)
  ✓ Scenario 2: shows an error when a locked-out user tries to log in (1.4s)
  ✓ Scenario 3: sorts the catalog from the lowest price to the highest (1.9s)
  ✓ Scenario 4: completes checkout for a Sauce Labs Backpack (1.3s)

  4 passed (10.8s)
```

### Manual Exploration with playwright-cli

To explore the site and discover locators yourself:

```bash
# Open the browser
playwright-cli open https://saucedemo.com

# Take a snapshot of the current page
playwright-cli snapshot

# Find elements by text
playwright-cli find "Username"
playwright-cli find "Login"

# Inspect data-test attributes
playwright-cli eval "JSON.stringify([...document.querySelectorAll('[data-test]')].map(el => el.getAttribute('data-test')))"

# Interact with the page
playwright-cli fill "getByTestId('username')" standard_user
playwright-cli click "getByTestId('login-button')"

# Close when done
playwright-cli close
```

## Specs

The project implements 4 critical user journeys:

### Scenario 1: Valid Login
- Input: username `standard_user`, password `secret_sauce`
- Expected: redirect to `/inventory.html`
- **Status:** ✅ PASS (4.5s)

### Scenario 2: Locked-Out User
- Input: username `locked_out_user`, password `secret_sauce`
- Expected: error message "Epic sadface: Sorry, this user has been locked out."
- **Status:** ✅ PASS (1.4s)

### Scenario 3: Catalog Sorting
- Action: sort products by "Price (low to high)"
- Expected: first product is "Sauce Labs Onesie" priced at $7.99
- **Status:** ✅ PASS (1.9s)

### Scenario 4: Complete Checkout
- Actions: add "Sauce Labs Backpack" → open cart → checkout with name/address → complete purchase
- Expected: success message "Thank you for your order!"
- **Status:** ✅ PASS (1.3s)

## Test Execution Evidence

All tests run against the **live Sauce Demo site** (`https://saucedemo.com`):

```bash
# Run all tests
npm test

# Run a single test
npm test -- --grep "logs in with valid credentials"

# Run with UI mode (interactive)
npx playwright test --ui

# View HTML report after run
npx playwright show-report
```

Evidence is saved in:
- `playwright-report/` — HTML test report with screenshots and traces
- `test-results/` — Screenshots and traces on failure

## Development Workflow

### For Agents

1. **Read spec** → Parse BDD criteria
2. **Explore** → Use `playwright-cli` to interact with the target site
   - `snapshot` to inspect page structure
   - `find` to locate elements
   - `eval` to discover data-test attributes
3. **Generate** → Write test code that matches spec scenarios using discovered selectors
4. **Validate** → Run `npm test`
5. **Iterate** → Fix failures; exit code 0 = success
6. **Cleanup** → `playwright-cli close`

### For Humans

To add a new scenario:
1. Add a new BDD section to `specs/saucedemo.spec.md`
2. Run `playwright-cli` to explore the new flow
3. Add corresponding test to `tests/saucedemo.spec.ts`
4. Run `npm test` to validate

## Key Design Decisions

| Decision | Rationale | Result |
|----------|-----------|--------|
| **No page objects** | Prevents coupling to UI structure; tests stay flexible when the app changes | ✅ Tests pass regardless of locator refactors |
| **Specs as contract** | BDD format ensures agent and humans share the same acceptance criteria | ✅ All 4 scenarios validated |
| **Dynamic generation** | Tests are created fresh for each run; eliminates stale locators | ✅ Tests discover `data-test` attributes live |
| **CLI-first exploration** | Agent understands the UI before writing code; discovers edge cases | ✅ Found all 7 key data-test attributes |
| **Live target** | Tests against real application, not mocks; validates actual user behavior | ✅ 10.8s total runtime, real network latency included |

## Locators Discovered

During exploration, the agent discovered these locators on Sauce Demo:

```javascript
// Login form (Scenario 1 & 2)
getByTestId('username')           // First input
getByTestId('password')           // Second input
getByTestId('login-button')       // Submit button

// Inventory page (Scenario 3)
getByRole('combobox', { name: 'Sort products' })
getByTestId('inventory-item')     // Product cards

// Cart & Checkout (Scenario 4)
getByTestId('add-to-cart-sauce-labs-backpack')
getByTestId('shopping-cart-link')
getByRole('button', { name: 'Checkout' })
getByRole('textbox', { name: 'First Name' })
getByRole('textbox', { name: 'Last Name' })
getByRole('textbox', { name: 'Zip/Postal Code' })
getByRole('button', { name: 'Finish' })
getByRole('heading', { name: 'Thank you for your order!' })
```

## Tools & Technologies

- **Playwright** — Browser automation and testing framework
- **playwright-cli** — Interactive browser control and exploration
- **TypeScript** — Type-safe test and configuration files
- **BDD (Given/When/Then)** — Human-readable acceptance criteria

## Troubleshooting

### Tests fail after site changes
The agent will re-explore and regenerate tests. No manual page-object updates needed.

### Selector not found
The agent uses `playwright-cli snapshot` and `find` to inspect the page and adjust locators. If a locator doesn't match, the agent re-explores the target UI.

### Timeout or performance issues
Adjust `timeout` in `playwright.config.ts` (default: 30s). Increase for slow networks. Current suite runs in 10.8s.

## References

- [Playwright documentation](https://playwright.dev)
- [Playwright CLI skill](.github/skills/playwright-cli/SKILL.md)
- [Spec-driven workflow](.github/skills/spec-driven-playwright/SKILL.md)
- [Sauce Demo site](https://saucedemo.com)

