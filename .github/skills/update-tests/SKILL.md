# Update Tests Skill

**Purpose:** Completely regenerate all test scenarios from scratch by deleting the spec file, recreating it, and generating fresh test code. Use this to reset the test suite or adapt to major application changes.

**Trigger:** `npm run update-tests`

## Workflow

### 1. Confirm Destructive Action
Warn the user:
```
⚠️  DESTRUCTIVE ACTION: This will DELETE features/saucedemo.feature and regenerate all tests

Current state:
  features/saucedemo.feature: 4 scenarios [SL-01 through SL-04]
  tests/saucedemo.spec.ts: 84 lines

Proceeding will:
  1. Delete features/saucedemo.feature
  2. Regenerate all test scenarios from scratch
  3. Generate fresh tests/saucedemo.spec.ts

Do you want to continue? (yes/no)
```

If user declines, STOP. If user confirms, continue.

### 2. Delete Current Spec File
```bash
rm features/saucedemo.feature
# or on Windows: Remove-Item features/saucedemo.feature -Force
```

Verify deletion:
```
✅ Deleted: features/saucedemo.feature
```

### 3. Prompt User for New Spec
Ask the user to provide the complete new specification:

```
Now create the new spec file. Provide all scenarios in Gherkin format:

Example:

Feature: Sauce Demo E-commerce Application
  As a user
  I want to authenticate, browse products, and complete checkout
  So that I can purchase items from the Sauce Demo store

  Scenario: [SL-01] Valid login with standard credentials
    Given I am on the Sauce Demo login page
    When I enter username "standard_user"
    And I enter password "secret_sauce"
    And I click the Login button
    Then I should be authenticated
    And I should be redirected to the inventory page

  Scenario: [SL-02] ... (more scenarios)
```

### 4. Create New Spec File
- Write the provided specification to `features/saucedemo.feature`
- Validate Gherkin format:
  - Must have Feature description
  - Each scenario has [SL-##] ID
  - Uses Given/When/Then structure
  - Scenario IDs are sequential ([SL-01], [SL-02], etc.)

If format is invalid, ask user to fix and resubmit.

### 5. Generate Tests from Spec
Follow the "spec-driven-playwright" skill:
- Parse all scenarios from fresh `features/saucedemo.feature`
- Explore `https://www.saucedemo.com` using playwright-cli
- Discover all locators and element interactions
- Generate brand new `tests/saucedemo.spec.ts` with all scenarios

### 6. Validate All Tests
```bash
npm test
```

- Verify all scenarios pass
- Exit code must be 0
- Report total: X passed (Ys) - Exit Code: 0

### 7. Report Results
```
✅ Tests regenerated successfully!

Spec file: features/saucedemo.feature
Test file: tests/saucedemo.spec.ts

Scenarios: [SL-01], [SL-02], ..., [SL-0N]
Status: N passed (Ys) - Exit Code: 0

Ready to run tests: npm test
```

## Success Criteria

- ✅ Old spec file deleted
- ✅ New spec file created with valid Gherkin format
- ✅ Test file completely regenerated
- ✅ All scenarios have unique [SL-##] IDs
- ✅ All tests pass
- ✅ Exit code 0

## Command Reference

```bash
# Invoke the skill (will prompt before deleting)
npm run update-tests

# Verify results
npm test

# View updated spec
cat features/saucedemo.feature

# View updated tests
cat tests/saucedemo.spec.ts
```

## When to Use

- After major UI changes to the application
- To reset test suite to fresh state
- When existing tests become outdated
- To reorganize or restructure all scenarios
- To change test scope or focus

## When NOT to Use

- If you only want to add a few new tests → Use `npm run new-tests`
- If you want to keep existing scenarios → Use `npm run new-tests`
- To add a single scenario → Edit spec manually, then regenerate

## Notes

- This action is **destructive** and deletes the spec file
- User must provide complete new specification
- All locators are rediscovered from live application
- Test suite completely resets
- Previous test history is lost
