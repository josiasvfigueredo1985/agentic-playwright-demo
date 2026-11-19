import type { Page } from "@playwright/test";

const BINDING = "__playwrightUiErrorGuard";
const FLUSH = "__playwrightUiErrorGuardFlush";

function installObserver(config: { selectors: readonly string[]; binding: string; flush: string }) {
  const selector = config.selectors.join(",");
  const pending = new Set<Promise<void>>();
  const seen = new Set<string>();
  const errors: unknown[] = [];

  const scan = () => {
    if (!selector) return;
    for (const element of document.querySelectorAll(selector)) {
      if (!(element instanceof HTMLElement)) continue;
      const style = getComputedStyle(element);
      if (!element.getClientRects().length || style.visibility !== "visible") continue;
      const text = element.innerText.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const binding: unknown = Reflect.get(window, config.binding);
      if (typeof binding !== "function") throw new Error("UI error guard binding is unavailable");
      const task: Promise<void> = Promise.resolve(binding(text));
      pending.add(task);
      void task.then(
        () => pending.delete(task),
        (error: unknown) => { pending.delete(task); errors.push(error); },
      );
    }
  };
  Reflect.set(window, config.flush, async () => {
    scan();
    await Promise.all(pending);
    if (errors.length) throw new Error(`UI error guard could not report an alert: ${String(errors[0])}`);
  });
  const observer = new MutationObserver(scan);
  observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  scan();
}

export class UiErrorGuard {
  private readonly failures = new Set<string>();

  constructor(
    private readonly page: Page,
    private readonly selectors: readonly string[],
    private readonly allowedMessages: readonly string[],
  ) {}

  async start(): Promise<void> {
    await this.page.exposeBinding(BINDING, (_source, text: unknown) => {
      if (typeof text !== "string") throw new TypeError("Invalid UI error message");
      if (!this.allowedMessages.includes(text)) this.failures.add(text);
    });
    const config = { selectors: this.selectors, binding: BINDING, flush: FLUSH };
    await this.page.addInitScript(installObserver, config);
    await this.page.evaluate(installObserver, config);
  }

  async flush(): Promise<void> {
    if (this.page.isClosed()) return;
    for (const frame of this.page.frames()) {
      if (frame.isDetached()) continue;
      await frame.evaluate(async (name) => {
        const flush: unknown = Reflect.get(window, name);
        if (typeof flush !== "function") throw new Error("UI error guard is not installed");
        await flush();
      }, FLUSH);
    }
  }

  takeFailures(): string[] {
    if (!this.failures.size) return [];
    const messages = [...this.failures];
    this.failures.clear();
    return [`[ui] Unexpected visible error message(s):\n${messages.join("\n")}`];
  }
}
