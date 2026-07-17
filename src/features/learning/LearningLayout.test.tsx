import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { LearningLayout } from './LearningLayout';

describe('LearningLayout', () => {
  test('marks the active lab and renders nested content', () => {
    render(
      <MemoryRouter initialEntries={['/learn/convolution']}>
        <Routes>
          <Route path="/learn" element={<LearningLayout />}>
            <Route path="convolution" element={<p>Nested lab</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('learning-nav-convolution')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Nested lab')).toBeInTheDocument();
    expect(screen.getByText(/3 of 5/)).toBeInTheDocument();
  });
});
