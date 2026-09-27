import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders with sr-only text for accessibility', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });
});
