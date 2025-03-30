import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  // given
  it('renders with default styling', () => {
    // when
    render(<Input />);
    
    // then
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
  });

  // given
  it('renders with custom type', () => {
    // when
    render(<Input type="email" />);
    
    // then
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  // given
  it('renders with error styling when error prop is provided', () => {
    // when
    render(<Input error="This field is required" />);
    
    // then
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-red-500');
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Input className="custom-class" />);
    
    // then
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });

  // given
  it('renders with custom data-testid', () => {
    // when
    render(<Input data-testid="custom-input" />);
    
    // then
    const input = screen.getByTestId('custom-input');
    expect(input).toBeInTheDocument();
  });
}); 