# Frontend test and dependency audit (2026-09-27)

## Test selection

The starting suite had 534 passing tests in 67 files. This change removes 43 low-value cases in 12 files and adds six cases that exercise observable behavior. The resulting suite has 497 tests in 55 files.

After a clean `npm ci`, unit tests, the configured coverage thresholds (91.02% lines, 82.65% branches), lint, and production build pass.

- Removed page tests that mocked their only child and checked container classes or mock placement. The corresponding component tests and browser journeys cover the behavior those pages expose. Kept the admin product form page tests because its route parameter changes the form mode.
- Removed prop-forwarding and Radix implementation checks for simple UI wrappers. Kept the input error appearance and spinner's accessible loading text.
- Removed arbitrary timers from `ProductCard` API mocks. The pending state test now controls one promise and waits for the resolved state, preventing a React update after test teardown.
- Added cases for multiple gRPC status codes and SSE malformed or empty final data. Removed an unreachable SSO configuration guard whose values all have nonempty fallbacks.

## Dependency and verification choices

- Updated direct production and development packages, the Node/nginx image pins, and the publish action. `npm audit --audit-level=moderate` reports zero vulnerabilities.
- Kept `@types/node` on Node 24 to match the supported runtime. TypeScript 6.0.3 is the newest release within the current `typescript-eslint` peer range (`<6.1.0`).
- Kept Vitest 4.1.11 with Stryker 10. With Vitest 5.0.2, the same targeted mutation run reported 32 killed and 581 survived out of 620 mutants despite passing unit tests. Restoring Vitest 4 made the targeted run behave normally. Do not interpret the Vitest 5 result as a test-quality regression.
- CI now runs ESLint between unit tests and the production build. The generated coverage report is ignored by Git and ESLint.

## Mutation feedback

The targeted run is advisory: 608 mutants, 568 killed, 8 timed out, 26 survived, and 6 without coverage. There is no aggregate percentage gate.

The added tests killed the surviving gRPC separator and three SSE parsing mutants. Removing the unreachable SSO guard also removed mutants of an impossible branch. Remaining SSE survivors largely change whitespace handling already ignored by `JSON.parse`, empty chunk processing, or console text. The GraphQL error constructor's empty-error survivor cannot occur through the API path, which constructs it only when `errors.length > 0`. The two SSO redirect trimming survivors are normalized by `URL` parsing.

Some SSO survivors concern unavailable browser storage and callback cleanup. One apparent nonce-storage survivor was assigned only the social-login test by Stryker's per-test coverage map, although the ordinary login test asserts the stored nonce. Review those individually when changing SSO behavior; do not add duplicate assertions solely to raise the aggregate score.
