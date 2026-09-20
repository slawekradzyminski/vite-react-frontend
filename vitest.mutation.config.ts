import { defineConfig } from 'vitest/config';

// Select tests here, not with Stryker's testFiles option: Stryker 9.6.1 activates
// static mutants too late when testFiles creates a filter (stryker-js#6144).
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/lib/commerceGraphql.test.ts',
      'src/lib/trafficPresentation.test.ts',
      'src/lib/commerceTransport.test.ts',
      'src/lib/runtimeConfig.test.ts',
      'src/lib/sse.test.ts',
      'src/lib/sso.test.ts',
    ],
  },
  define: { global: 'window' },
});
