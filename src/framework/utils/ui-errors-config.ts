export type UiGuardOptions = {
  uiErrorSelectors: readonly string[];
  uiErrorAllowlist: readonly string[];
};

/**
 * Global UI guard defaults. Allowed messages are ignored in every test unless
 * the test or project overrides the allowlist.
 */
export const UI_CONFIG: UiGuardOptions = {
  uiErrorSelectors: ["[role='alert']"],
  uiErrorAllowlist: ["Epic sadface: Sorry, this user has been locked out."],
};
