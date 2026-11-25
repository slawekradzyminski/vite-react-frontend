import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { ProductReviews } from './ProductReviews';
import { renderWithQueryClient } from '../../test/test-utils';
import { reviews } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  reviews: {
    summary: vi.fn(),
    list: vi.fn(),
    mine: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('ProductReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reviews.summary).mockResolvedValue({ data: { reviewCount: 0, distribution: {} } } as never);
    vi.mocked(reviews.list).mockResolvedValue({ data: { content: [] } } as never);
    vi.mocked(reviews.mine).mockResolvedValue({ data: { canReview: true } } as never);
  });

  it('shows the backend explanation when a review is refused with 403', async () => {
    // given
    const message = 'Only customers who received this product can review it';
    vi.mocked(reviews.create).mockRejectedValue(
      new AxiosError('Request failed with status code 403', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 403,
        data: { message },
      } as AxiosResponse),
    );
    renderWithQueryClient(<ProductReviews productId={3} />);

    // when
    fireEvent.change(await screen.findByTestId('review-rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByTestId('review-title'), { target: { value: 'Great phone' } });
    fireEvent.change(screen.getByTestId('review-body'), { target: { value: 'Works really well for me every day.' } });
    fireEvent.click(screen.getByTestId('review-submit'));

    // then
    expect(await screen.findByTestId('review-error')).toHaveTextContent(message);
  });
});
