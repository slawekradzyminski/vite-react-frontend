# LLM Experience – Phased Implementation Plan

## Phase 1 – Frontend tab split and model defaults
- Introduce a dedicated “Tools” tab so `/llm` exposes Chat, Generate, and Tool Calling as separate surfaces.
- Update `OllamaChatPage` so the plain chat flow always uses `useOllamaChat`, while the new tool tab relies exclusively on `useOllamaToolChat`.
- Remove the runtime toggle that mixed tool/normal chat, simplify props, and make sure the UI explains which scenarios live in each tab.
- Set default models to `qwen3:0.6b` for chat/generate hooks and keep `qwen3:4b-instruct` only for tool calling; hide the thinking switch in the tool tab because that model does not support it.

## Phase 2 – Test harness + mock wiring
- Rework Playwright page objects/tests to reflect the three-tab layout (e.g., separate helpers for tool mode vs chat/generate).
- Replace handcrafted network intercepts with expectations driven by the running `ollama-mock` service so tests observe the same streaming patterns as the backend.
- The tests will now depend on both backend and ollama-mock services. These will start as part of `docker-compose up` before the tests are run. It is already configured in the CI GitHub Actions workflow.
- Add any config or env plumbing (e.g., base URLs, fixture helpers) needed for the Playwright suite to talk to the backend fed by the mock without flaky timing.

## Phase 3 – Polish and verification
- Update documentation/readme snippets if they mention only two tabs or the former toggle.
- Run relevant unit/e2e suites, capture issues, and tune UI copy/tests based on the actual `ollama-mock` responses.
- Double-check accessibility/test ids so QA automation keeps stable selectors across all three interaction modes.
