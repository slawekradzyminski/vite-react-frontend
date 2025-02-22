import { screen, waitFor, fireEvent } from '@testing-library/react';
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles streaming chunks correctly', async () => {
    // given
    const mockResponse = new Response(
      'data: {"model":"llama3.2:1b","response":"Hello","done":false}\n\n' +
      'data: {"model":"llama3.2:1b","response":" World","done":true}\n\n',
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
      model: 'llama3.2:1b'
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
    const modelInput = screen.getByLabelText(/model/i);
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
      expect(screen.getByText('Failed to fetch stream: Internal Server Error')).toBeInTheDocument();
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

    renderWithProviders(<OllamaGeneratePage />);

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

    renderWithProviders(<OllamaGeneratePage />);

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
    renderWithProviders(<OllamaGeneratePage />);

    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    // then
    await waitFor(() => {
      expect(screen.getByText('Please enter a prompt')).toBeInTheDocument();
    });
    expect(ollama.generate).not.toHaveBeenCalled();
  });

  it('initializes with default model value', () => {
    // when
    renderWithProviders(<OllamaGeneratePage />);
    
    // then
    const modelInput = screen.getByLabelText(/model/i);
    expect(modelInput).toHaveValue('llama3.2:1b');
  });
}); 