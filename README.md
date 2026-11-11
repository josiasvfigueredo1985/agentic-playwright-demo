# Agentic Playwright Demo

A **spec-driven Playwright testing approach** where agents dynamically explore applications and generate test code without pre-built page objects.

## 🎯 Core Concept

**Traditional Playwright** relies on static page objects that couple tests to UI structure. When the application changes, maintainers must manually update locators.

**Agentic Approach** inverts this workflow:
- **Specs are source of truth** — BDD specifications define acceptance criteria
- **Agent explores live** — Uses `playwright-cli` to interact with the real application
- **Tests generated on-demand** — Agent creates test files from scratch, embedding discovered selectors
- **No page objects** — The agent can rediscover locators when tests need updating

## 🏗️ Architecture

```
Project Structure
├── features/
│   ├── saucedemo/                 # Sauce Demo acceptance criteria
│   └── serverest/                 # ServeRest acceptance criteria
├── tests/
│   ├── saucedemo/                 # Sauce Demo tests
│   └── serverest/                 # ServeRest tests
├── .playwright-results/           # Reports and artifacts (git-ignored)
├── .github/skills/                # Agent skill documentation
└── playwright.config.ts           # Test configuration
```

**How it works:**
1. Agent reads feature files under `features/` (Gherkin format)
2. Agent explores the application configured in `playwright.config.ts` using `playwright-cli`
3. Agent generates Playwright tests with discovered locators
4. Agent runs `npm test` and validates all pass

The included examples target Sauce Demo and ServeRest. To add another application, add a named project with its URL and test directory in `playwright.config.ts`, and put its features in `features/<project-name>/` and tests in the matching test directory. Project names used with `--sut` must contain only letters, digits, hyphens, or underscores and start with a letter or digit.

## 🚀 How to Run

### Prerequisites
```bash
node --version  # v18+
npm --version
```

The agent commands also require the **GitHub Copilot CLI** and an active Copilot subscription. On Windows, install it with:

```powershell
winget install --id GitHub.Copilot --exact
```

On first use, run `copilot` and follow the `/login` instructions. The CLI is a global tool, not a project dependency.

### Setup
```bash
npm install
npx playwright install chromium
```

### Execute Tests
```bash
# Run all tests
npm test

# Run one SUT
npm test -- --project=serverest

# View HTML report
npx playwright show-report .playwright-results/report

# Run in UI mode (interactive)
npx playwright test --ui

# Run single scenario
npm test -- --grep "login"
```

## 🤖 Agent Commands

### Synchronize Tests with Features

**Purpose:** Ask Copilot to create missing tests and update existing tests when feature steps or data change. It compares test behavior with the feature, not just scenario IDs.

**Command (PowerShell or other terminal):**
```bash
npm run agentic-pw
```

To synchronize only one SUT:

```bash
npm run agentic-pw -- --sut serverest
```

1. If there are no `.feature` files under the selected SUT (or under `features/` when running all), the command warns and stops.
2. Otherwise, it starts Copilot, which matches each selected feature directory to a Playwright project and its test directory.
3. If no tests exist, Copilot generates them. It adds missing scenarios and updates existing tests whose steps or data differ, preserving unrelated tests.
4. Copilot runs the selected project tests (or all tests) and reports the outcome; the command then independently runs the same tests again.

The command runs Copilot non-interactively, even when tests already exist, so it can check changed steps and data. This may use AI credits. If requirements are unclear, Copilot cannot complete, or tests fail, the command exits unsuccessfully instead of waiting for input. Review the agent-generated changes.

**Security:** This command automatically approves all Copilot tools and URLs; shell commands can access more than the workspace. Run it only on trusted code in an isolated environment with minimal credentials. The command removes `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, and `GITHUB_TOKEN` from Copilot's shell and MCP tool environments, but other secrets may still be accessible. Organization policy can still deny actions.

For CI, install and authenticate Copilot CLI, `playwright-cli`, project dependencies, and the required Playwright browser beforehand. Provide Copilot authentication through an approved pipeline secret (for example `COPILOT_GITHUB_TOKEN`) rather than committing a token. The pipeline must also be able to reach the configured application.

You can also invoke `/spec-driven-playwright` in VS Code Copilot Chat. `npm test` alone runs existing tests without invoking Copilot.

**Skill details:** [.github/skills/spec-driven-playwright/SKILL.md](.github/skills/spec-driven-playwright/SKILL.md). The separate `playwright-cli` skill provides browser commands.

## 📖 How to Use

### View Test Specifications
Open [features/saucedemo/saucedemo.feature](features/saucedemo/saucedemo.feature) to see the 4 Sauce Demo scenarios:
- **Scenario 1:** Valid login with standard credentials
- **Scenario 2:** Locked-out user cannot login
- **Scenario 3:** Sort products by price
- **Scenario 4:** Complete checkout flow

### View Generated Tests
Open [features/serverest/registration.feature](features/serverest/registration.feature) for ServeRest's registration and login scenario. The agent generates matching tests under `tests/serverest/`.

### Interpret Results
```bash
npm test
```

Tests run against the live configured applications. Results include:
- HTML report: `.playwright-results/report/index.html`
- Screenshots (on failure only)
- Traces and videos (on retry)

## 🔄 How to Regenerate Specs

Use this workflow when `features/saucedemo/saucedemo.feature` is missing or needs to be recreated from scratch.

### Step 1: Identify Test Scenarios

Explore the application and document key user workflows. For Sauce Demo, identify:
- **Login flows** (success, failure cases)
- **Product interactions** (browse, sort, filter)
- **Shopping cart** (add, remove, checkout)
- **Edge cases** (locked-out user, invalid input)

### Step 2: Create Spec File in Gherkin Format

Create `features/saucedemo/saucedemo.feature` with the following structure:

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
- **Scenario:** Individual test case with a unique bracketed ID, such as `[SL-01]`
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
  And I add "Sauce Labs Bike Light" to the cart
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

Save the file as `features/saucedemo/saucedemo.feature` (must use `.feature` extension for Gherkin format).

### Step 5: Ask the Agent to Generate Tests

Run `npm run agentic-pw` in the terminal or invoke `/spec-driven-playwright` in Copilot Chat. The agent compares feature steps and data with existing tests, then creates or updates tests as needed.

### Step 6: Verify Tests Pass

```bash
npm test
```

If tests fail, run `npm run agentic-pw` to ask the agent to investigate and revalidate them.

**Result:** `features/saucedemo/saucedemo.feature` is the source of truth for the agent-generated tests. Review the agent's changes and test results.

## ➕ How to Add More Tests

### 1. Add Scenario to Spec File

Edit [features/saucedemo/saucedemo.feature](features/saucedemo/saucedemo.feature) and add a new Gherkin scenario:

```gherkin
Scenario: [SL-05] Your new test scenario
  Given I am on the login page
  When I perform some action
  Then I should see expected result
```

Follow the existing format (Given/When/Then structure).

### 2. Regenerate Tests

Ask the agent to explore the application and generate test code from the new spec:

```bash
npm run agentic-pw
```

### 3. Verify Tests Pass

```bash
npm test
# All scenarios should pass with exit code 0
```

### Example: Adding a Logout Test

1. **Add to spec:**
```gherkin
Scenario: [SL-05] User can logout
  Given I am authenticated as "standard_user"
  When I click the logout menu
  And I click the logout button
  Then I should be on the login page
```

2. **Let agent generate test code** (discovers locators, writes test function)

3. **Verify:** `npm test` should pass

**Key principle:** Specs define *what* to test; agent implements *how* by exploring the live UI. No manual page-object maintenance.


