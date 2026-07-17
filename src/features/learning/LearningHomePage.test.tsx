import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { LearningHomePage } from './LearningHomePage';

describe('LearningHomePage', () => {
  test('presents the ordered five-lab path', () => {
    renderWithProviders(<LearningHomePage />);

    expect(screen.getByTestId('learning-home-title')).toHaveTextContent('Open the black box');
    expect(screen.getByTestId('learning-start-button')).toHaveAttribute('href', '/learn/perceptron');
    expect(screen.getAllByTestId(/^learning-path-/)).toHaveLength(5);
    expect(screen.getByText('Teach one artificial neuron')).toBeInTheDocument();
    expect(screen.getByText('Measure the cost of context')).toBeInTheDocument();
    expect(screen.getByText('Recognize a handwritten digit')).toBeInTheDocument();
  });
});
