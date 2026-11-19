import { test as base, type Page } from "@playwright/test";
import { UiErrorGuard } from "../utils/ui-error-guard";
import { UI_CONFIG, UiGuardOptions } from "../utils/ui-errors-config";

type UiFixtures = UiGuardOptions & {
  createUiErrorGuard: (page: Page) => UiErrorGuard;
};

/** UI options and per-test guard construction for the shared base fixture. */
export const test = base.extend<UiFixtures>({
  uiErrorSelectors: [UI_CONFIG.uiErrorSelectors, { option: true }],
  uiErrorAllowlist: [UI_CONFIG.uiErrorAllowlist, { option: true }],
  createUiErrorGuard: async ({ uiErrorSelectors, uiErrorAllowlist }, use) => {
    await use(
      (page) => new UiErrorGuard(page, uiErrorSelectors, uiErrorAllowlist),
    );
  },
});
