import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaGeneratePage } from './index';
import { vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';

describe('OllamaGeneratePage', () => {
  it('handles streaming chunks correctly', async () => {
    // given
    vi.spyOn(global, 'fetch').mockImplementationOnce(() => {
      const readableStream = new ReadableStream({
        start(controller) {
          // Simulate chunk1
          controller.enqueue(new TextEncoder().encode(
            `data: {"data":{"model":"gemma:2b","response":"Hello","done":false}}\n`
          ));
          // Simulate chunk2 (done)
          controller.enqueue(new TextEncoder().encode(
            `data: {"data":{"model":"gemma:2b","response":" World","done":true}}\n`
          ));
          controller.close();
        },
      });

      return Promise.resolve({
        ok: true,
        body: readableStream,
      } as Response);
    });

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), '2+2=');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    // given
    vi.spyOn(global, 'fetch').mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
    });

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await userEvent.click(generateButton);

    // then
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch stream: internal server error/i)).toBeInTheDocument();
    });
    expect(generateButton).not.toBeDisabled();
  });
}); 