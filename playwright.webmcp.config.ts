import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/webmcp',
  outputDir: 'reports/webmcp/artifacts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [['list'], ['json', { outputFile: 'reports/webmcp/tests.json' }]],
  use: {
    baseURL: 'http://localhost:5180',
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--enable-features=WebMCP'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run demo:webmcp',
    url: 'http://localhost:5180/login',
    reuseExistingServer: !process.env.CI,
  },
});
