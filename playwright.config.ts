import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: '.playwright-results/report', open: 'never' }], ['list']],
  outputFolder: '.playwright-results/artifacts',
  use: {
    baseURL: 'https://saucedemo.com',
    browserName: 'chromium',
    testIdAttribute: 'data-test',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  timeout: 30_000,
});
