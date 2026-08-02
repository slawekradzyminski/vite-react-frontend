/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/lib/runtimeConfig.ts',
    'src/lib/sse.ts',
    'src/lib/sso.ts',
  ],
  testFiles: [
    'src/lib/runtimeConfig.test.ts',
    'src/lib/sse.test.ts',
    'src/lib/sso.test.ts',
  ],
  reporters: ['clear-text', 'html', 'json'],
  concurrency: 4,
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
};
