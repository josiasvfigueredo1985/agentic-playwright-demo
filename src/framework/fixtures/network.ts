import { setImmediate } from "node:timers";
import {
  test as base,
  expect,
  type Request,
  type Response,
} from "@playwright/test";

export { expect };

/** URL pathname patterns identifying GraphQL endpoints before REST matching. */
const API_URL_PATTERNS = {
  graphql: [/\/graphql(?:\/|$)/i],
};

type NetworkAllowlist = {
  restPaths: readonly string[];
  graphqlOperations: readonly string[];
};

/**
 * Requests eligible for monitoring: exact REST pathnames and GraphQL operation
 * names. Empty lists match nothing; entries apply to all non-Google hosts.
 *
 * @example
 * {
 *   restPaths: ["/api/orders", "/api/cart"],
 *   graphqlOperations: ["GetOrders", "CreateOrder"],
 * }
 */
const API_ALLOWLIST: NetworkAllowlist = {
  restPaths: [],
  graphqlOperations: [], // Examples: "GetOrders", "CreateOrder"
};

const WAIT_TIMEOUT_MS = 1_000;
const locatorFactories = new Set([
  "locator",
  "getByAltText",
  "getByLabel",
  "getByPlaceholder",
  "getByRole",
  "getByTestId",
  "getByText",
  "getByTitle",
  "filter",
  "first",
  "last",
  "nth",
  "and",
  "or",
  "frameLocator",
  "contentFrame",
  "owner",
  "within",
]);

/**
 * Reads an explicit operationName from a GraphQL GET query or JSON POST body.
 * Returns null for missing names, batched requests, or malformed JSON.
 */
function graphqlOperation(request: Request, url: URL): string | null {
  if (request.method() === "GET") return url.searchParams.get("operationName");
  if (request.method() !== "POST") return null;

  const body = request.postData();
  if (!body) return null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      "operationName" in parsed &&
      typeof parsed.operationName === "string"
    ) {
      return parsed.operationName;
    }
    return null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

/** Checks whether a browser fetch/XHR request is eligible for monitoring. */
function matches(request: Request, allowlist: NetworkAllowlist): boolean {
  if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr")
    return false;

  const url = new URL(request.url());
  if (
    url.hostname === "googleapis.com" ||
    url.hostname.endsWith(".googleapis.com")
  )
    return false;

  if (API_URL_PATTERNS.graphql.some((pattern) => pattern.test(url.pathname))) {
    const operation = graphqlOperation(request, url);
    return (
      operation !== null && allowlist.graphqlOperations.includes(operation)
    );
  }
  return allowlist.restPaths.includes(url.pathname);
}

/** Removes the query string and fragment from URLs included in warnings. */
function safeUrl(request: Request): string {
  const url = new URL(request.url());
  return `${url.origin}${url.pathname}`;
}

/**
 * Playwright test fixture that observes allowlisted requests and waits after
 * wrapped clicks for already-observed requests to finish, up to one second.
 * Timeouts are silent; HTTP 4xx/5xx and network failures produce warnings.
 * Requests starting later and clicks through other page objects are not covered.
 *
 * @example
 * import { test, expect } from "@fixtures/network";
 * test("loads orders", async ({ page }) => {
 *   await page.getByRole("button", { name: "Load orders" }).click();
 *   await expect(page.getByText("Orders")).toBeVisible();
 * });
 */
export const test = base.extend<{ networkAllowlist: NetworkAllowlist }>({
  networkAllowlist: [API_ALLOWLIST, { option: true }],
  page: async ({ page, context, networkAllowlist }, use) => {
    const pending = new Map<
      Request,
      { done: Promise<void>; finish: () => void }
    >();
    const monitored = new WeakSet<Request>();

    const onRequest = (request: Request) => {
      if (!matches(request, networkAllowlist)) return;
      monitored.add(request);
      let finish!: () => void;
      const done = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const timer = setTimeout(() => {
        complete(request);
      }, WAIT_TIMEOUT_MS);
      pending.set(request, {
        done,
        finish: () => {
          clearTimeout(timer);
          finish();
        },
      });
    };
    const complete = (request: Request) => {
      pending.get(request)?.finish();
      pending.delete(request);
    };
    const onResponse = (response: Response) => {
      const request = response.request();
      if (
        monitored.has(request) &&
        response.status() >= 400 &&
        response.status() < 600
      ) {
        console.warn(
          `[network] HTTP ${response.status()}: ${safeUrl(request)}`,
        );
      }
    };
    const onFinished = (request: Request) => complete(request);
    const onFailed = (request: Request) => {
      if (monitored.has(request)) {
        console.warn(
          `[network] Request failed: ${safeUrl(request)} (${request.failure()?.errorText ?? "unknown error"})`,
        );
      }
      complete(request);
    };

    context.on("request", onRequest);
    context.on("response", onResponse);
    context.on("requestfinished", onFinished);
    context.on("requestfailed", onFailed);

    const waitForRequests = async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      const deadline = Date.now() + WAIT_TIMEOUT_MS;
      while (pending.size > 0) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
          Promise.all([...pending.values()].map(({ done }) => done)),
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, remaining);
          }),
        ]);
        if (timer) clearTimeout(timer);
      }
    };

    const wrapResult = (result: unknown) => {
      if (typeof result !== "object" || result === null) {
        throw new TypeError(
          "Expected a Playwright page, locator, frame locator, or mouse",
        );
      }
      return wrapTarget(result);
    };

    const wrapTarget = <T extends object>(object: T): T =>
      new Proxy(object, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (target === page && property === "mouse") return wrapResult(value);
          if (typeof value !== "function" || typeof property !== "string")
            return value;
          if (locatorFactories.has(property)) {
            return (...args: unknown[]) =>
              wrapResult(Reflect.apply(value, target, args));
          }
          if (property === "click") {
            return async (...args: unknown[]) => {
              const result = await Reflect.apply(value, target, args);
              await waitForRequests();
              return result;
            };
          }
          return value.bind(target);
        },
      });

    try {
      await use(wrapTarget(page));
    } finally {
      context.off("request", onRequest);
      context.off("response", onResponse);
      context.off("requestfinished", onFinished);
      context.off("requestfailed", onFailed);
      for (const request of pending.keys()) complete(request);
    }
  },
});
