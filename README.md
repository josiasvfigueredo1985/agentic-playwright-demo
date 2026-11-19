# Agentic Playwright Demo

A **spec-driven Playwright testing approach** where agents explore applications and generate tests with page and component objects as needed.

## Contents

- [Core Concept](#-core-concept)
- [Architecture](#-architecture)
- [How to Run](#-how-to-run)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Execute Tests](#execute-tests)
  - [GitHub Actions](#github-actions)
- [Agent Commands](#-agent-commands)
  - [Synchronize Tests with Features](#synchronize-tests-with-features)
- [Network synchronization](#network-synchronization)
- [Try the agent](#try-the-agent)
- [How to Use](#-how-to-use)
- [How to Regenerate Specs](#-how-to-regenerate-specs)
- [How to Add More Tests](#-how-to-add-more-tests)

## 🎯 Core Concept

**Agentic approach:**
- **QA owns the test intent** — QA authors and maintains BDD scenarios and their expected behavior
- **Agent explores live** — Uses `playwright-cli` to interact with the real application
- **Agent implements and runs tests** — It creates or updates the Playwright code for the QA-defined scenarios, then validates the tests; it does not invent or change expected behavior
- **Page and component objects** — Agent groups UI actions and locators by responsibility, extracting substantial or reusable components when useful

## 🏗️ Architecture

```
Project Structure
├── src/
│   ├── business/
│   │   ├── features/<sut>/        # Acceptance criteria by application
│   │   └── pages/<sut>/           # Page objects and components
│   └── framework/
│       ├── fixtures/              # Shared Playwright fixtures
│       ├── utils/                 # Response-wait, response-error and UI-error guards
│       └── scripts/               # Agent launcher and its tests
├── tests/
│   ├── saucedemo/                 # Sauce Demo tests
│   └── automation-test-store/     # Automation Test Store tests
├── .playwright-results/           # Reports and artifacts (git-ignored)
├── .github/skills/                # Agent skill documentation
└── playwright.config.ts           # Test configuration
```

**How it works:**
1. QA authors the expected behavior in feature files under `src/business/features/` (Gherkin format)
2. Agent reads those requirements and explores the application configured in `playwright.config.ts` using `playwright-cli` to resolve implementation details
3. Agent creates or updates the matching Playwright test code and page/component objects without changing the feature scenarios or expected behavior
4. Agent runs the tests; the launcher independently runs them again to verify the result

Generated and updated specs group scenarios under a feature-named `test.describe`, use `test.beforeEach` for genuinely shared navigation, keep scenario assertions explicit, and use page or component objects for UI-specific actions. The agent also checks existing scenarios for duplication and may refactor directly related tests while preserving their behavior.

The included examples target Sauce Demo and [Automation Test Store](https://automationteststore.com/). To add another application, add a named project with its URL and test directory in `playwright.config.ts`, and put its features in `src/business/features/<project-name>/` and tests in the matching test directory. Project names used with `--sut` must contain only letters, digits, hyphens, or underscores and start with a letter or digit.

## 🚀 How to Run

### Prerequisites
```bash
node --version  # v20+
npm --version
```

The agent commands also require the **GitHub Copilot CLI** and an active Copilot subscription. Install it for your platform:

**Windows (PowerShell and WinGet):**

```powershell
winget install --id GitHub.Copilot --exact
```

**macOS (Homebrew):**

```bash
brew install --cask copilot-cli
```

**Linux (npm; requires Node.js 22 or later):**

```bash
npm install -g @github/copilot
```

The npm installation also works on Windows and macOS with Node.js 22 or later. See the [Copilot CLI installation guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) for other options. On first use, run `copilot` and follow the `/login` instructions. The CLI is a global tool, not a project dependency.

### Setup

The following commands work on Windows, macOS, and Linux:

```bash
npm install
npx playwright install chromium
```

On supported Linux distributions, if Chromium's system libraries are missing, install them with `npx playwright install-deps chromium`. This may require administrator privileges.

### Execute Tests

These commands are the same on all three platforms:

```bash
# Run all tests
npm test

# Run one SUT
npm test -- --project=saucedemo
npm test -- --project=automation-test-store

# View HTML report
npx playwright show-report .playwright-results/report

# Run in UI mode (interactive)
npx playwright test --ui

# Run single scenario
npm test -- --grep "login"
```

### GitHub Actions

The Playwright workflow runs on pushes, pull requests, and manual dispatch. It installs dependencies and Chromium on the runner, checks the agent launcher, and runs all committed Playwright tests against the live applications in two shards. It does not invoke Copilot or require a Copilot token.

Shard blob reports are retained for one day and merged into an HTML report artifact retained for seven days. Non-pull-request runs publish the merged report to GitHub Pages; enable Pages with **GitHub Actions** as its source in repository settings. The `github-pages` deployment environment can be created in **Settings → Environments**; GitHub also creates it automatically when a workflow references it. Pull requests do not publish to Pages.

GitHub Pages reports may be publicly accessible and can contain test data or screenshots. Use only synthetic data and review reports before sharing. Generate and commit updated tests before relying on CI.

## 🤖 Agent Commands

### Synchronize Tests with Features

**Purpose:** Ask Copilot to implement missing Playwright tests and update existing test code when QA-authored feature steps or data change. The feature scenarios define what to test; Copilot handles implementation and execution, not test-intent authoring.

**Command (PowerShell or other terminal):**
```bash
npm run agentic-pw
```

To synchronize only one SUT:

```bash
npm run agentic-pw -- --sut saucedemo
```

1. If there are no `.feature` files under the selected SUT (or under `src/business/features/` when running all), the command warns and stops.
2. Otherwise, it starts Copilot, which matches each selected feature directory to a Playwright project and its test directory.
3. Copilot creates missing test directories. When projects share an empty or nonexistent test directory, it configures separate `tests/<sut>/` directories for the selected projects. It stops if shared existing tests cannot be attributed safely, or if a project or target URL is missing.
4. If no tests exist, Copilot implements tests for the scenarios in the feature files. It adds missing scenario tests to the Playwright specs and updates existing test code whose steps or data differ, preserving unrelated tests and leaving feature files unchanged.
5. Copilot runs the selected project tests (or all tests) and reports the outcome; the command then independently runs the same tests again.

The command runs Copilot non-interactively, even when tests already exist, so it can check changed steps and data. This may use AI credits. QA owns the feature scenarios and expected behavior; the agent explores the application only to resolve implementation details such as locators. It must not add or change feature scenarios or invent expected behavior. If a requirement is genuinely ambiguous, or Copilot cannot complete or tests fail, the command exits unsuccessfully instead of waiting for input. Review the agent-generated changes.

**Security:** This command automatically approves all Copilot tools and URLs; shell commands can access more than the workspace. Run it only on trusted code in an isolated environment with minimal credentials. The command removes `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, and `GITHUB_TOKEN` from Copilot's shell and MCP tool environments, but other secrets may still be accessible. Organization policy can still deny actions.

For CI, install and authenticate Copilot CLI, `playwright-cli`, project dependencies, and the required Playwright browser beforehand. Provide Copilot authentication through an approved pipeline secret (for example `COPILOT_GITHUB_TOKEN`) rather than committing a token. The pipeline must also be able to reach the configured application.

You can also invoke `/spec-driven-playwright` in VS Code Copilot Chat. `npm test` alone runs existing tests without invoking Copilot.

**Skill details:** [.github/skills/spec-driven-playwright/SKILL.md](.github/skills/spec-driven-playwright/SKILL.md). The separate `playwright-cli` skill provides browser commands.

For generated or updated tests, the skill prohibits `.locator(...)` and uses Playwright's built-in locators, scoped chaining, filtering, and `within()`. If no reliable permitted locator exists, the agent reports a blocker instead of weakening the test. It reports existing locator violations without rewriting tests solely to change their locators.

The agent saves manually captured exploration screenshots and other files under the git-ignored `.playwright-results/exploration/` directory.

For local maintenance, the skill requires evidence-based diagnosis and forbids weakening tests to hide application errors. It writes a per-run maintenance report under `.playwright-results/maintenance/` and preserves available Playwright evidence across reruns. This is agent guidance, not an automatic CI repair or a guarantee that every application error is detected. Traces and screenshots may contain sensitive data; review them before sharing.

## Network synchronization

Modern applications often update the UI asynchronously after a user action. A test can move on while a request triggered by a click is still in flight, creating timing-dependent failures when the next action relies on its result. The shared fixture monitors selected REST and detected GraphQL browser fetch/XHR traffic and provides a bounded, best-effort wait after clicks without adding a fixed sleep after every click.

This can help when application initialization or data loading involves monitored requests, including in React applications. **It does not detect or wait for React hydration:** a page may look ready before its event handlers are attached, and a click can be ignored without starting a request. Network completion also does not mean that React has rendered the response. For hydration and rendering readiness, use an application-provided readiness signal where available and assert the relevant interactive UI state. Playwright's built-in actionability checks and auto-retrying assertions remain important.

### Configuration

Tests import `test` and `expect` from `@fixtures/base`, an alias for `src/framework/fixtures/base.ts`, instead of directly from Playwright. The base fixture combines the network and UI fixtures and coordinates the response-wait, response-error, and UI-error guards in `src/framework/utils/`. Both network guards use the same filters for browser fetch/XHR traffic. Requests to `googleapis.com` and its subdomains remain excluded.

Configure shared defaults in `NETWORK_CONFIG` in `src/framework/utils/network-config.ts`. Set `restApiEndpoints` to absolute HTTP(S) base URLs for the application's REST APIs. A URL matches its origin and exact pathname or descendants at a path boundary: `https://api.example.com/api` matches `/api/orders`, not `/apix`. Use `https://api.example.com/` only if all fetch/XHR traffic on that origin is API traffic. Queries, fragments, and credentials are not allowed in the configured endpoint. Set `monitorGraphql: true` to monitor requests with a `/graphql` path segment on any non-excluded origin. GraphQL is excluded when this option is false, even if a REST endpoint matches. By default the REST endpoint list is empty and GraphQL monitoring is disabled, so neither network guard monitors requests until configured.

The `networkErrorAllowlist` option lists expected errors, not requests to monitor: REST entries match exact URL pathnames, and GraphQL entries match explicit `operationName` values in a GET query string or JSON POST body. An entry allows all error statuses and network failures for that path or operation on any monitored host, so keep exceptions as narrow as possible. Both error lists are empty by default.

GraphQL responses with a non-empty `errors` array fail even when the HTTP status is 200. For JSON batches, response errors are matched to request operations by position; an unidentifiable or unmatched operation is not exempted. A malformed GraphQL JSON response fails rather than silently hiding an error.

Override the shared defaults for a test file or `describe` block when an application or scenario needs different settings:

```ts
test.use({
  restApiEndpoints: ['https://api.example.com/api'],
  monitorGraphql: true,
  networkErrorAllowlist: {
    restPaths: ['/api/orders'],
    graphqlOperations: ['GetOrders'],
  },
});
```

These options can also be set in a Playwright project's `use` configuration. To type-check them in `playwright.config.ts`, import `GuardOptions` as a type from `src/framework/fixtures/base` and use `defineConfig<GuardOptions>(...)`.

### Mocking an expected API error

Use the `ignoreNetworkErrors` fixture just before the step that triggers the request. Set up the mock separately with Playwright, and keep the assertion for the expected UI behavior:

```ts
test("shows retry guidance when the orders API fails", async ({ page, ignoreNetworkErrors }) => {
  // Configure https://api.example.com/api in restApiEndpoints first.
  await page.goto("/orders");
  await page.route("https://api.example.com/api/orders", (route) =>
    route.fulfill({ status: 503, json: { error: "Orders unavailable" } }),
    { times: 1 },
  );

  ignoreNetworkErrors({ restPath: "/api/orders", status: 503 });
  await page.getByRole("button", { name: "Load orders" }).click();
  await expect(page.getByText("Try again later")).toBeVisible();
});
```

For query-based routes, narrow the match with `query`, for example `{ restPath: "/index.php", query: { rt: "r/product/product/addToCart" }, status: 503 }`. With GraphQL monitoring enabled, use `{ graphqlOperation: "CreateOrder" }` to expect a non-empty GraphQL `errors` array, or add `status: 503` to expect that HTTP status on a single-operation request.

The exception is per test and binds when the next matching monitored request starts. It does not mock the response, disable monitoring, or change the shared allowlist. If no request matches, the matched request is still in flight at teardown, or it returns anything other than the expected error, the test fails. Other requests still follow normal guard rules. If the scenario intentionally shows a message caught by the UI guard, allow that exact message in the scenario's UI configuration and still assert it.

### Behavior and limitations

After a `click` on the fixture's page, locators, or mouse, it waits for already-observed monitored API requests to finish, up to `RESPONSE_WAIT_TIMEOUT_MS` in [`network-config.ts`](./src/framework/utils/network-config.ts) (one second by default). A timeout is silent and the test proceeds; a successful response proceeds normally. An unexpected monitored HTTP 4xx/5xx response, GraphQL error, or failed request fails the test, including the HTTP status and response body where available. URLs in failures omit query strings. Requests are not blocked or modified, and Playwright's normal assertions still verify the UI.

Errors observed during the bounded wait fail the click. An error arriving after a timeout, or outside a wrapped click, fails the next wrapped click or fixture teardown if it arrives before monitoring ends; asynchronous events cannot interrupt arbitrary test code immediately. Requests that have not completed by teardown do not extend the test. Requests started later, direct API request-fixture calls, clicks through other page/frame objects, and other actions are not automatically waited for. Assertions retain their normal behavior and do not wait for requests. Network completion does not guarantee that the application has rendered the response. Use an appropriate Playwright assertion or explicit wait where a scenario needs a stronger guarantee.

### UI error guard

The UI guard observes DOM changes on the fixture page and its frames for visible elements matching `[role='alert']` by default. It records non-empty alert text, including alerts removed before teardown, and fails the next guarded click or fixture teardown unless the exact trimmed message is explicitly allowed. Global defaults are in `UI_CONFIG` in `src/framework/fixtures/ui.ts`. The Sauce Demo locked-out message is globally allowed, so it will not fail any test when displayed; remove it from the global list if it should be detected outside that negative scenario. The negative scenario still asserts the message.

To cover application-specific error elements or override expected messages, configure the test or its `describe` block:

```ts
test.use({
  uiErrorSelectors: ["[role='alert']", ".error-message"],
  uiErrorAllowlist: ["Expected validation error"],
});
```

Selectors are CSS selectors and replace the default list; an empty list disables detection. The test-specific allowlist also replaces the global list. Use exceptions only for expected messages, and assert those messages in the scenario. The guard observes DOM mutations and checks at guarded clicks and teardown; it cannot detect every visual error, messages rendered without a matching selector, alerts added and removed before the observer runs, or messages appearing after teardown. It does not replace scenario assertions or human review.

**Sensitive data:** Unexpected response bodies and UI messages are included in test failure output and reports and may contain credentials, personal information, or other sensitive data. Use synthetic data, restrict report access, and review artifacts before sharing. Path and operation allowlists are not a security boundary.

## Try the agent

The [Automation Test Store feature](src/business/features/automation-test-store/automation-test-store.feature) contains a commented-out `[ATS-04]` cart-removal scenario for trying the workflow:

1. Uncomment the scenario and its steps.
2. Run `npm run agentic-pw -- --sut automation-test-store`.
3. Review the generated changes and test report. The agent reports failures rather than hiding application errors.

## 📖 How to Use

### View Test Specifications
Open [src/business/features/saucedemo/saucedemo.feature](src/business/features/saucedemo/saucedemo.feature) to see the 4 Sauce Demo scenarios:
- **Scenario 1:** Valid login with standard credentials
- **Scenario 2:** Locked-out user cannot login
- **Scenario 3:** Sort products by price
- **Scenario 4:** Complete checkout flow

### View Generated Tests
Open [src/business/features/automation-test-store/automation-test-store.feature](src/business/features/automation-test-store/automation-test-store.feature) for the store's shopping-cart and currency scenarios. Matching tests are under `tests/automation-test-store/`.

### Interpret Results
```bash
npm test
```

Tests run against the live configured applications. Results include:
- HTML report: `.playwright-results/report/index.html`
- Screenshots (on failure only)
- Traces and videos (on retry)

## 🔄 How to Regenerate Specs

Use this workflow when `src/business/features/saucedemo/saucedemo.feature` is missing or needs to be recreated from scratch.

### Step 1: Identify Test Scenarios

Explore the application and document key user workflows. For Sauce Demo, identify:
- **Login flows** (success, failure cases)
- **Product interactions** (browse, sort, filter)
- **Shopping cart** (add, remove, checkout)
- **Edge cases** (locked-out user, invalid input)

### Step 2: Create Spec File in Gherkin Format

Create `src/business/features/saucedemo/saucedemo.feature` with the following structure:

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

Save the file as `src/business/features/saucedemo/saucedemo.feature` (must use `.feature` extension for Gherkin format).

### Step 5: Ask the Agent to Generate Tests

Run `npm run agentic-pw` in the terminal or invoke `/spec-driven-playwright` in Copilot Chat. The agent compares feature steps and data with existing tests, then creates or updates tests as needed.

### Step 6: Verify Tests Pass

```bash
npm test
```

If tests fail, run `npm run agentic-pw` to ask the agent to investigate and revalidate them.

**Result:** `src/business/features/saucedemo/saucedemo.feature` is the source of truth for the agent-generated tests. Review the agent's changes and test results.

## ➕ How to Add More Tests

### 1. Add Scenario to Spec File

Edit [src/business/features/saucedemo/saucedemo.feature](src/business/features/saucedemo/saucedemo.feature) and add a new Gherkin scenario:

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

**Key principle:** Specs define *what* to test; the agent explores the live UI and maintains page and component objects for *how*.


