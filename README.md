# Agentic Playwright Demo

A **spec-driven Playwright testing approach** where agents dynamically explore applications and generate test code without pre-built page objects.

## 🎯 Core Concept

**Traditional Playwright** relies on static page objects that couple tests to UI structure. When the application changes, maintainers must manually update locators.

**Agentic Approach** inverts this workflow:
- **Specs are source of truth** — BDD specifications define acceptance criteria
- **Agent explores live** — Uses `playwright-cli` to interact with the real application
- **Tests generated on-demand** — Agent creates test files from scratch, embedding discovered selectors
- **No page objects** — Tests adapt naturally when the UI changes

## 🏗️ Architecture

```
Project Structure
├── specs/
│   └── saucedemo.feature          # Gherkin specifications (acceptance criteria)
├── tests/
│   └── saucedemo.spec.ts          # Agent-generated tests (no page objects)
├── test-results/                  # Test output (git-ignored)
│   └── playwright-report/         # HTML reports
├── .github/skills/                # Agent skill documentation
└── playwright.config.ts           # Test configuration
```

**How it works:**
1. Agent reads `specs/saucedemo.feature` (Gherkin format)
2. Agent explores `https://www.saucedemo.com` using `playwright-cli`
3. Agent generates `tests/saucedemo.spec.ts` with discovered locators
4. Agent runs `npm test` and validates all pass

## 🚀 How to Run

### Prerequisites
```bash
node --version  # v18+
npm --version
```

### Setup
```bash
npm install
npx playwright install chromium
```

### Execute Tests
```bash
# Run all tests
npm test

# View HTML report
npx playwright show-report

# Run in UI mode (interactive)
npx playwright test --ui

# Run single scenario
npm test -- --grep "login"
```

## 📖 How to Use

### View Test Specifications
Open [specs/saucedemo.feature](specs/saucedemo.feature) to see the 4 BDD scenarios:
- **Scenario 1:** Valid login with standard credentials
- **Scenario 2:** Locked-out user cannot login
- **Scenario 3:** Sort products by price
- **Scenario 4:** Complete checkout flow

### View Generated Tests
Open [tests/saucedemo.spec.ts](tests/saucedemo.spec.ts) to see agent-generated test code with embedded selectors (no page objects).

### Interpret Results
```bash
npm test
# Output: 4 passed (20.7s) — Exit Code: 0
```

All tests run against the live Sauce Demo site. Results include:
- HTML report: `test-results/playwright-report/index.html`
- Screenshots (on failure only)
- Traces and videos (on retry)

## ➕ How to Add More Tests

### 1. Add Scenario to Spec File

Edit [specs/saucedemo.feature](specs/saucedemo.feature) and add a new Gherkin scenario:

```gherkin
Scenario: Your new test scenario
  Given I am on the login page
  When I perform some action
  Then I should see expected result
```

Follow the existing format (Given/When/Then structure).

### 2. Regenerate Tests

Ask the agent to explore the application and generate test code from the new spec:

```bash
# Agent will:
# 1. Read the updated specs/saucedemo.feature
# 2. Explore https://www.saucedemo.com
# 3. Generate or update tests/saucedemo.spec.ts
# 4. Run npm test to validate
```

### 3. Verify Tests Pass

```bash
npm test
# All scenarios should pass with exit code 0
```

### Example: Adding a Logout Test

1. **Add to spec:**
```gherkin
Scenario: User can logout
  Given I am authenticated as "standard_user"
  When I click the logout menu
  And I click the logout button
  Then I should be on the login page
```

2. **Let agent generate test code** (discovers locators, writes test function)

3. **Verify:** `npm test` should pass

**Key principle:** Specs define *what* to test; agent implements *how* by exploring the live UI. No manual page-object maintenance.


