import { test as base } from "@playwright/test";
import { NETWORK_CONFIG, type NetworkGuardOptions } from "../utils/network-config";
import { parseRestEndpoints } from "../utils/network-requests";
import { ResponseErrorGuard } from "../utils/response-error-guard";
import { ResponseWaitGuard } from "../utils/response-wait-guard";

type NetworkGuards = {
  responseWait: ResponseWaitGuard;
  responseErrors: ResponseErrorGuard;
};

type NetworkFixtures = NetworkGuardOptions & {
  createNetworkGuards: () => NetworkGuards;
};

/** Network options and per-test guard construction for the shared base fixture. */
export const test = base.extend<NetworkFixtures>({
  restApiEndpoints: [NETWORK_CONFIG.restApiEndpoints, { option: true }],
  monitorGraphql: [NETWORK_CONFIG.monitorGraphql, { option: true }],
  networkErrorAllowlist: [NETWORK_CONFIG.networkErrorAllowlist, { option: true }],
  createNetworkGuards: async ({ context, restApiEndpoints, monitorGraphql, networkErrorAllowlist }, use) => {
    await use(() => {
      const endpoints = parseRestEndpoints(restApiEndpoints);
      return {
        responseWait: new ResponseWaitGuard(context, endpoints, monitorGraphql),
        responseErrors: new ResponseErrorGuard(context, endpoints, monitorGraphql, networkErrorAllowlist),
      };
    });
  },
});
