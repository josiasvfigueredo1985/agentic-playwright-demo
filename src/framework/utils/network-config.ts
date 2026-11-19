import type { NetworkErrorAllowlist } from "./response-error-guard";

export const GRAPHQL_PATH = /\/graphql(?:\/|$)/i;


export type NetworkGuardOptions = {
  restApiEndpoints: readonly string[];
  monitorGraphql: boolean;
  networkErrorAllowlist: NetworkErrorAllowlist;
};

/**
 * Default filters for both network guards and exceptions for expected errors.
 * REST endpoints match their origin, path, and subpaths. Error exceptions match
 * exact REST paths or GraphQL operation names and allow all error statuses.
 *
 * @example
 * {
 *   restApiEndpoints: ["https://api.example.com/api"],
 *   monitorGraphql: true,
 *   networkErrorAllowlist: {
 *     restPaths: ["/api/login"],
 *     graphqlOperations: ["Login"],
 *   },
 * }
 */
export const NETWORK_CONFIG: NetworkGuardOptions = {
  restApiEndpoints: [],
  monitorGraphql: false,
  networkErrorAllowlist: {
    restPaths: [],
    graphqlOperations: [],
  },
};
