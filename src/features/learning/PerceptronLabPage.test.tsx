import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { PerceptronLabPage } from './PerceptronLabPage';

describe('PerceptronLabPage', () => {
  test('steps through an update and resets the selected dataset', () => {
    renderWithProviders(<PerceptronLabPage />);

    expect(screen.getByTestId('perceptron-current-label')).toHaveTextContent('false OR false');
    fireEvent.click(screen.getByTestId('perceptron-step'));
    expect(screen.getByTestId('perceptron-score-formula')).toHaveTextContent('= 0.00');
    expect(screen.getByText('Update required')).toBeInTheDocument();
    expect(screen.getByTestId('perceptron-current-label')).toHaveTextContent('false OR true');

    fireEvent.click(screen.getByTestId('perceptron-dataset-xor'));
    expect(screen.getByText('Not linearly separable')).toBeInTheDocument();
    expect(screen.getByTestId('perceptron-current-label')).toHaveTextContent('false XOR false');
    expect(screen.getByTestId('perceptron-step-trace')).toHaveTextContent('Ready for the first example');
  });
});
