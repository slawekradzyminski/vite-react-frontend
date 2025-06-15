import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaGeneratePage } from './generatePage';
import { vi, describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ollama } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

vi.mock('../../lib/api', () => ({
  ollama: {
    generate: vi.fn(),
  },
}));

vi.mock('../../hooks/useToast', () => {
  const mockToast = vi.fn();
  return {
    useToast: vi.fn(() => ({ toast: mockToast })),
    ToastContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
  };
});

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => {
    const lines = children.split('\n');
    return (
      <div>
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return <h1 key={i}>{line.slice(2)}</h1>;
          }
          if (line.startsWith('- ')) {
            return <li key={i}>{line.slice(2)}</li>;
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return <strong key={i}>{line.slice(2, -2)}</strong>;
          }
          return <div key={i}>{line}</div>;
        })}
      </div>
    );
  },
}));

describe('OllamaGeneratePage', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
  });

  it('handles streaming chunks correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"qwen3:0.6b","response":"Hello","done":false}\n\n' +
      'data: {"model":"qwen3:0.6b","response":" World","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), '2+2=');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
    expect(vi.mocked(ollama.generate)).toHaveBeenCalledWith(expect.objectContaining({
      model: 'qwen3:0.6b'
    }));
  });

  it('allows changing the model', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"mistral:7b","response":"Response","done":true}\n\n',
      {
        headers: { 'Content-Type': 'text/event-stream' }
      }
    );
    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    // when
    renderWithProviders(<OllamaGeneratePage />);
    const modelInput = screen.getByTestId('model-input');
    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, 'mistral:7b');
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(vi.mocked(ollama.generate)).toHaveBeenCalledWith(expect.objectContaining({
        model: 'mistral:7b',
        prompt: 'test prompt'
      }));
    });
  });

  it('shows error state when fetch fails', async () => {
    // given
    vi.mocked(ollama.generate).mockRejectedValue(new Error('Failed to fetch stream: Internal Server Error'));

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'error',
        description: 'Failed to fetch stream: Internal Server Error'
      });
    });
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('renders markdown formatted response', async () => {
    // given
    const markdownResponse = 
      'data: {"response":"# Title\\n","done":false}\n\n' +
      'data: {"response":"- List item 1\\n","done":false}\n\n' +
      'data: {"response":"- List item 2\\n","done":false}\n\n' +
      'data: {"response":"**Bold text**","done":true}\n\n';

    const mockResponse = new Response(markdownResponse, {
      headers: { 'Content-Type': 'text/event-stream' }
    });

    vi.mocked(ollama.generate).mockResolvedValue(mockResponse);

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

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
    // given
    const mockResponse = new Response(
      'data: {"response":"Loading test","done":true}\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
    vi.mocked(ollama.generate).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockResponse), 100);
      });
    });

    // when
    renderWithProviders(<OllamaGeneratePage />);
    await userEvent.type(screen.getByLabelText(/prompt/i), 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // then
    expect(screen.getByRole('button')).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled();
    });
  });

  it('handles empty prompt', async () => {
    // given
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    // when
    renderWithProviders(<OllamaGeneratePage />);
    const generateButton = screen.getByRole('button', { name: /generate/i });
    expect(generateButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/prompt/i), ' ');
    expect(generateButton).toBeDisabled();

    // then
    expect(ollama.generate).not.toHaveBeenCalled();
  });

  it('initializes with default model value', () => {
    // when
    renderWithProviders(<OllamaGeneratePage />);
    
    // then
    const modelInput = screen.getByTestId('model-input');
    expect(modelInput).toHaveValue('qwen3:0.6b');
  });
}); 