# Local Development

This frontend expects the Spring backend from `/Users/admin/IdeaProjects/test-secure-backend` and the deterministic Ollama mock from `/Users/admin/IdeaProjects/ollama-mock`. Everything runs on the host, so `docker ps` should remain empty while you are iterating (the backend and mock are plain JVM processes and the frontend uses the Vite dev server with hot reload on port **8081**).

## TL;DR for the daily workflow

| Service | Location | Command | Notes |
| --- | --- | --- | --- |
| Frontend (Vite) | `vite-react-frontend` | `npm install && npm run dev -- --host 0.0.0.0 --port 8081` | Includes hot reload and Tailwind JIT. |
| Spring backend | `test-secure-backend` | `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` | Listens on `http://localhost:4001`. The local profile already points at the mock Ollama service. |
| Ollama mock | `ollama-mock` | `./mvnw spring-boot:run` | Streams deterministic responses on `http://localhost:11434`. |

If you do need containers later, the `docker-compose.yml` in this repo exposes pre-built images for the backend and the Ollama mock—run `docker compose up backend ollama-mock` from `vite-react-frontend` to mirror the same topology in Docker, but the default workflow keeps everything on the host for faster reloads.

## Step-by-step

1. **Backend**  
   ```
   cd /Users/admin/IdeaProjects/test-secure-backend
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```
   The server sends password reset e-mails to the local outbox endpoint and proxies all `/api/ollama/**` calls to the mock on `localhost:11434`.

2. **Ollama mock**  
   ```
   cd /Users/admin/IdeaProjects/ollama-mock
   ./mvnw spring-boot:run
   ```
   Scenario files in `src/main/resources/scenarios` define every chat/generate/tool response. Update those JSON files if you need new prompts and restart the mock.

3. **Frontend**  
   ```
   cd /Users/admin/IdeaProjects/vite-react-frontend
   npm install
   npm run dev -- --host 0.0.0.0 --port 8081
   ```
   Visit [http://localhost:8081](http://localhost:8081). Hot reload is on by default.

4. **Double-check**  
   Run `docker ps` — it should be empty if you are using the JVM processes above. This is expected for the non-containerised workflow the project currently uses.

## Deterministic LLM behaviour

- `ollama-mock` already ships with curated prompts. The chat scenarios live in `ollama-mock/src/main/resources/scenarios/chat-dialog-scenarios.json`, tool calls in `chat-scenarios.json`, and /generate responses in `generate-scenarios.json`.
- The frontend hooks (`useOllamaChat`, `useOllamaGenerate`, `useOllamaToolChat`) stream SSE tokens through the backend so Playwright/Vitest can assert on real sequences instead of mocked fetch calls.
- When you toggle thinking in the chat or generate pages, the mock emits `thinking` fields per scenario while the tool lane keeps reasoning disabled to match how tool calling is exercised in production.

## Optional docker-compose flow

If you prefer to keep everything inside containers for a quick smoke test:

```
cd /Users/admin/IdeaProjects/vite-react-frontend
docker compose up backend ollama-mock -d
# frontend still runs via npm run dev on port 8081
```

Stop the stack with `docker compose down` when you are done. Remember to switch back to the host processes before resuming feature work so hot reload stays instant.

## Testing checklist

```
npm test             # Vitest (React Testing Library)
npx playwright test  # E2E suite – requires the backend + mock + dev server above
```

Playwright logs in through the API, relies on deterministic Ollama output, and opens the traffic monitor WebSocket, so keep an eye on the backend console if you are debugging.

## Further reading

- `README.md` – high-level project overview plus testing guidelines.
- `docs/function-calling-flow.md` – deep dive into the LLM routing and how tool payloads are streamed through the UI.
