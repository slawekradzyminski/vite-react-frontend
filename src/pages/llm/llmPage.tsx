import { useState } from 'react';
import { OllamaChatPage } from '../ollama/chatPage';
import { OllamaGeneratePage } from '../ollama/generatePage';
import { OllamaToolChatPage } from '../ollama/toolChatPage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

type LlmMode = 'chat' | 'generate' | 'tools';

export function LlmPage() {
  const [mode, setMode] = useState<LlmMode>('chat');

  return (
    <div className="max-w-4xl mx-auto p-4" data-testid="llm-page">
      <h1 className="text-2xl font-bold mb-4" data-testid="llm-title">LLM Interaction</h1>
      
      <Tabs value={mode} onValueChange={(value) => setMode(value as LlmMode)} className="w-full" data-testid="llm-tabs">
        <TabsList className="mb-4">
          <TabsTrigger value="chat" data-testid="chat-tab">Chat</TabsTrigger>
          <TabsTrigger value="generate" data-testid="generate-tab">Generate</TabsTrigger>
          <TabsTrigger value="tools" data-testid="tools-tab">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0" data-testid="chat-content">
          <OllamaChatPage hideTitle />
        </TabsContent>

        <TabsContent value="generate" className="mt-0" data-testid="generate-content">
          <OllamaGeneratePage hideTitle />
        </TabsContent>

        <TabsContent value="tools" className="mt-0" data-testid="tools-content">
          <OllamaToolChatPage hideTitle />
        </TabsContent>
      </Tabs>
    </div>
  );
}
