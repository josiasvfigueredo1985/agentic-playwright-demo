import type { Request } from "@playwright/test";
import { GRAPHQL_PATH } from "./network-config";

export function parseRestEndpoints(endpoints: readonly string[]): URL[] {
  return endpoints.map((endpoint) => {
    const url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error(`REST API endpoint must be an HTTP(S) URL without credentials, query, or fragment: ${url.origin}${url.pathname}`);
    }
    return url;
  });
}

export function isMonitoredRequest(
  request: Request,
  endpoints: readonly URL[],
  monitorGraphql: boolean,
): boolean {
  if (request.resourceType() !== "fetch" && request.resourceType() !== "xhr")
    return false;
  const url = new URL(request.url());
  if (url.hostname === "googleapis.com" || url.hostname.endsWith(".googleapis.com")) return false;
  if (GRAPHQL_PATH.test(url.pathname)) return monitorGraphql;
  return endpoints.some((endpoint) => {
    const path = endpoint.pathname.replace(/\/+$/, "") || "/";
    return url.origin === endpoint.origin &&
      (path === "/" || url.pathname === path || url.pathname.startsWith(`${path}/`));
  });
}

export function safeRequestUrl(request: Request): string {
  const url = new URL(request.url());
  return `${url.origin}${url.pathname}`;
}
