# Function Calling Flow (Backend + Frontend)

This project demonstrates Ollama function calling end-to-end: listing products, fetching detailed snapshots, and streaming every step to the UI.

## Backend flow
1) **Endpoint**: `POST /api/ollama/chat/tools` (SSE, text/event-stream).
2) **Model loop** (`OllamaFunctionCallingService`):
   - Sends the full chat history + tool definitions to `/api/chat` on Ollama (streaming enabled).
   - Emits every chunk downstream (so the UI sees tool calls as they happen).
   - If the model returns `tool_calls`, each call is executed via `OllamaToolRegistry`, and a `role=tool` message is appended to history.
   - Replays the augmented history until no more tool calls remain or max iterations hit.
3) **Tools exposed** (`OllamaToolDefinitionCatalog`):
   - `list_products`: lightweight catalog slice (id + name); supports `offset`, `limit`, `category`, `inStockOnly`.
   - `get_product_snapshot`: full details for a product by `productId` or `name`.
4) **Default system prompt** (`UserService.DEFAULT_SYSTEM_PROMPT`):
   - For broad asks: call `list_products` (category, inStockOnly), then call `get_product_snapshot` for *every* product returned/referenced before replying.
   - For specific asks: call `get_product_snapshot` immediately.
   - No hallucinations; always ground responses in tool output.

## Frontend flow (what trainees should see)
1) **Auth & setup**
   - Sign in to get a JWT; all LLM calls send `Authorization: Bearer <token>`.
   - Fetch tool definitions from `/api/ollama/chat/tools/definitions` and pass them to the chat request.
   - Fetch the system prompt from `/users/system-prompt` and seed it as the first `system` message.
2) **Hook & streaming**
   - `useOllamaToolChat` builds the request with `model`, `messages`, `tools`, `options`, `think`.
   - `processSSEResponse` consumes SSE chunks so tokens and tool events render live.
3) **UI tabs and defaults**
   - `/llm` exposes three tabs: **Chat** → `/api/ollama/chat` via `useOllamaChat`, **Generate** → `/api/ollama/generate` via `useOllamaGenerate`, and **Tools** → `/api/ollama/chat/tools` via `useOllamaToolChat`.
   - Chat/Generate default to `qwen3:0.6b` so the mock can emit thinking traces; both tabs expose the thinking toggle.
   - Tools pins the model to `qwen3:4b-instruct` (function calling) and disables thinking because that model does not output the `<think>` stream.
   - All tabs use the shared `ChatTranscript` component so assistant/tool bubbles remain consistent no matter which flow emitted them.
3) **On screen, live**
   - As soon as the model emits `tool_calls`, you see a “Requesting backend function …” line with arguments.
   - When the backend executes the tool, the `role=tool` result appears **immediately under** the tool call (not at the end of the chat).
   - A fresh assistant bubble is inserted below that, and tokens stream into it live.
   - Final completion arrives after all required tool calls finish.
4) **Expected behavior for the iPhone prompt**
   - Prompt: “How many iPhones do you have? Tell me details about them. Please show details for every iPhone you list.”
   - Flow: `list_products` (electronics, inStockOnly true) → one `get_product_snapshot` per returned iPhone → assistant reply grounded in those snapshots.
   - Attendees should see: tool call → tool response → streaming answer, in order, without waiting for the end.

## Curl recipe (manual test)
```bash
TOKEN=$(curl -s -X POST http://localhost:4001/users/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"<user>","password":"<pass>"}' | jq -r '.token')

TOOLS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4001/api/ollama/chat/tools/definitions)
PROMPT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4001/users/system-prompt | jq -r '.systemPrompt')

jq -n --arg prompt "$PROMPT" \
      --arg user "How many iPhones do you have? Tell me details about them. Please show details for every iPhone you list." \
      --argjson tools "$TOOLS" \
      '{model:"qwen3:4b-instruct",
        messages:[{role:"system",content:$prompt},{role:"user",content:$user}],
        tools:$tools, think:false, options:{temperature:0}}' \
| curl -N -X POST http://localhost:4001/api/ollama/chat/tools \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d @-
```

## Notes
- Streaming is SSE; keep `-N` (no-buffer) in curl to see tokens live.
- Backend runs blocking Ollama calls on `boundedElastic` to avoid starving the event loop, so chunks flush promptly to the client.
- If you only see one tool call, ensure the system prompt and tool definitions are included; the prompt mandates snapshot calls for every listed product.
