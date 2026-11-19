import { expect, mergeTests } from "@playwright/test";
import { test as networkTest } from "./network";
import { test as uiTest } from "./ui";
import { RESPONSE_WAIT_TIMEOUT_MS, type NetworkGuardOptions } from "../utils/network-config";
import type { UiGuardOptions } from "../utils/ui-errors-config";

export { expect };
export type GuardOptions = NetworkGuardOptions & UiGuardOptions;

const locatorFactories = new Set([
  "locator", "getByAltText", "getByLabel", "getByPlaceholder", "getByRole",
  "getByTestId", "getByText", "getByTitle", "filter", "first", "last", "nth",
  "and", "or", "frameLocator", "contentFrame", "owner", "within",
]);

/** Composes network and UI guards around the Playwright page fixture. */
export const test = mergeTests(networkTest, uiTest).extend({
  page: async ({ page, networkGuards, createUiErrorGuard }, use) => {
    const { responseWait, responseErrors } = networkGuards;
    const uiErrors = createUiErrorGuard(page);
    let uiStarted = false;

    const checkErrors = async () => {
      await responseErrors.flush();
      if (uiStarted) await uiErrors.flush();
      const failures = [...responseErrors.takeFailures(), ...uiErrors.takeFailures()];
      if (failures.length) throw new Error(failures.join("\n\n"));
    };

    const wrapResult = (result: unknown) => {
      if (typeof result !== "object" || result === null) {
        throw new TypeError("Expected a Playwright page, locator, frame locator, or mouse");
      }
      return wrapTarget(result);
    };
    const wrapTarget = <T extends object>(object: T): T =>
      new Proxy(object, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (target === page && property === "mouse") return wrapResult(value);
          if (typeof value !== "function" || typeof property !== "string") return value;
          if (locatorFactories.has(property)) {
            return (...args: unknown[]) => wrapResult(Reflect.apply(value, target, args));
          }
          if (property === "click") {
            return async (...args: unknown[]) => {
              await checkErrors();
              const result = await Reflect.apply(value, target, args);
              await responseWait.wait(RESPONSE_WAIT_TIMEOUT_MS, responseErrors.failureSignal);
              await checkErrors();
              return result;
            };
          }
          return value.bind(target);
        },
      });

    try {
      await uiErrors.start();
      uiStarted = true;
      await use(wrapTarget(page));
    } finally {
      await checkErrors();
    }
  },
});
