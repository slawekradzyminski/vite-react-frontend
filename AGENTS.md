# AGENTS

This section points other automation or human teammates to the right document for each environment.

## Local iteration (host processes)

- [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) – explains how to run the frontend via `npm run dev`, the Spring backend from `/Users/admin/IdeaProjects/test-secure-backend`, and the deterministic `ollama-mock` service side by side. It also documents why `docker ps` should stay empty during day-to-day work and how to run Vitest/Playwright.

## Full dockerised stack

- [`../awesome-localstack/DOCKERISED_LOCALSTACK.md`](../awesome-localstack/DOCKERISED_LOCALSTACK.md) – lives in the sibling repository and describes the all-in-one docker-compose environment (frontend, backend, Postgres, ActiveMQ, Mailhog, consumer, Influx, Ollama, Grafana, etc.) plus the helper scripts to start or prune it.

## LLM implementation notes

- [`docs/function-calling-flow.md`](./docs/function-calling-flow.md) – diagrams the message flow for chat, generate, and tool calling, which helps when triaging SSE events or tool payloads.
- [`implementation_plan_llm.md`](./implementation_plan_llm.md) – historic context on why the workspace has three modes and what the rollout expectations are.
