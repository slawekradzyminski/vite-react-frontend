🛠️ Implementation Plan – Expose "think" Toggle & Visualise Reasoning on LLM pages
Goal: Give users an opt-in checkbox that passes think=true to the backend and cleanly separates the model's <think> … </think> chain-of-thought from the final answer in both Chat and Generate flows.

0 Clarify anything that blocks you
Are <think> tags always well-balanced and unique per chunk?

Should the collapsed reasoning remember its open/closed state when switching tabs?
If unsure, ask before coding.

1 Front-end type plumbing
File	Action
src/types/ollama.ts	Add think?: boolean to ChatRequestDto & GenerateRequestDto.
src/hooks/useOllamaChat.ts / useOllamaGenerate.ts	Add state: const [think, setThink] = useState(false); and return setters. Include think in the request body.
Current code only sends model, prompt & options 
.

COMMIT POINT – DTO & hook signatures compile, tests still green.

2 UI: "Enable thinking" checkbox
File	Action
src/pages/ollama/chatPage.tsx	Insert a Radix-UI Checkbox (or plain <input type="checkbox">) next to model/temperature controls. Bind to think state via hook setters.
src/pages/ollama/generatePage.tsx	Same as chat page.
src/pages/ollama/OllamaChat.module.css & OllamaGenerate.module.css	Tiny spacing/style tweaks if needed.

Label: "Show model reasoning (think)" – tool-tipped: "Adds <think> reasoning to the response."
Default unchecked → matches server default.

COMMIT POINT – Checkbox visible, toggles local state only.

3 Streaming request updates
In both hooks

ts
Copy
Edit
const requestBody: ChatRequestDto = {
  model,
  messages,
  options: { temperature },
  think,        // NEW
};
Same for generate flow.

Update mocks (e2e/mocks/ollamaChatMocks.ts, ollamaMocks.ts) to assert/forward think flag when the test sets the checkbox.

COMMIT POINT – SSE still works, unit tests compile but some fail (next step).

4 Utility to split reasoning (UPDATED APPROACH)
Create src/lib/llm/parseThinking.ts

ts
Copy
Edit
export function splitThinking(raw: string) {
  const thinkingBlocks: string[] = [];
  const cleaned = raw.replace(/<think>([\s\S]*?)<\/think>/gi, (_, t) => {
    thinkingBlocks.push(t.trim());
    return '';
  });
  return { cleaned: cleaned.trim(), thinking: thinkingBlocks.join('\n\n') };
}

**UPDATED APPROACH**: Keep <think> tags in the response content as-is. The utility is only used for UI display logic, not for processing messages in hooks.

Add unit tests (Vitest) ensuring: nested tags, multiple blocks, malformed tags fall back to raw.

COMMIT POINT – utility & tests green.

5 Hook/message processing (SIMPLIFIED)
**UPDATED APPROACH**: Hooks don't need to process thinking content. They just pass through the response with <think> tags intact.

Generate (useOllamaGenerate): Keep existing onMessage logic - just accumulate response as-is
Chat (useOllamaChat): Keep existing message processing - store content with <think> tags intact

No need to extend ChatMessageDto or add thinking state to hooks.

COMMIT POINT – messages contain <think> tags but UI not yet rendering them specially.

6 UI rendering of reasoning
Chat bubbles - use parseThinking utility for display only:

tsx
Copy
Edit
const { cleaned, thinking } = splitThinking(message.content);
return (
  <div>
    <ReactMarkdown>{cleaned}</ReactMarkdown>
    {thinking && (
      <details className="mt-2 text-xs text-gray-500" data-testid="thinking-toggle">
        <summary className="cursor-pointer select-none">Show reasoning</summary>
        <ReactMarkdown>{thinking}</ReactMarkdown>
      </details>
    )}
  </div>
);

Generate page – under the answer:

tsx
Copy
Edit
const { cleaned, thinking } = splitThinking(response);
return (
  <div>
    <ReactMarkdown>{cleaned}</ReactMarkdown>
    {thinking && (
      <details className="mt-4" data-testid="thinking-result">
        <summary className="cursor-pointer font-medium">Show reasoning</summary>
        <ReactMarkdown>{thinking}</ReactMarkdown>
      </details>
    )}
  </div>
);

Both collapsed by default; no layout shift.

COMMIT POINT – manual test shows expandable reasoning in browser.

7 Unit & component tests
New tests in chatPage.test.tsx & generatePage.test.tsx:

Checkbox unchecked → request body omits think.

Checked → body contains "think": true (mock assertion).

Reasoning hidden by default, becomes visible after user clicks summary.

Hook tests: extend spies to check think flag passed (add one test each).

parseThinking unit tests (already added).

COMMIT POINT – Vitest suite green.

8 Playwright e2e updates
Update page objects (LLMPage) with thinkingCheckbox locator.

Extend llm.chat.spec.ts and llm.generate.spec.ts:

Tick checkbox, send prompt, route asserts JSON has "think":true.

Verify "Show reasoning" toggle renders and expands.

Ensure mocks return <think>Reason</think>Final answer chunks.

COMMIT POINT – e2e suite green locally.

9 Documentation & help text
README.md:

Add new parameter example: "think": true in API section (already exists server-side).

In Frontend Usage section: screenshot/GIF + instructions about the checkbox and expandable reasoning.

src/pages/llm/llmPage.tsx – under title, add small helper text: "Enable 'Show reasoning' to view the model's chain-of-thought."

CHANGELOG.md: "Feature: optional thinking mode with collapsible reasoning".

COMMIT POINT – docs pushed.

10 Regression checklist & CI
Layer	Scenario	Status
Unit	splitThinking parses single/multi <think>	✅
Hook	think=false → flag absent	✅
Hook	think=true → flag present	✅
Component	Reasoning toggle works	✅
e2e	Chat + Generate happy paths with thinking on/off	✅
Docs	Updated	✅

Run npm run regression (unit + build + e2e).

11 Risks & mitigations
Risk	Mitigation
Malformed tags break parsing	Regex is non-greedy; if no closing tag, nothing is removed – user sees raw text.
Response very large → expensive state updates	Use incremental setState(prev => prev + chunk) (already done).
Checkbox forgotten between tabs	State lives in respective hook; stays per tab – acceptable UX.
Tests brittle on CSS selectors	Use data-testid on new elements (thinking-toggle, thinking-result).

12 Follow-up ideas (not in scope)
Persist user preference in localStorage.

Animate reasoning expand/collapse.

Allow streaming display of reasoning in a side panel.

🎉 All steps defined; each is small, testable, and finishes with an explicit commit point for safe progress.