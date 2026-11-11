---
name: spec-driven-playwright
description: Create and validate Sauce Demo Playwright tests from functional specifications.
---

# Spec-Driven Playwright — Agentic Approach

This workflow enables an agent to dynamically explore, generate, and validate tests from specs without pre-built page objects.

## Process

1. **Read Specs** — Parse `specs/*.spec.md` as the acceptance contract (Given/When/Then scenarios).

2. **Explore Live** — Use `playwright-cli` commands to interact with the application and understand the UI:
   - `playwright-cli open https://saucedemo.com` — launch the browser
   - `playwright-cli snapshot` — capture current page state
   - `playwright-cli find <text>` — locate elements by text or role
   - `playwright-cli goto`, `click`, `fill`, `select`, etc. — navigate and interact
   - Document selectors and accessible locators found during exploration

3. **Generate Tests Dynamically** — Write test files in `tests/` on-the-fly using:
   - `getByTestId()` for data-test attributes
   - `getByRole()` for semantic HTML
   - `getByPlaceholder()` for form inputs
   - No pre-built page objects — locators discovered during exploration are embedded in test code

4. **Validate** — Run `npx playwright test` and fix failures until all tests pass.
   - Exit code 0 = all tests pass
   - Exit code != 0 = debug and retry (max 3 iterations)

5. **Cleanup** — Close browser session with `playwright-cli close`.

## Why No Page Objects?

Static page objects couple tests to UI structure and prevent the agent from adapting when the site changes. By generating tests dynamically:
- The agent re-explores before each run
- Selectors are always fresh
- New scenarios are discovered automatically
- Tests remain maintainable without manual page-object updates

## References

- [Playwright CLI skill](../playwright-cli/SKILL.md) — browser automation commands
- [Sauce Demo spec](../../specs/saucedemo.spec.md) — acceptance criteria
