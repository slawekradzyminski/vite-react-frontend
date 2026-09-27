import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders with error styling when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });
});
