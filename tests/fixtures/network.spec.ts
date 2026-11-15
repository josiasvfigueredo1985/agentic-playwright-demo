import { test, expect } from './network';

const apiUrl = 'https://example.test/api/orders';

test('waits for all matching requests from a chained locator action', async ({ page }) => {
  let finished = 0;
  page.on('requestfinished', request => {
    if (request.url().startsWith(apiUrl)) finished++;
  });
  await page.route('https://example.test/api/**', async route => {
    await new Promise(resolve => setTimeout(resolve, route.request().url().endsWith('2') ? 200 : 80));
    await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.setContent(`
    <button onclick="fetch('${apiUrl}?item=1'); fetch('${apiUrl}?item=2')">Load</button>
  `);

  await page.getByRole('button').filter({ hasText: 'Load' }).first().click();

  expect(finished).toBe(2);
});

test('does not wait for REST paths outside the allowlist', async ({ page }) => {
  const excludedUrl = 'https://example.test/api/items';
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const requestStarted = new Promise<void>(resolve => { started = resolve; });
  await page.route(excludedUrl, async route => {
    started();
    await gate;
    await route.fulfill({ headers: { 'access-control-allow-origin': '*' } });
  });
  await page.setContent(`<button onclick="fetch('${excludedUrl}')">Load</button>`);

  try {
    const start = Date.now();
    await page.getByRole('button').click();
    expect(Date.now() - start).toBeLessThan(900);
    await requestStarted;
    const response = page.waitForResponse(excludedUrl);
    release();
    await response;
  } finally {
    release();
  }
});

test.describe('with configured GraphQL operations', () => {
  test.use({
    networkAllowlist: {
      restPaths: ['/api/orders', '/api/cart'],
      graphqlOperations: ['GetOrders'],
    },
  });

  for (const method of ['GET', 'POST'] as const) {
    test(`waits for allowlisted GraphQL operations over ${method}`, async ({ page }) => {
      let finished = false;
      const url = 'https://example.test/api/graphql';
      page.on('requestfinished', request => {
        if (request.url().startsWith(url)) finished = true;
      });
      await page.route(`${url}**`, async route => {
        await new Promise(resolve => setTimeout(resolve, 150));
        await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
      });
      const fetchExpression = method === 'GET'
        ? `fetch('${url}?operationName=GetOrders')`
        : `fetch('${url}', {method: 'POST', body: JSON.stringify({operationName: 'GetOrders'})})`;
      await page.setContent(`<button onclick="${fetchExpression}">Load</button>`);

      await page.getByRole('button').click();

      expect(finished).toBe(true);
    });
  }

  for (const body of [
    JSON.stringify({ operationName: 'Unapproved' }),
    JSON.stringify({ query: 'query GetOrders { orders { id } }' }),
    JSON.stringify([{ operationName: 'GetOrders' }]),
    '{',
  ]) {
    test(`ignores GraphQL requests without an approved operation: ${body}`, async ({ page }) => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
      const url = 'https://example.test/graphql';
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      try {
        await page.route(url, async route => {
          await gate;
          await route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } });
        });
        await page.setContent('<button>Load</button>');
        await page.getByRole('button').evaluate((button, requestBody) => {
          button.addEventListener('click', () => {
            void fetch('https://example.test/graphql', { method: 'POST', body: requestBody });
          });
        }, body);
        const response = page.waitForResponse(url);

        const start = Date.now();
        await page.getByRole('button').click();
        expect(Date.now() - start).toBeLessThan(900);
        release();
        await response;
        expect(warnings).toEqual([]);
      } finally {
        release();
        console.warn = originalWarn;
      }
    });
  }
});

test('ignores GraphQL operations when their allowlist is empty', async ({ page }) => {
  const url = 'https://example.test/graphql?operationName=GetOrders';
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  try {
    await page.route(url, route =>
      route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } }));
    await page.setContent(`<button onclick="fetch('${url}')">Load</button>`);
    const response = page.waitForResponse(url);

    await page.getByRole('button').click();
    await response;
    expect(warnings).toEqual([]);
  } finally {
    console.warn = originalWarn;
  }
});

test('ignores Google APIs even when their path is allowlisted', async ({ page }) => {
  const url = 'https://maps.googleapis.com/api/orders';
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  try {
    await page.route(url, route =>
      route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } }));
    await page.setContent(`<button onclick="fetch('${url}')">Load</button>`);
    const response = page.waitForResponse(url);

    await page.getByRole('button').click();
    await response;
    expect(warnings).toEqual([]);
  } finally {
    console.warn = originalWarn;
  }
});

test('waits after a click in a frame', async ({ page }) => {
  let finished = false;
  page.on('requestfinished', request => {
    if (request.url() === apiUrl) finished = true;
  });
  await page.route(apiUrl, async route => {
    await new Promise(resolve => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.setContent(`
    <iframe srcdoc="<button onclick=&quot;fetch('${apiUrl}')&quot;>Load</button>"></iframe>
  `);
  await page.frameLocator('iframe').getByRole('button').click();

  expect(finished).toBe(true);
});

test('waits after a mouse click when a matching request is pending', async ({ page }) => {
  let finished = false;
  page.on('requestfinished', request => {
    if (request.url() === apiUrl) finished = true;
  });
  await page.route(apiUrl, async route => {
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.setContent('<button>Load</button>');
  const box = await page.getByRole('button').boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Button has no bounding box');
  const request = page.waitForEvent('request', item => item.url() === apiUrl);
  await page.evaluate(url => { void fetch(url); }, apiUrl);
  await request;

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  expect(finished).toBe(true);
});

test('waits after a page click', async ({ page }) => {
  let finished = false;
  page.on('requestfinished', request => {
    if (request.url() === apiUrl) finished = true;
  });
  await page.route(apiUrl, async route => {
    await new Promise(resolve => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.setContent(`<button onclick="fetch('${apiUrl}')">Load</button>`);

  await page.click('button');

  expect(finished).toBe(true);
});

test('does not wait for pending requests after non-click actions or before assertions', async ({ page }) => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  try {
    await page.route(apiUrl, async route => {
      await gate;
      await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' } });
    });
    await page.setContent('<input aria-label="Name">');
    const request = page.waitForEvent('request', item => item.url() === apiUrl);
    await page.evaluate(url => { void fetch(url); }, apiUrl);
    await request;

    const input = page.getByRole('textbox', { name: 'Name' });
    await input.fill('Alice');
    await expect(input).toHaveValue('Alice');
    await page.keyboard.press('Tab');
    expect(warnings).toEqual([]);
    const response = page.waitForResponse(apiUrl);
    release();
    await response;
  } finally {
    release();
    console.warn = originalWarn;
  }
});

test('warns about backend errors without failing the test', async ({ page }) => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  try {
    await page.route('https://example.test/api/orders**', route =>
      route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } }));
    await page.setContent(`<button onclick="fetch('${apiUrl}?token=secret')">Load</button>`);

    await page.getByRole('button').click();

    expect(warnings).toContain(`[network] HTTP 503: ${apiUrl}`);
  } finally {
    console.warn = originalWarn;
  }
});

test('does not warn about successful non-200 responses', async ({ page }) => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  try {
    await page.route(apiUrl, route =>
      route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }));
    await page.setContent(`<button onclick="fetch('${apiUrl}')">Load</button>`);

    const response = page.waitForResponse(apiUrl);
    await page.getByRole('button').click();
    await response;

    expect(warnings).toEqual([]);
  } finally {
    console.warn = originalWarn;
  }
});

test('reports failed requests without failing the test', async ({ page }) => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  try {
    await page.route(apiUrl, route => route.abort());
    await page.setContent(`<button onclick="fetch('${apiUrl}').catch(() => {})">Load</button>`);

    await page.getByRole('button').click();

    expect(warnings.some(warning => warning.startsWith(`[network] Request failed: ${apiUrl}`))).toBe(true);
  } finally {
    console.warn = originalWarn;
  }
});

test('silently times out but still reports a later backend error', async ({ page }) => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  try {
    await page.route('https://example.test/api/cart', async route => {
      await gate;
      await route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } });
    });
    await page.setContent(`<button onclick="fetch('https://example.test/api/cart')">Load</button>`);

    const start = Date.now();
    await page.getByRole('button').click();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(900);
    expect(elapsed).toBeLessThan(3_000);
    expect(warnings).toEqual([]);
    const response = page.waitForResponse('https://example.test/api/cart');
    release();
    await response;
    expect(warnings).toEqual(['[network] HTTP 503: https://example.test/api/cart']);
  } finally {
    release();
    console.warn = originalWarn;
  }
});
