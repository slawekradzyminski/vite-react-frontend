import { useState } from 'react';
import type { LearningNextTokenRequest } from '../../types/ollama';
import { liveNextTokenProvider, type NextTokenLessonResult } from './nextTokenProviders';

function readableError(error: unknown): string {
  const responseData = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  if (responseData?.message) return responseData.message;
  if (responseData?.error) return responseData.error;
  return error instanceof Error ? error.message : 'The live model request failed.';
}

export function useLiveNextToken() {
  const [result, setResult] = useState<NextTokenLessonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (request: LearningNextTokenRequest) => {
    setLoading(true);
    setError(null);
    try {
      const nextResult = await liveNextTokenProvider(request);
      setResult(nextResult);
      return nextResult;
    } catch (requestError) {
      setResult(null);
      setError(readableError(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, error, loading, run };
}
