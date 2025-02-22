# Chat LLM Implementation Plan

## 1. Backend

### 1.1 Overview
You'll create a POST `/api/ollama/chat` endpoint that:

- Accepts a list of messages alongside a model name
- Passes the entire conversation to Ollama's POST `/api/chat`
- Streams partial responses back to the client via SSE

### 1.2 Data Transfer Objects (DTOs)

#### ChatMessageDto
- `role`: string – "system" | "user" | "assistant"
- `content`: string – The message text

#### ChatRequestDto
- `model`: string – Model name, e.g., "llama3.2:1b"
- `messages`: List<ChatMessageDto> – Entire conversation
- `options?`: Map<String, Object> – Optional generation parameters
- `stream`: Boolean – Typically defaulted to true
- `keepAlive`: number – Typically defaulted, for instance 10000

#### ChatResponseDto
- `model`: string – Echos back the model used
- `createdAt`: string – Timestamp from Ollama
- `message`: ChatMessageDto – Partial or final chunk of AI output
- `done`: boolean – true if final chunk

### 1.3 Service Layer: OllamaService
Adds a method for streaming chat responses:

```java
public Flux<ChatResponseDto> chat(ChatRequestDto request) {
    return ollamaWebClient
        .post()
        .uri("/api/chat")
        .bodyValue(request)
        .retrieve()
        .bodyToFlux(ChatResponseDto.class)
        .doOnNext(chunk -> log.debug("Received chunk: {}", chunk))
        .doOnError(ex -> log.error("Error during chat streaming: {}", ex.getMessage(), ex))
        .doOnComplete(() -> log.info("Chat streaming completed for model: {}", request.getModel()));
}
```

### 1.4 Controller: OllamaChatController

```java
@PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ChatResponseDto> chat(@Validated @RequestBody ChatRequestDto request) {
    log.info("Initiating chat request: model={}", request.getModel());
    return ollamaService.chat(request);
}
```

- Uses TEXT_EVENT_STREAM_VALUE to stream the SSE output
- Expects ChatRequestDto in the request body

### 1.5 JWT Authentication & Authorization
Just like `/api/ollama/generate`, you can protect the `/chat` endpoint with roles (ROLE_CLIENT or ROLE_ADMIN) if needed.

### 1.6 Accessing backend

Backend is up and running on port 4001.

Example curl (auth token can be obtained from login endpoint /users/signin with admin/admin credentials):

```bash
curl -X 'POST' \
  'http://localhost:4001/api/ollama/chat' \
  -H 'accept: text/event-stream' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImF1dGgiOlt7ImF1dGhvcml0eSI6IlJPTEVfQURNSU4ifV0sImlhdCI6MTc0MDI1OTkzOSwiZXhwIjoxNzQwMjYwMjM5fQ.BUJILX82dCYyNRqnynNNEkWrMmIRLm-fX2Llvaz6nUs' \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "llama3.2:1b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant. You must use the conversation history to answer questions."
    },
    {
      "role": "user",
      "content": "I love programming in Python."
    },
    {
      "role": "assistant",
      "content": "That'\''s great! Python is a versatile and popular programming language. What do you enjoy most about Python programming?"
    },
    {
      "role": "user",
      "content": "What programming language did I say I love?"
    }
  ],
  "options": {
    "temperature": 0.7
  }
}'
```

## 2. Frontend

### 2.1 User Interface
You can reuse your LLM page but add a toggle to switch between Generate and Chat. For chat:

- Model Text Field: A text input that defaults to "llama3.2:1b"
- Conversation Display: A vertical list of all messages
- Input Field: For the user to type their message

Example (simplified JSX):

```tsx
export default function ChatPage() {
  const [model, setModel] = useState("llama3.2:1b");
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [userInput, setUserInput] = useState("");

  const handleSend = async () => {
    // Add user message
    const newMessages = [
      ...messages,
      { role: "user", content: userInput }
    ];
    setMessages(newMessages);

    // Call SSE endpoint
    await sendChatRequest(model, newMessages, (partialAssistantText) => {
      // Optionally show partial content somewhere or finalize it
    }, (finalAssistantText) => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: finalAssistantText }
      ]);
    });

    setUserInput("");
  };

  // ...
}
```

### 2.2 Sending the Request (SSE)
You can use Fetch or Axios; here's a Fetch + ReadableStream example:

```typescript
async function sendChatRequest(
  model: string,
  messageList: { role: string; content: string }[],
  onPartial: (partialText: string) => void,
  onComplete: (finalText: string) => void
) {
  const response = await fetch("/api/ollama/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // ... include JWT token if needed
    },
    body: JSON.stringify({
      model: model,
      messages: messageList,
      options: {},
      // stream & keepAlive can be omitted if back end defaults them
    })
  });

  if (!response.ok || !response.body) {
    console.error("Error from /chat endpoint");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let accumulatedText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Convert the chunk to string
    const chunkStr = decoder.decode(value, { stream: true });
    // Parse chunk as SSE events. Each event is typically prefixed with "data: "
    const events = chunkStr.split(/\n\n/).filter(Boolean); // each SSE separated by newlines
    for (const event of events) {
      if (event.startsWith("data: ")) {
        try {
          const dataJson = event.replace("data: ", "");
          const parsed = JSON.parse(dataJson);

          if (!parsed.message?.content) continue;

          if (!parsed.done) {
            // partial chunk
            accumulatedText += parsed.message.content;
            onPartial(accumulatedText);
          } else {
            // done = true
            accumulatedText += parsed.message.content;
            onComplete(accumulatedText);
            accumulatedText = "";
          }
        } catch (err) {
          console.error("Failed to parse SSE chunk", err);
        }
      }
    }
  }
}
```

Key points:
- Partial vs. Final: If parsed.done is false, you add text to accumulatedText but don't finalize. Once you see true, finalize the message
- Conversation History: Always include the entire messages array in the request body to maintain context

### 2.3 Displaying Messages
- Show all existing messages in the chat window
- For partial updates, you can temporarily display text in a "draft" message area, or hold off until done is true to create a new "assistant" entry

## 3. Putting It All Together

### Frontend
- In your LLM page, create a Chat tab or default view
- Have a model selector (`<input value={model} onChange={...} />`) that defaults to "llama3.2:1b"
- Keep a list of messages. On each user submit, add a user message, then call the chat endpoint
- Read the SSE stream with a Reader, parse events, and handle partial vs. final responses appropriately
- Render messages in a scrollable area

### Testing
- Backend: Use integration tests with WireMock or a real Ollama to confirm SSE streaming
- Frontend: Confirm the SSE flow works; partial responses appear, final message is appended

## Final Notes
- Since you're only storing conversation history on the client, the server is stateless for the chat feature
- Users can pick any model name in a text field, with "llama3.2:1b" as the default—just be sure that model is available on the Ollama server
- No special logic for limiting or chunking the conversation history is needed at this time, but keep in mind it might become a performance concern if the conversation grows very large

If there are any remaining questions or if you need further details (e.g., handling authorization tokens, SSE behind proxies, or advanced error handling), let me know. Otherwise, this plan should cover the core implementation for your chat functionality.