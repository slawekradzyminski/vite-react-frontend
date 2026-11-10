import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPager } from './AdminPager';

describe('AdminPager', () => {
  it('moves between pages within bounds', async () => {
    // given
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<AdminPager page={1} totalPages={3} onPageChange={onPageChange} testIdPrefix="sample" />);

    // when
    await user.click(screen.getByTestId('sample-previous-page'));
    await user.click(screen.getByTestId('sample-next-page'));

    // then
    expect(screen.getByTestId('sample-page-indicator')).toHaveTextContent('Page 2 of 3');
    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
  });

  it('disables both buttons without results and at the edges', () => {
    // given / when
    const { rerender } = render(<AdminPager page={0} totalPages={0} onPageChange={vi.fn()} testIdPrefix="sample" />);

    // then
    expect(screen.getByTestId('sample-page-indicator')).toHaveTextContent('Page 0 of 0');
    expect(screen.getByTestId('sample-previous-page')).toBeDisabled();
    expect(screen.getByTestId('sample-next-page')).toBeDisabled();

    // when
    rerender(<AdminPager page={2} totalPages={3} onPageChange={vi.fn()} testIdPrefix="sample" />);

    // then
    expect(screen.getByTestId('sample-previous-page')).toBeEnabled();
    expect(screen.getByTestId('sample-next-page')).toBeDisabled();
  });
});
