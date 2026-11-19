import type { BrowserContext, Request, Response } from "@playwright/test";
import { isMonitoredRequest, safeRequestUrl } from "./network-requests";
import { GRAPHQL_PATH } from "./network-config";

export type NetworkErrorAllowlist = {
  restPaths: readonly string[];
  graphqlOperations: readonly string[];
};

/** An error that must occur on the next matching monitored request. */
export type ExpectedNetworkError =
  | { restPath: string; status: number; query?: Readonly<Record<string, string>> }
  | { graphqlOperation: string; status?: number };

function describeExpectation(expected: ExpectedNetworkError): string {
  const target = "restPath" in expected
    ? `REST path ${expected.restPath}${Object.keys(expected.query ?? {}).length ? " with the specified query parameters" : ""}`
    : `GraphQL operation ${expected.graphqlOperation}`;
  return `${expected.status === undefined ? "a GraphQL errors payload" : `HTTP ${expected.status}`} for ${target}`;
}

function graphqlOperations(request: Request, url: URL): (string | null)[] {
  if (request.method() === "GET") return [url.searchParams.get("operationName")];
  const body = request.postData();
  if (request.method() !== "POST" || !body) return [null];
  try {
    const parsed: unknown = JSON.parse(body);
    const operations: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    if (!operations.length) return [null];
    return operations.map((operation) =>
      typeof operation === "object" && operation !== null &&
      "operationName" in operation && typeof operation.operationName === "string"
        ? operation.operationName : null,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return [null];
    throw error;
  }
}

export class ResponseErrorGuard {
  private readonly responses = new Map<Request, Response>();
  private readonly inspections = new Set<Promise<void>>();
  private readonly failures: string[] = [];
  private readonly armed: ExpectedNetworkError[] = [];
  private readonly claimed = new Map<Request, ExpectedNetworkError>();
  private notifyFailure!: () => void;
  private signal!: Promise<void>;

  constructor(
    private readonly context: BrowserContext,
    private readonly endpoints: readonly URL[],
    private readonly monitorGraphql: boolean,
    private readonly allowlist: NetworkErrorAllowlist,
  ) {
    this.resetSignal();
    context.on("request", this.onRequest);
    context.on("response", this.onResponse);
    context.on("requestfinished", this.onFinished);
    context.on("requestfailed", this.onFailed);
  }

  private resetSignal(): void {
    this.signal = new Promise<void>((resolve) => { this.notifyFailure = resolve; });
  }

  get failureSignal(): Promise<void> { return this.signal; }

  /** Exempts one matching error, without changing monitoring or the static allowlist. */
  expectNextError(expected: ExpectedNetworkError): void {
    if (expected.status !== undefined &&
      (!Number.isInteger(expected.status) || expected.status < 400 || expected.status > 599)) {
      throw new Error("[network] Expected HTTP error status must be an integer from 400 to 599");
    }
    if ("restPath" in expected) {
      if (!expected.restPath.startsWith("/") || /[?#]/.test(expected.restPath)) {
        throw new Error("[network] Expected REST error requires an exact pathname without a query or fragment");
      }
    } else if (!this.monitorGraphql || !/^[_A-Za-z][_0-9A-Za-z]*$/.test(expected.graphqlOperation)) {
      throw new Error("[network] Expected GraphQL error requires monitoring enabled and a valid operation name");
    }
    this.armed.push("restPath" in expected
      ? { ...expected, query: { ...expected.query } }
      : { ...expected });
  }

  private readonly onRequest = (request: Request) => {
    if (!this.armed.length || !isMonitoredRequest(request, this.endpoints, this.monitorGraphql)) return;
    const url = new URL(request.url());
    const operations = GRAPHQL_PATH.test(url.pathname) ? graphqlOperations(request, url) : null;
    const index = this.armed.findIndex((expected) => {
      if (!("restPath" in expected)) return operations?.includes(expected.graphqlOperation);
      return operations === null && url.pathname === expected.restPath &&
        Object.entries(expected.query ?? {}).every(([name, value]) => {
          const values = url.searchParams.getAll(name);
          return values.length === 1 && values[0] === value;
        });
    });
    if (index >= 0) this.claimed.set(request, this.armed.splice(index, 1)[0]);
  };

  private reportMismatch(expected: ExpectedNetworkError, actual: string): void {
    this.report(`[network] Expected ${describeExpectation(expected)} on the next matching request, but ${actual}`);
  }

  private report(message: string): void {
    this.failures.push(message);
    this.notifyFailure();
  }

  takeFailures(): string[] {
    if (!this.failures.length) return [];
    const messages = this.failures.splice(0);
    this.resetSignal();
    return messages;
  }

  private isAllowed(request: Request): boolean {
    const url = new URL(request.url());
    if (GRAPHQL_PATH.test(url.pathname)) {
      return graphqlOperations(request, url).every(
        (operation) => operation !== null && this.allowlist.graphqlOperations.includes(operation),
      );
    }
    return this.allowlist.restPaths.includes(url.pathname);
  }

  private readonly onResponse = (response: Response) => {
    if (isMonitoredRequest(response.request(), this.endpoints, this.monitorGraphql)) this.responses.set(response.request(), response);
  };

  private readonly onFinished = (request: Request) => {
    if (!isMonitoredRequest(request, this.endpoints, this.monitorGraphql)) return;
    const response = this.responses.get(request);
    this.responses.delete(request);
    const expected = this.claimed.get(request);
    this.claimed.delete(request);
    const inspection = (async () => {
      try {
        if (response) await this.inspectResponse(request, response, expected);
        else if (expected) this.reportMismatch(expected, "the request finished without a response");
        else this.report(`[network] Request finished without a response: ${safeRequestUrl(request)}`);
      } catch (error) {
        this.report(`[network] Unable to inspect response: ${safeRequestUrl(request)} (${error instanceof Error ? error.message : String(error)})`);
      }
    })();
    this.inspections.add(inspection);
    void inspection.finally(() => this.inspections.delete(inspection));
  };

  private readonly onFailed = (request: Request) => {
    const expected = this.claimed.get(request);
    this.claimed.delete(request);
    if (expected) {
      this.reportMismatch(expected, `the request failed before completing (${request.failure()?.errorText ?? "unknown error"})`);
    } else if (isMonitoredRequest(request, this.endpoints, this.monitorGraphql) && !this.isAllowed(request)) {
      this.report(`[network] Request failed: ${safeRequestUrl(request)} (${request.failure()?.errorText ?? "unknown error"})`);
    }
    this.responses.delete(request);
  };

  private async inspectResponse(request: Request, response: Response, expected?: ExpectedNetworkError): Promise<void> {
    if (!expected && this.isAllowed(request)) return;
    const status = response.status();
    const httpError = status >= 400 && status < 600;
    const url = new URL(request.url());
    const graphql = GRAPHQL_PATH.test(url.pathname);
    if (expected?.status !== undefined) {
      if (expected.status === status && (!graphql || graphqlOperations(request, url).length === 1)) return;
      this.reportMismatch(expected, expected.status === status
        ? `HTTP ${status} applied to a GraphQL batch, not a single operation`
        : `the response was HTTP ${status}`);
    } else if (expected && httpError) {
      this.reportMismatch(expected, `the response was HTTP ${status}`);
    }
    if (!httpError && !graphql) return;

    let body: string;
    try {
      body = await response.text();
    } catch (error) {
      this.report(`[network] HTTP ${status}: ${safeRequestUrl(request)}\nUnable to read response body: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    let graphqlError = false;
    if (graphql && !httpError) {
      try {
        const parsed: unknown = JSON.parse(body);
        const results: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
        const operations = graphqlOperations(request, url);
        const alignedOperations = results.length === operations.length ? operations : [];
        const expectedOperation = expected && "graphqlOperation" in expected && expected.status === undefined
          ? expected.graphqlOperation : undefined;
        const expectedIndex = expectedOperation && alignedOperations.filter((name) => name === expectedOperation).length === 1
          ? alignedOperations.indexOf(expectedOperation) : -1;
        const errorResults = results.map((result) => typeof result === "object" && result !== null &&
          "errors" in result && Array.isArray(result.errors) && result.errors.length > 0);
        graphqlError = errorResults.some((hasErrors, index) =>
          hasErrors && index !== expectedIndex &&
          !this.allowlist.graphqlOperations.some((name) => name === alignedOperations[index]),
        );
        if (expected && expected.status === undefined && !errorResults[expectedIndex]) {
          this.reportMismatch(expected, `the response was HTTP ${status} without a matching errors payload`);
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        this.report(`[network] Invalid GraphQL JSON response, HTTP ${status}: ${safeRequestUrl(request)}\nResponse body: ${body}`);
        return;
      }
    }
    if (httpError || graphqlError) {
      this.report(`[network] ${graphqlError ? "GraphQL error, " : ""}HTTP ${status}: ${safeRequestUrl(request)}\nResponse body: ${body}`);
    }
  }

  async flush(): Promise<void> {
    await Promise.all(this.inspections);
  }

  async dispose(): Promise<void> {
    this.context.off("request", this.onRequest);
    this.context.off("response", this.onResponse);
    this.context.off("requestfinished", this.onFinished);
    this.context.off("requestfailed", this.onFailed);
    await this.flush();
    for (const expected of this.armed.splice(0)) this.reportMismatch(expected, "no matching monitored request started");
    for (const expected of this.claimed.values()) this.reportMismatch(expected, "the request did not complete before monitoring ended");
    this.claimed.clear();
  }
}
