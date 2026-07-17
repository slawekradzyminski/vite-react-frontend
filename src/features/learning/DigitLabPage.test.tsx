import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { DigitLabPage } from './DigitLabPage';

describe('DigitLabPage', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => vi.restoreAllMocks());

  test('renders the trained model result and full probability distribution', () => {
    renderWithProviders(<DigitLabPage />);

    expect(screen.getByTestId('digit-prediction')).toHaveTextContent('3');
    expect(screen.getByTestId('digit-confidence')).toHaveTextContent('99.81%');
    expect(screen.getByTestId('digit-probabilities').children).toHaveLength(10);
    expect(screen.getByTestId('digit-architecture')).toHaveTextContent('9,098 parameters');
    expect(screen.getByTestId('digit-architecture')).toHaveTextContent('digit_cnn.pt');
  });

  test('recognizes a selected deterministic sample immediately', () => {
    renderWithProviders(<DigitLabPage />);

    fireEvent.click(screen.getByTestId('digit-sample-8'));

    expect(screen.getByTestId('digit-prediction')).toHaveTextContent('8');
    expect(screen.getByRole('heading', { name: 'Sample 8' })).toBeInTheDocument();
  });

  test('supports draw, erase, brush, clear, and explicit inference controls', () => {
    renderWithProviders(<DigitLabPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Erase' }));
    expect(screen.getByRole('button', { name: 'Erase' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByTestId('digit-brush-size'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('digit-clear'));
    expect(screen.getByText('Needs inference')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('digit-recognize'));
    expect(screen.getByText('Analyzed')).toBeInTheDocument();
  });

  test('switches activation stages and reports their tensor dimensions', () => {
    renderWithProviders(<DigitLabPage />);

    fireEvent.click(screen.getByRole('button', { name: 'pool2' }));

    expect(screen.getByTestId('digit-activation-label')).toHaveTextContent('Pool2');
    expect(screen.getByTestId('digit-activation-heatmap')).toHaveAttribute('aria-label', expect.stringContaining('7 by 7'));
  });
});
