# New Tests Skill

**Purpose:** Add new test scenarios to the existing test suite by reading test code to identify missing scenarios, adding them to the spec file, then generating updated tests.

**Trigger:** `npm run new-tests`

## Workflow

### 1. Analyze Current Tests
- Read `tests/saucedemo.spec.ts`
- Extract all existing test scenarios
- List their scenario IDs (e.g., [SL-01], [SL-02], etc.)
- Identify the highest scenario ID used

### 2. Read Current Spec
- Read `features/saucedemo.feature`
- List all scenarios and their IDs
- Identify any gaps between test code and spec

### 3. Prompt User for New Scenarios
Ask the user:
```
What new test scenarios would you like to add?

Current scenarios: [SL-01], [SL-02], [SL-03], [SL-04]
Next scenario ID: [SL-05]

Please describe the new scenario(s) in the following format:

[SL-05] Scenario name
  Given [precondition]
  When [action]
  Then [expected outcome]

[SL-06] Another scenario
  ...
```

### 4. Add to Spec File
- Append new scenarios to `features/saucedemo.feature`
- Maintain Gherkin format (Given/When/Then structure)
- Use sequential scenario IDs ([SL-05], [SL-06], etc.)
- Preserve existing scenarios

### 5. Generate Tests from Spec
Follow the "spec-driven-playwright" skill:
- Parse all scenarios from `features/saucedemo.feature` (including new ones)
- Explore `https://www.saucedemo.com` using playwright-cli
- Discover locators for new scenarios
- Generate/update `tests/saucedemo.spec.ts` with all scenarios (old + new)

### 6. Validate All Tests
```bash
npm test
```

- Verify ALL tests pass (old + new)
- Exit code must be 0
- Report: X passed (Ys) - Exit Code: 0

### 7. Report Results
```
✅ New tests added successfully!

Added scenarios:
  [SL-05] Scenario name
  [SL-06] Another scenario

Total scenarios: 6 (was 4)
Status: 6 passed (25.3s) - Exit Code: 0
```

## Success Criteria

- ✅ New scenarios added to `features/saucedemo.feature`
- ✅ Scenario IDs are sequential and unique
- ✅ Gherkin format is correct
- ✅ All tests pass (old + new)
- ✅ Exit code 0
- ✅ User notified of results

## Command Reference

```bash
# Invoke the skill
npm run new-tests

# Verify results
npm test
```

## Notes

- Do NOT delete existing scenarios
- Do NOT modify existing scenario IDs
- All scenarios must follow Gherkin format
- Agent explores LIVE application for locators
- New tests must follow existing patterns
