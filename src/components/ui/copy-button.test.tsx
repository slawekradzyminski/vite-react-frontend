import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './copy-button';

const stubClipboard = (writeText: (value: string) => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
};

describe('CopyButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies the value and announces it', async () => {
    // given
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    render(<CopyButton value="whsec_abc" subject="Signing secret" data-testid="copy" />);
    stubClipboard(writeText);

    // when
    await user.click(screen.getByRole('button', { name: 'Copy: Signing secret' }));

    // then
    expect(writeText).toHaveBeenCalledWith('whsec_abc');
    expect(screen.getByTestId('copy')).toHaveTextContent('Copied');
    expect(screen.getByTestId('copy-status')).toHaveTextContent('Signing secret copied to the clipboard.');
  });

  it('tells the user to copy manually when the clipboard is unavailable', async () => {
    // given
    const user = userEvent.setup();
    render(<CopyButton value="x" label="Copy URL" subject="Inbox URL" data-testid="copy" />);
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));

    // when
    await user.click(screen.getByTestId('copy'));

    // then
    expect(screen.getByTestId('copy')).toHaveTextContent('Copy URL');
    expect(screen.getByTestId('copy-status')).toHaveTextContent('Could not copy the inbox url. Select it and copy it manually.');
  });
});
