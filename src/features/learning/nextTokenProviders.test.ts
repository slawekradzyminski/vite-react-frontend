import { describe, expect, test, vi } from 'vitest';
import { ollama } from '../../lib/api';
import { STATIC_NEXT_TOKEN_RESULT, liveNextTokenProvider, mapLiveNextTokenResponse } from './nextTokenProviders';

vi.mock('../../lib/api', () => ({
  ollama: { getLearningNextToken: vi.fn() },
}));

const liveResponse = {
  source: 'ollama-live' as const,
  modelLabel: 'llama3.2:1b',
  prompt: 'The capital of France is',
  generatedToken: ' Paris',
  capturedProbabilityMass: 0.86,
  truncated: true,
  candidates: [
    { token: ' Paris', rank: 1, logprob: -0.2, probability: 0.81, normalizedProbability: 0.9 },
    { token: ' Lyon', rank: 2, logprob: -2.3, probability: 0.05, normalizedProbability: 0.1 },
  ],
};

describe('next-token providers', () => {
  test('keeps the static fixture explicitly offline and normalized', () => {
    expect(STATIC_NEXT_TOKEN_RESULT.kind).toBe('static');
    expect(STATIC_NEXT_TOKEN_RESULT.modelLabel).toContain('not live');
    expect(STATIC_NEXT_TOKEN_RESULT.tokens.reduce((sum, token) => sum + token.probability, 0)).toBeCloseTo(1);
  });

  test('maps raw live probabilities separately from the visible normalized subset', () => {
    const result = mapLiveNextTokenResponse(liveResponse);

    expect(result.kind).toBe('live');
    expect(result.capturedProbabilityMass).toBe(0.86);
    expect(result.tokens[0]).toMatchObject({ probability: 0.9, rawProbability: 0.81, logprob: -0.2 });
  });

  test('calls the authenticated Ollama API adapter', async () => {
    vi.mocked(ollama.getLearningNextToken).mockResolvedValue(liveResponse);
    const request = { model: 'llama3.2:1b', prompt: liveResponse.prompt, topK: 10 };

    await expect(liveNextTokenProvider(request)).resolves.toMatchObject({ kind: 'live', generatedToken: ' Paris' });
    expect(ollama.getLearningNextToken).toHaveBeenCalledWith(request);
  });
});
