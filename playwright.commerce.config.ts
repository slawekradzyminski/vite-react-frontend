import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './e2e/commerce',
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: 'list',
});
