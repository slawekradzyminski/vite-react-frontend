import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ConvolutionLabPage } from './ConvolutionLabPage';

describe('ConvolutionLabPage', () => {
  test('links selected output cells to their multiplication trace', () => {
    renderWithProviders(<ConvolutionLabPage />);

    expect(screen.getByTestId('convolution-trace-sum')).toHaveTextContent('Σ = 2');
    fireEvent.click(screen.getByTestId('convolution-output-0-1'));
    expect(screen.getByTestId('convolution-trace')).toHaveTextContent('Selected activation [0, 1]');
    expect(screen.getByTestId('convolution-trace-sum')).toHaveTextContent('Σ = 0');

    fireEvent.change(screen.getByLabelText('Kernel row 1 column 1'), { target: { value: '2' } });
    expect(screen.getByTestId('convolution-kernel-preset')).toHaveValue('Custom');
  });
});
