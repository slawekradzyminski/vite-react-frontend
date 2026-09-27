import { defineConfig } from 'vitest/config';

// Keep the focused mutation suite separate from the fast unit-test configuration.
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
