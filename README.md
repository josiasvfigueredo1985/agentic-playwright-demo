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

## 🔄 How to Regenerate Specs

Use this workflow when the `specs/saucedemo.feature` file is missing or needs to be recreated from scratch.

### Step 1: Identify Test Scenarios

Explore the application and document key user workflows. For Sauce Demo, identify:
- **Login flows** (success, failure cases)
- **Product interactions** (browse, sort, filter)
- **Shopping cart** (add, remove, checkout)
- **Edge cases** (locked-out user, invalid input)

### Step 2: Create Spec File in Gherkin Format

Create `specs/saucedemo.feature` with the following structure:

```gherkin
Feature: Application Name
  As a user
  I want to [action]
  So that I can [benefit]

  Scenario: [SL-01] Descriptive scenario name
    Given I am in a starting state
    When I perform an action
    Then I should see expected result

  Scenario: [SL-02] Another scenario
    Given precondition
    And another precondition
    When I do something
    And I do something else
    Then expected outcome
    And another outcome
```

**Gherkin Structure:**
- **Feature:** High-level description of the application
- **Scenario:** Individual test case with SL-## ID
- **Given:** Initial conditions (setup)
- **When:** Actions taken by the user
- **Then:** Expected outcomes
- **And:** Continuation of Given/When/Then

### Step 3: Define Scenarios

Write 4-5 core scenarios covering:

1. **Happy path** — Normal user flow
2. **Error handling** — Invalid input/locked user
3. **Feature interaction** — Sorting, filtering, forms
4. **End-to-end** — Multi-step workflow (cart → checkout)

**Example for Sauce Demo:**

```gherkin
Scenario: [SL-01] Valid login with standard credentials
  Given I am on the Sauce Demo login page
  When I enter username "standard_user"
  And I enter password "secret_sauce"
  And I click the Login button
  Then I should be authenticated
  And I should be redirected to the inventory page

Scenario: [SL-02] Login attempt with locked-out user
  Given I am on the Sauce Demo login page
  When I enter username "locked_out_user"
  And I enter password "secret_sauce"
  And I click the Login button
  Then I should remain on the login page
  And I should see the error message "Epic sadface: Sorry, this user has been locked out."

Scenario: [SL-03] Sort products by price ascending
  Given I am authenticated as "standard_user"
  And I am viewing the product catalog
  When I sort the products by "Price (low to high)"
  Then the first product should be "Sauce Labs Onesie"
  And the price should be "$7.99"

Scenario: [SL-04] Complete end-to-end checkout flow
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

### Step 4: Save Spec File

Save the file as `specs/saucedemo.feature` (must use `.feature` extension for Gherkin format).

### Step 5: Ask Agent to Generate Tests

**Command to invoke the agent:**

```
Read the spec file at specs/saucedemo.feature, then:

1. Explore https://www.saucedemo.com using playwright-cli
   - Identify the login form elements
   - Discover all data-test attributes
   - Navigate through key user flows
   - Capture selectors for all interactions

2. Generate tests/saucedemo.spec.ts
   - Map each scenario to a Playwright test function
   - Use discovered locators (e.g., [data-test="username"])
   - Match test structure: Given (setup) → When (action) → Then (verify)
   - Include all assertions from the spec
   - No page objects; embed selectors directly

3. Run validation
   - Execute: npm test
   - Debug any failures by re-exploring
   - Ensure exit code 0 with all tests passing

4. Report results
   - Confirm test file was generated
   - Show test execution summary
   - List discovered locators
```

**What the agent will do:**

1. **Parse specs** — Read all 4 scenarios from `specs/saucedemo.feature`
2. **Explore live** — Launch browser, navigate flows, capture selectors
3. **Discover locators** — Find `data-test` attributes and element paths
4. **Generate tests** — Create `tests/saucedemo.spec.ts` with embedded selectors
5. **Validate** — Run `npm test` and fix failures until exit code 0

**Example agent input:**

```
I've created specs/saucedemo.feature with 4 test scenarios [SL-01 through SL-04].
Please generate tests/saucedemo.spec.ts by:
- Reading the spec file
- Exploring https://www.saucedemo.com
- Discovering locators (data-test attributes)
- Generating Playwright test code
- Running npm test to validate all scenarios pass
```

### Step 6: Verify Tests Pass

```bash
npm test
# Expected output: 4 passed (20.7s) — Exit Code: 0
```

If tests fail:
- Agent re-explores the application
- Adjusts locators based on actual UI state
- Regenerates test code
- Re-runs validation

**Result:** `specs/saucedemo.feature` is now the single source of truth, and `tests/saucedemo.spec.ts` is automatically generated.

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


