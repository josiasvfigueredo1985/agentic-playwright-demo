import { test as base } from "@playwright/test";
import { NETWORK_CONFIG, type NetworkGuardOptions } from "../utils/network-config";
import { parseRestEndpoints } from "../utils/network-requests";
import { ResponseErrorGuard, type ExpectedNetworkError } from "../utils/response-error-guard";
import { ResponseWaitGuard } from "../utils/response-wait-guard";

type NetworkGuards = {
  responseWait: ResponseWaitGuard;
  responseErrors: ResponseErrorGuard;
};

type NetworkFixtures = NetworkGuardOptions & {
  networkGuards: NetworkGuards;
  /**
   * Allow one expected error from the next matching monitored request.
   * Call just before the triggering action in a negative test or a scenario
   * with a known backend error the UI does not yet handle. The test still
   * fails if the expected error does not occur.
   *
   * @example
   * // REST: submitting a duplicate order returns HTTP 409.
   * ignoreNetworkErrors({ restPath: "/api/orders", status: 409 });
   * await page.getByRole("button", { name: "Place order" }).click();
   *
   * @example
   * // GraphQL: with monitoring enabled, invalid order data causes CreateOrder
   * // to return HTTP 200 with a non-empty `errors` array.
   * ignoreNetworkErrors({ graphqlOperation: "CreateOrder" });
   * await page.getByRole("button", { name: "Place order" }).click();
   */
  ignoreNetworkErrors: (expected: ExpectedNetworkError) => void;
};

/** Network options and guard lifecycle for the shared base fixture. */
export const test = base.extend<NetworkFixtures>({
  restApiEndpoints: [NETWORK_CONFIG.restApiEndpoints, { option: true }],
  monitorGraphql: [NETWORK_CONFIG.monitorGraphql, { option: true }],
  networkErrorAllowlist: [NETWORK_CONFIG.networkErrorAllowlist, { option: true }],
  networkGuards: async ({ context, restApiEndpoints, monitorGraphql, networkErrorAllowlist }, use) => {
    const endpoints = parseRestEndpoints(restApiEndpoints);
    const responseWait = new ResponseWaitGuard(context, endpoints, monitorGraphql);
    const responseErrors = new ResponseErrorGuard(context, endpoints, monitorGraphql, networkErrorAllowlist);
    try {
      await use({ responseWait, responseErrors });
    } finally {
      responseWait.dispose();
      await responseErrors.dispose();
      const failures = responseErrors.takeFailures();
      if (failures.length) throw new Error(failures.join("\n\n"));
    }
  },
  ignoreNetworkErrors: async ({ networkGuards }, use) => {
    await use((expected) => networkGuards.responseErrors.expectNextError(expected));
  },
});
