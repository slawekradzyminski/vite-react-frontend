import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalDialog } from './dialog';

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="opener">Open</button>
      <ModalDialog open={open} title="Confirm" description="Details" onClose={() => { onClose(); setOpen(false); }} data-testid="sample-dialog">
        <input aria-label="Code" data-testid="sample-input" />
        <button data-testid="sample-cancel">Cancel</button>
        <button data-testid="sample-ok">OK</button>
      </ModalDialog>
    </>
  );
}

describe('ModalDialog', () => {
  it('renders nothing while closed', () => {
    // given / when
    render(<Harness />);
    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a labelled modal dialog that focuses its first field', async () => {
    // given
    render(<Harness />);
    // when
    await userEvent.click(screen.getByTestId('opener'));
    // then
    const dialog = screen.getByRole('dialog', { name: 'Confirm' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Details');
    expect(screen.getByTestId('sample-input')).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    // given
    render(<Harness />);
    await userEvent.click(screen.getByTestId('opener'));
    // when
    await userEvent.tab();
    await userEvent.tab();
    // then
    expect(screen.getByTestId('sample-ok')).toHaveFocus();
    // when wrapping forwards
    await userEvent.tab();
    // then
    expect(screen.getByTestId('sample-input')).toHaveFocus();
    // when wrapping backwards
    await userEvent.tab({ shift: true });
    // then
    expect(screen.getByTestId('sample-ok')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    // given
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByTestId('opener'));
    // when
    await userEvent.keyboard('{Escape}');
    // then
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('opener')).toHaveFocus();
  });

  it('focuses the panel itself when it has nothing focusable and swallows Tab', async () => {
    // given / when
    render(<ModalDialog open title="Info" onClose={vi.fn()} data-testid="empty-dialog"><p>Nothing to do</p></ModalDialog>);
    // then
    expect(screen.getByRole('dialog')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });
});
