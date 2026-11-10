import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentStatusBadge } from './PaymentStatusBadge';

describe('PaymentStatusBadge', () => {
  it.each([
    ['CAPTURED', 'Captured', 'emerald'],
    ['REQUIRES_ACTION', 'Needs verification', 'amber'],
    ['PROCESSING', 'Processing', 'amber'],
    ['FAILED', 'Failed', 'red'],
    ['VOIDED', 'Voided', 'red'],
    ['PARTIALLY_REFUNDED', 'Partially refunded', 'white'],
    ['REFUNDED', 'Refunded', 'white'],
  ] as const)('shows %s as "%s"', (status, label, colour) => {
    // given / when
    render(<PaymentStatusBadge status={status} testId="badge" />);
    // then
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveAttribute('data-status', status);
    expect(badge.className).toContain(colour);
  });
});
