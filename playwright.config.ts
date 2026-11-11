import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: '.playwright-results/report', open: 'never' }], ['list']],
  outputDir: '.playwright-results/artifacts',
  use: {
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'saucedemo',
      testDir: './tests/saucedemo',
      use: { baseURL: 'https://saucedemo.com', testIdAttribute: 'data-test' },
    },
    {
      name: 'serverest',
      testDir: './tests/serverest',
      use: { baseURL: 'https://front.serverest.dev', testIdAttribute: 'data-testid' },
    },
  ],
  timeout: 30_000,
});
