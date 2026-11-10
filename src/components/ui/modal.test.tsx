import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog, Modal } from './modal';

describe('Modal', () => {
  it('opens as a labelled dialog and renders its content only while open', () => {
    // given
    const { rerender } = render(<Modal open={false} onClose={vi.fn()} title="Delivery details" data-testid="sample">Body</Modal>);

    // then - closed
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
    expect(screen.getByTestId('sample')).not.toHaveAttribute('open');

    // when
    rerender(<Modal open onClose={vi.fn()} title="Delivery details" description="order.created" data-testid="sample">Body</Modal>);

    // then - open
    const dialog = screen.getByRole('dialog', { name: 'Delivery details' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleDescription('order.created');
    expect(screen.getByText('Body')).toBeInTheDocument();

    // when - closed again
    rerender(<Modal open={false} onClose={vi.fn()} title="Delivery details" data-testid="sample">Body</Modal>);

    // then
    expect(screen.getByTestId('sample')).not.toHaveAttribute('open');
  });

  it('uses the native showModal and close when the browser supports them', () => {
    // given
    const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', ''); });
    const close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute('open'); });
    const original = { showModal: HTMLDialogElement.prototype.showModal, close: HTMLDialogElement.prototype.close };
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;

    try {
      // when
      const { rerender } = render(<Modal open onClose={vi.fn()} title="T" data-testid="native">x</Modal>);
      rerender(<Modal open={false} onClose={vi.fn()} title="T" data-testid="native">x</Modal>);

      // then
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
    } finally {
      HTMLDialogElement.prototype.showModal = original.showModal;
      HTMLDialogElement.prototype.close = original.close;
    }
  });

  it('closes on Escape (the cancel event) and on the close button', async () => {
    // given
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="T" data-testid="sample">x</Modal>);

    // when
    const cancel = new Event('cancel', { cancelable: true });
    screen.getByRole('dialog').dispatchEvent(cancel);
    await userEvent.click(screen.getByTestId('sample-close'));

    // then
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('ConfirmDialog', () => {
  it('confirms or cancels', async () => {
    // given
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Delete webhook?" message="This cannot be undone." confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel} data-testid="confirm" />);

    // when
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByTestId('confirm-cancel'));

    // then
    expect(screen.getByRole('dialog', { name: 'Delete webhook?' })).toBeInTheDocument();
    expect(screen.getByTestId('confirm-message')).toHaveTextContent('This cannot be undone.');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables the confirm button while the action is pending', () => {
    // given / when
    render(<ConfirmDialog open pending title="T" message="M" confirmLabel="Go" onConfirm={vi.fn()} onCancel={vi.fn()} data-testid="confirm" />);
    fireEvent.click(screen.getByTestId('confirm-confirm'));

    // then
    expect(screen.getByTestId('confirm-confirm')).toBeDisabled();
  });
});
