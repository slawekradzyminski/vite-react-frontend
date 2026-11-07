# AGENTS

This section points other automation or human teammates to the right document for each environment.

## Local iteration (host processes)

- [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) – explains how to run the frontend via `npm run dev`, the Spring backend from `/Users/admin/IdeaProjects/test-secure-backend`, and the deterministic `ollama-mock` service side by side. It also documents why `docker ps` should stay empty during day-to-day work and how to run Vitest/Playwright.

## Full dockerised stack

- [`docker-compose.yml`](./docker-compose.yml) – CI and Playwright stack for this frontend. It builds the production frontend nginx image, starts backend, Keycloak, and the Ollama mock, then exposes everything through an nginx gateway on `http://localhost:8081`.
- [`awesome-localstack/README.md`](../awesome-localstack/README.md) – main reference describing every docker-compose flavour (full stack, CI slice, lightweight variant) plus helper scripts. It includes the monitoring/LLM notes that are reused during trainings.

## Deployment asset rule

- In `awesome-localstack`, the gateway owns `/images/...` and serves that path directly from its own mounted volume.
- Do not place frontend-only branding assets under `/images/...` if they must work behind the gateway.
- Use a separate public prefix such as `/branding/...` for frontend logos, favicons, and similar files.
- If deployed branding assets 404 while they exist in the frontend image, inspect the gateway config before changing Vite or nginx in this repo.

## Test IDs

- Give every button, link, form control, form, and `role="alert"`/`role="status"` element a kebab-case `data-testid` prefixed with its feature, for example `inventory-apply-adjustment` or `mfa-recovery-copy`.
- Suffix repeated list items with a stable key, for example `inventory-movement-${movement.id}`.
- [`src/test/testIdCoverage.test.ts`](./src/test/testIdCoverage.test.ts) fails when one is missing. Components that spread props or render through `asChild` pass the caller's ID through and are skipped.

## Backend API contract

- [`openapi/backend-api-docs.json`](./openapi/backend-api-docs.json) is the OpenAPI document of the backend image pinned in `docker-compose.yml`. `src/types/generated/backend-api.ts` is generated from it; never edit either by hand.
- When you bump the backend pin, start the stack and run `npm run api:snapshot`, then fix every error `npm run typecheck` reports. CI fails the E2E job when the pinned backend no longer matches the snapshot (`npm run api:check`) and the unit job when the generated types are stale.
- [`src/types/apiContract.test.ts`](./src/types/apiContract.test.ts) checks the hand-written types in `src/types` against the snapshot at compile time. Add a mapping there when you add an API type.
- Playwright mocks serve bodies through [`e2e/mocks/backendContract.ts`](./e2e/mocks/backendContract.ts), so a mock cannot invent fields the backend does not send. Type new mocks the same way.

## LLM implementation notes

- [`docs/function-calling-flow.md`](./docs/function-calling-flow.md) – diagrams the message flow for chat, generate, and tool calling, which helps when triaging SSE events or tool payloads.

## Mutation-testing feedback

- Run `npm test` first, then `npm run test:mutation` after changing SSO, runtime URL, SSE behavior, or their tests.
- Treat `NoCoverage` as a reachability gap and `Survived` as an assertion gap. For each meaningful survivor, add a test that passes on the original code and fails on that mutant.
- Prioritize authentication/PKCE invariants, callback failure paths, redirect safety, and lossless stream parsing. Do not add brittle implementation-detail assertions solely to increase the score.
- The initial score is advisory. On pull requests, reject new meaningful survivors in changed high-risk code; keep broader mutation-score trend checks outside the fast test loop.
