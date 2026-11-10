import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreeDsDialog } from './ThreeDsDialog';

function renderDialog(props: Partial<Parameters<typeof ThreeDsDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(<ThreeDsDialog open confirming={false} onConfirm={onConfirm} onCancel={onCancel} {...props} />);
  return { onConfirm, onCancel };
}

describe('ThreeDsDialog', () => {
  it('shows the hint and focuses the code field', () => {
    // given / when
    renderDialog();
    // then
    expect(screen.getByRole('dialog', { name: '3-D Secure verification' })).toBeInTheDocument();
    expect(screen.getByTestId('payment-3ds-hint')).toHaveTextContent('Use 123456');
    expect(screen.getByLabelText('Verification code')).toHaveFocus();
    expect(screen.getByLabelText('Verification code')).toHaveAccessibleDescription('Use 123456');
    expect(screen.getByTestId('payment-3ds-submit')).toBeDisabled();
  });

  it('submits the trimmed code', async () => {
    // given
    const { onConfirm } = renderDialog();
    // when
    await userEvent.type(screen.getByTestId('payment-3ds-code-input'), ' 123456 {Enter}');
    // then
    expect(onConfirm).toHaveBeenCalledWith('123456');
  });

  it('cancels with the button or Escape', async () => {
    // given
    const { onCancel } = renderDialog();
    // when
    await userEvent.click(screen.getByTestId('payment-3ds-cancel'));
    await userEvent.keyboard('{Escape}');
    // then
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('shows an error and a busy button while verifying', () => {
    // given / when
    renderDialog({ confirming: true, error: 'Try again' });
    // then
    expect(screen.getByTestId('payment-3ds-error')).toHaveTextContent('Try again');
    expect(screen.getByTestId('payment-3ds-submit')).toHaveTextContent('Verifying…');
    expect(screen.getByTestId('payment-3ds-code-input')).toHaveAttribute('aria-invalid', 'true');
  });
});
