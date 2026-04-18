import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.APP_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8081';
const startDevServer = process.env.PLAYWRIGHT_START_DEV_SERVER === 'true';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  timeout: 15000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: startDevServer
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
});
