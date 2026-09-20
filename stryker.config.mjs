/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/lib/commerceGraphql.ts',
    'src/lib/commerceTransport.ts',
    'src/lib/runtimeConfig.ts',
    'src/lib/sse.ts',
    'src/lib/sso.ts',
    'src/lib/trafficPresentation.ts',
  ],
  vitest: { configFile: 'vitest.mutation.config.ts' },
  reporters: ['clear-text', 'html', 'json'],
  concurrency: 4,
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
};
