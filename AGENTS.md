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

## LLM implementation notes

- [`docs/function-calling-flow.md`](./docs/function-calling-flow.md) – diagrams the message flow for chat, generate, and tool calling, which helps when triaging SSE events or tool payloads.
