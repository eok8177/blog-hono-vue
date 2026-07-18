import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8787',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm exec wrangler dev --local --port 8787',
    url: 'http://127.0.0.1:8787/robots.txt',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
