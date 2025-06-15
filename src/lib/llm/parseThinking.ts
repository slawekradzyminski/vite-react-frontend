export function splitThinking(raw: string) {
  const thinkingBlocks: string[] = [];
  const cleaned = raw.replace(/<think>([\s\S]*?)<\/think>/gi, (_, t) => {
    thinkingBlocks.push(t.trim());
    return '';
  });
  return { cleaned: cleaned.trim(), thinking: thinkingBlocks.join('\n\n') };
} 