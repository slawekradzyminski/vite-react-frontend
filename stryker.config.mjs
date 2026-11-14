/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  mutate: [
    'src/lib/commerceGraphql.ts',
    'src/lib/commerceTransport.ts',
    'src/lib/runtimeConfig.ts',
    'src/lib/sse.ts',
    'src/lib/trafficPresentation.ts',
    // Reservation deadline and expiry detection drive the order and payment pages.
    'src/lib/reservation.ts',
    // Authentication and authorization: token refresh, storage, roles, route guard.
    'src/lib/api.ts',
    'src/lib/authStorage.ts',
    'src/lib/roles.ts',
    'src/components/ProtectedRoute.tsx',
  ],
  // Re-test only mutants affected by changed code or tests; use --force for a full run.
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  vitest: { configFile: 'vitest.mutation.config.ts' },
  reporters: ['clear-text', 'html', 'json'],
  concurrency: 4,
  thresholds: {
    break: null,
  },
};
