import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ollama } from '../../lib/api';
import { NextTokenLabPage } from './NextTokenLabPage';

vi.mock('../../lib/api', () => ({
  ollama: { getLearningNextToken: vi.fn() },
}));

describe('NextTokenLabPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('keeps static provenance visible while changing decoding and loss', () => {
    renderWithProviders(<NextTokenLabPage />);

    expect(screen.getByTestId('next-token-static-notice')).toHaveTextContent('not live model output');
    expect(screen.getAllByText('Static teaching dataset').length).toBeGreaterThan(0);
    expect(screen.getByTestId('next-token-result')).toHaveTextContent('·a');

    fireEvent.click(screen.getByLabelText('Sample'));
    expect(screen.getByTestId('next-token-seed')).toBeInTheDocument();

    const originalLoss = screen.getByTestId('next-token-loss').textContent;
    fireEvent.change(screen.getByTestId('next-token-expected'), { target: { value: '.' } });
    expect(screen.getByTestId('next-token-loss').textContent).not.toBe(originalLoss);
  });

  test('runs the exact live request and shows honest top-k provenance', async () => {
    vi.mocked(ollama.getLearningNextToken).mockResolvedValue({
      source: 'ollama-live',
      modelLabel: 'llama3.2:1b',
      prompt: 'The capital of France is',
      generatedToken: ' Paris',
      capturedProbabilityMass: 0.86,
      truncated: true,
      candidates: [
        { token: ' Paris', rank: 1, logprob: -0.2, probability: 0.81, normalizedProbability: 0.9 },
        { token: ' Lyon', rank: 2, logprob: -2.3, probability: 0.05, normalizedProbability: 0.1 },
      ],
    });
    renderWithProviders(<NextTokenLabPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Live model' }));
    fireEvent.change(screen.getByTestId('next-token-live-top-k'), { target: { value: '7' } });
    fireEvent.click(screen.getByTestId('next-token-live-run'));

    await waitFor(() => expect(screen.getByTestId('next-token-captured-mass')).toHaveTextContent('86.0% captured mass'));
    expect(ollama.getLearningNextToken).toHaveBeenCalledWith({
      model: 'llama3.2:1b',
      prompt: 'The capital of France is',
      topK: 7,
    });
    expect(screen.getByText('Live Ollama logprobs')).toBeInTheDocument();
    expect(screen.getByTestId('next-token-row-0')).toHaveTextContent('logp -0.200');
    expect(screen.queryByTestId('next-token-static-notice')).not.toBeInTheDocument();
  });

  test('keeps a live failure visible and does not substitute static data', async () => {
    vi.mocked(ollama.getLearningNextToken).mockRejectedValue({
      response: { data: { message: 'The selected model did not return logprobs' } },
    });
    renderWithProviders(<NextTokenLabPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Live model' }));
    fireEvent.click(screen.getByTestId('next-token-live-run'));

    await waitFor(() => expect(screen.getByTestId('next-token-live-error')).toHaveTextContent('did not return logprobs'));
    expect(screen.getByTestId('next-token-live-empty')).toBeInTheDocument();
    expect(screen.queryByText('Static teaching dataset')).not.toBeInTheDocument();
  });
});
