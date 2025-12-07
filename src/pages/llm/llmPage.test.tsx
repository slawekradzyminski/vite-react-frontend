import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { LlmPage } from './llmPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LlmPage />
    </MemoryRouter>
  );

describe('LlmPage (landing)', () => {
  it('renders hero copy and CTAs', () => {
    renderPage();

    expect(screen.getByTestId('llm-hero')).toBeInTheDocument();
    expect(screen.getByTestId('llm-title')).toHaveTextContent(/Choose the right mode/i);
    expect(screen.getByTestId('llm-cta-chat')).toHaveAttribute('href', '/llm/chat');
    expect(screen.getByTestId('llm-cta-tools')).toHaveAttribute('href', '/llm/tools');
  });

  it('shows cards for each mode with descriptions', () => {
    renderPage();

    const chatCard = screen.getByTestId('llm-mode-card-chat');
    const generateCard = screen.getByTestId('llm-mode-card-generate');
    const toolsCard = screen.getByTestId('llm-mode-card-tools');

    expect(chatCard).toHaveTextContent('Chat');
    expect(chatCard).toHaveAttribute('href', '/llm/chat');
    expect(generateCard).toHaveTextContent('Generate');
    expect(generateCard).toHaveAttribute('href', '/llm/generate');
    expect(toolsCard).toHaveTextContent('Tools');
    expect(toolsCard).toHaveAttribute('href', '/llm/tools');
  });

  it('lists highlights for each mode', () => {
    renderPage();

    expect(screen.getByText(/Grounded by your custom system prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/One prompt, one response workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/qwen3:4b-instruct with tool-calling enabled/i)).toBeInTheDocument();
  });
});
