import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  // given
  it('renders with default variant', () => {
    // when
    render(<Button>Click me</Button>);
    
    // then
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  // given
  it('renders with outline variant', () => {
    // when
    render(<Button variant="outline">Click me</Button>);
    
    // then
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border-input');
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Button className="custom-class">Click me</Button>);
    
    // then
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('custom-class');
  });
}); 