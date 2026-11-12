import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatTranscript } from './ChatTranscript';

describe('ChatTranscript', () => {
  it('hides the decorative role icons and names each speaker with visible text (T-043)', () => {
    // given / when
    render(<ChatTranscript messages={[
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]} />);

    // then
    for (const role of ['user', 'assistant']) {
      const pill = screen.getByTestId(`chat-role-pill-${role}`);
      expect(pill).toHaveAttribute('aria-hidden', 'true');
      expect(pill).not.toHaveAttribute('aria-label');
    }
    expect(screen.getByTestId('chat-message-role-user')).toHaveTextContent('User');
    expect(screen.getByTestId('chat-message-role-assistant')).toHaveTextContent('Assistant');
  });
});
