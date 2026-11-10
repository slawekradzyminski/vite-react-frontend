import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestCardsHelper } from './TestCardsHelper';
import { TEST_CARDS } from '../../lib/payment';

describe('TestCardsHelper', () => {
  it('lists every contract test card once expanded and collapses again', async () => {
    // given
    render(<TestCardsHelper onPick={vi.fn()} />);
    expect(screen.queryByTestId('payment-test-cards-list')).not.toBeInTheDocument();
    // when
    await userEvent.click(screen.getByTestId('payment-test-cards-toggle'));
    // then
    expect(screen.getByTestId('payment-test-cards-list').querySelectorAll('li')).toHaveLength(TEST_CARDS.length);
    expect(screen.getByTestId('payment-test-cards-toggle')).toHaveAttribute('aria-controls', screen.getByTestId('payment-test-cards-list').id);
    // when
    await userEvent.click(screen.getByTestId('payment-test-cards-toggle'));
    // then
    expect(screen.queryByTestId('payment-test-cards-list')).not.toBeInTheDocument();
  });

  it('hands the picked card to the form', async () => {
    // given
    const onPick = vi.fn();
    render(<TestCardsHelper onPick={onPick} />);
    await userEvent.click(screen.getByTestId('payment-test-cards-toggle'));
    // when
    await userEvent.click(screen.getByRole('button', { name: 'Use test card 4000 0000 0000 0002 (Declined)' }));
    // then
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ number: '4000 0000 0000 0002' }));
  });
});
