import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaGeneratePage } from './index';
import { vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ollama } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  ollama: {
    generate: vi.fn(),
  },
}));

describe('OllamaGeneratePage', () => {
  it('handles streaming chunks correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"gemma:2b","response":"Hello","done":false}\n\n' +
      'data: {"model":"gemma:2b","response":" World","done":false}\n\n' +
      'data: {"model":"gemma:2b","response":"!","done":true}\n\n',
      {
        headers: {
          'Content-Type': 'text/event-stream',
        },
      }
    );

    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), '2+2=');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    // given
    const mockResponse = new Response('Internal Server Error', { status: 500 });
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Failed to process response')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });
}); 