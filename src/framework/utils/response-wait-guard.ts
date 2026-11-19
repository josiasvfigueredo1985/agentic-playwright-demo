import { setImmediate } from "node:timers";
import type { BrowserContext, Request } from "@playwright/test";
import { isMonitoredRequest } from "./network-requests";

export class ResponseWaitGuard {
  private readonly pending = new Map<Request, { done: Promise<void>; finish: () => void }>();

  constructor(
    private readonly context: BrowserContext,
    private readonly endpoints: readonly URL[],
    private readonly monitorGraphql: boolean,
  ) {
    context.on("request", this.onRequest);
    context.on("requestfinished", this.onComplete);
    context.on("requestfailed", this.onComplete);
  }

  private readonly onRequest = (request: Request) => {
    if (!isMonitoredRequest(request, this.endpoints, this.monitorGraphql)) return;
    let finish!: () => void;
    const done = new Promise<void>((resolve) => { finish = resolve; });
    this.pending.set(request, { done, finish });
  };

  private readonly onComplete = (request: Request) => {
    this.pending.get(request)?.finish();
    this.pending.delete(request);
  };

  async wait(timeoutMs: number, failureSignal: Promise<void>): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
    const deadline = Date.now() + timeoutMs;
    while (this.pending.size > 0) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const outcome = await Promise.race([
        Promise.all([...this.pending.values()].map(({ done }) => done)).then(() => "complete"),
        failureSignal.then(() => "failure"),
        new Promise<"timeout">((resolve) => {
          timer = setTimeout(() => resolve("timeout"), remaining);
        }),
      ]);
      if (timer) clearTimeout(timer);
      if (outcome !== "complete") return;
    }
  }

  dispose(): void {
    this.context.off("request", this.onRequest);
    this.context.off("requestfinished", this.onComplete);
    this.context.off("requestfailed", this.onComplete);
    for (const request of this.pending.keys()) this.onComplete(request);
  }
}
