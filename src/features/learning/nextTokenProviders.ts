import { ollama } from '../../lib/api';
import type { LearningNextTokenRequest, LearningNextTokenResponse } from '../../types/ollama';
import { STATIC_NEXT_TOKEN_EXAMPLE, type TokenProbability } from './learningMath';

export type NextTokenCandidate = TokenProbability & {
  rank: number;
  rawProbability: number;
  logprob: number;
};

export type NextTokenLessonResult = {
  kind: 'static' | 'live';
  sourceLabel: string;
  modelLabel: string;
  prompt: string;
  tokens: NextTokenCandidate[];
  generatedToken?: string;
  capturedProbabilityMass: number;
  truncated: boolean;
};

export const STATIC_NEXT_TOKEN_RESULT: NextTokenLessonResult = {
  kind: 'static',
  sourceLabel: STATIC_NEXT_TOKEN_EXAMPLE.source,
  modelLabel: STATIC_NEXT_TOKEN_EXAMPLE.modelLabel,
  prompt: STATIC_NEXT_TOKEN_EXAMPLE.prompt,
  capturedProbabilityMass: 1,
  truncated: false,
  tokens: STATIC_NEXT_TOKEN_EXAMPLE.tokens.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    rawProbability: candidate.probability,
    logprob: Math.log(candidate.probability),
  })),
};

export function mapLiveNextTokenResponse(response: LearningNextTokenResponse): NextTokenLessonResult {
  return {
    kind: 'live',
    sourceLabel: 'Live Ollama logprobs',
    modelLabel: response.modelLabel,
    prompt: response.prompt,
    generatedToken: response.generatedToken,
    capturedProbabilityMass: response.capturedProbabilityMass,
    truncated: response.truncated,
    tokens: response.candidates.map((candidate) => ({
      token: candidate.token,
      probability: candidate.normalizedProbability,
      rawProbability: candidate.probability,
      logprob: candidate.logprob,
      rank: candidate.rank,
    })),
  };
}

export async function liveNextTokenProvider(
  request: LearningNextTokenRequest,
): Promise<NextTokenLessonResult> {
  return mapLiveNextTokenResponse(await ollama.getLearningNextToken(request));
}
