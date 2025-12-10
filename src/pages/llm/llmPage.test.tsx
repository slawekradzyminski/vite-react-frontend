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
  it('renders hero copy', () => {
    renderPage();

    expect(screen.getByTestId('llm-hero')).toBeInTheDocument();
    expect(screen.getByTestId('llm-title')).toHaveTextContent(/Orchestrate generate, chat, and tool flows/i);
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
    expect(toolsCard).toHaveTextContent('Chat + Tools');
    expect(toolsCard).toHaveAttribute('href', '/llm/tools');
  });
});
