import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: 'artifacts/reports/playwright-report', open: 'never' }], ['list']],
  outputFolder: 'artifacts/evidence/test-results',
  use: {
    baseURL: 'https://saucedemo.com',
    browserName: 'chromium',
    testIdAttribute: 'data-test',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  timeout: 30_000,
});
