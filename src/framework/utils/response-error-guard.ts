import type { BrowserContext, Request, Response } from "@playwright/test";
import {  isMonitoredRequest, safeRequestUrl } from "./network-requests";
import { GRAPHQL_PATH } from "./network-config";

export type NetworkErrorAllowlist = {
  restPaths: readonly string[];
  graphqlOperations: readonly string[];
};

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
  private notifyFailure!: () => void;
  private signal!: Promise<void>;

  constructor(
    private readonly context: BrowserContext,
    private readonly endpoints: readonly URL[],
    private readonly monitorGraphql: boolean,
    private readonly allowlist: NetworkErrorAllowlist,
  ) {
    this.resetSignal();
    context.on("response", this.onResponse);
    context.on("requestfinished", this.onFinished);
    context.on("requestfailed", this.onFailed);
  }

  private resetSignal(): void {
    this.signal = new Promise<void>((resolve) => { this.notifyFailure = resolve; });
  }

  get failureSignal(): Promise<void> { return this.signal; }

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
    const inspection = (async () => {
      try {
        if (response) await this.inspectResponse(request, response);
        else this.report(`[network] Request finished without a response: ${safeRequestUrl(request)}`);
      } catch (error) {
        this.report(`[network] Unable to inspect response: ${safeRequestUrl(request)} (${error instanceof Error ? error.message : String(error)})`);
      }
    })();
    this.inspections.add(inspection);
    void inspection.finally(() => this.inspections.delete(inspection));
  };

  private readonly onFailed = (request: Request) => {
    if (isMonitoredRequest(request, this.endpoints, this.monitorGraphql) && !this.isAllowed(request)) {
      this.report(`[network] Request failed: ${safeRequestUrl(request)} (${request.failure()?.errorText ?? "unknown error"})`);
    }
    this.responses.delete(request);
  };

  private async inspectResponse(request: Request, response: Response): Promise<void> {
    if (this.isAllowed(request)) return;
    const status = response.status();
    const httpError = status >= 400 && status < 600;
    const url = new URL(request.url());
    const graphql = GRAPHQL_PATH.test(url.pathname);
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
        graphqlError = results.some((result, index) => {
          const hasErrors = typeof result === "object" && result !== null &&
            "errors" in result && Array.isArray(result.errors) && result.errors.length > 0;
          const operation = results.length === operations.length ? operations[index] : null;
          return hasErrors && (operation === null || !this.allowlist.graphqlOperations.includes(operation));
        });
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
    this.context.off("response", this.onResponse);
    this.context.off("requestfinished", this.onFinished);
    this.context.off("requestfailed", this.onFailed);
    await this.flush();
  }
}
