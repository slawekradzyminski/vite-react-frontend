# AGENTS

This section points other automation or human teammates to the right document for each environment.

## Local iteration (host processes)

- [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) – explains how to run the frontend via `npm run dev`, the Spring backend from `/Users/admin/IdeaProjects/test-secure-backend`, and the deterministic `ollama-mock` service side by side. It also documents why `docker ps` should stay empty during day-to-day work and how to run Vitest/Playwright.

## Full dockerised stack

- [`docker-compose.yml`](./docker-compose.yml) – CI and Playwright stack for this frontend. It builds the production frontend nginx image, starts backend, warehouse-service, payment-service, and the Ollama mock, then exposes everything through an nginx gateway on `http://localhost:8081`.
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

- There are three OpenAPI snapshots. Never edit a snapshot or its generated types by hand.
  - [`openapi/backend-api-docs.json`](./openapi/backend-api-docs.json) is the document of the backend image pinned in `docker-compose.yml`; `src/types/generated/backend-api.ts` is generated from it.
  - [`openapi/warehouse-api-docs.json`](./openapi/warehouse-api-docs.json) is the document of warehouse-service (shipments, tracking, returns, suppliers, purchase orders, reorder suggestions); `src/types/generated/warehouse-api.ts` is generated from it. The gateway exposes it at `/warehouse/v3/api-docs`. A build with `VITE_WAREHOUSE_ENABLED=false` hides its screens.
  - [`openapi/payment-api-docs.json`](./openapi/payment-api-docs.json) is the document of payment-service (card payments, 3-D Secure, admin payment list); `src/types/generated/payment-api.ts` is generated from it. The gateway exposes it at `/payment/v3/api-docs`. A build with `VITE_PAYMENT_ENABLED=false` hides its screens.
- When you bump the backend pin, start the stack and run `npm run api:snapshot`; for warehouse-service run `npm run api:snapshot:warehouse`, for payment-service `npm run api:snapshot:payment`. Then fix every error `npm run typecheck` reports. `npm run api:generate` regenerates all three type files. CI fails the E2E job when the pinned backend no longer matches the snapshot (`npm run api:check`) and the unit job when a generated type file is stale. `npm run api:check:warehouse` and `npm run api:check:payment` compare a running warehouse-service and payment-service the same way.
- Take warehouse aliases in [`src/types/commerce.ts`](./src/types/commerce.ts) from `generated/warehouse-api`, payment aliases in [`src/types/payment.ts`](./src/types/payment.ts) from `generated/payment-api`, everything else from `generated/backend-api`. Warehouse calls in `src/lib/api.ts` go through the warehouse axios instance (`VITE_WAREHOUSE_API_BASE_URL`) and payment calls through the payment instance (`VITE_PAYMENT_API_BASE_URL`); both default to the API base URL and share the auth and token-refresh interceptors.
- [`src/types/apiContract.test.ts`](./src/types/apiContract.test.ts) checks the hand-written types in `src/types` against the snapshots at compile time. Add a mapping there when you add an API type.
- Playwright mocks serve bodies through [`e2e/mocks/backendContract.ts`](./e2e/mocks/backendContract.ts), so a mock cannot invent fields the backend does not send. Type new mocks the same way.

## LLM implementation notes

- [`docs/function-calling-flow.md`](./docs/function-calling-flow.md) – diagrams the message flow for chat, generate, and tool calling, which helps when triaging SSE events or tool payloads.

## Mutation-testing feedback

- Run `npm test` first, then `npm run test:mutation` after changing runtime URLs and flags (API, warehouse and payment base URLs, warehouse and payment flags), SSE behavior, the API client and token refresh on any axios instance, auth storage, role checks, route protection, or their tests.
- Stryker runs incrementally and keeps its state in `reports/stryker-incremental.json`, so repeat runs only re-test changed code and tests. Run `npx stryker run --force` for a full baseline.
- Treat `NoCoverage` as a reachability gap and `Survived` as an assertion gap. For each meaningful survivor, add a test that passes on the original code and fails on that mutant.
- Prioritize authentication and token-refresh invariants, redirect safety, and lossless stream parsing. Do not add brittle implementation-detail assertions solely to increase the score.
- The initial score is advisory. On pull requests, reject new meaningful survivors in changed high-risk code; keep broader mutation-score trend checks outside the fast test loop.
