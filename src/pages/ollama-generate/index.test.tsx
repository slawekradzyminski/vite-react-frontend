import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaGeneratePage } from './index';
import { vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ollama } from '../../lib/api';
import { ToastContext } from '../../hooks/toast';

vi.mock('../../lib/api', () => ({
  ollama: {
    generate: vi.fn(),
  },
}));

const mockToast = vi.fn();
const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastContext.Provider value={{ toast: mockToast }}>
    {children}
  </ToastContext.Provider>
);

describe('OllamaGeneratePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('renders markdown formatted response', async () => {
    // when
    const markdownResponse = 
      'data: {"response":"# Title\\n","done":false}\n\n' +
      'data: {"response":"- List item 1\\n","done":false}\n\n' +
      'data: {"response":"- List item 2\\n","done":false}\n\n' +
      'data: {"response":"**Bold text**","done":true}\n\n';

    const mockResponse = new Response(markdownResponse, {
      headers: { 'Content-Type': 'text/event-stream' }
    });

    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    renderWithProviders(<ToastProvider><OllamaGeneratePage /></ToastProvider>);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    const generateButton = screen.getByText('Generate');

    fireEvent.change(promptInput, { target: { value: 'test prompt' } });
    fireEvent.click(generateButton);

    // then
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('List item 1');
    expect(listItems[1]).toHaveTextContent('List item 2');

    const boldText = screen.getByText('Bold text');
    expect(boldText.tagName).toBe('STRONG');
  });

  it('shows loading state while generating', async () => {
    // when
    const mockResponse = new Response(
      'data: {"response":"Loading test","done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    renderWithProviders(<ToastProvider><OllamaGeneratePage /></ToastProvider>);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    const generateButton = screen.getByText('Generate');

    fireEvent.change(promptInput, { target: { value: 'test prompt' } });
    fireEvent.click(generateButton);

    // then
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  it('handles empty prompt', async () => {
    // when
    renderWithProviders(<ToastProvider><OllamaGeneratePage /></ToastProvider>);

    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    // then
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Please enter a prompt',
    });
    expect(ollama.generate).not.toHaveBeenCalled();
  });
}); 