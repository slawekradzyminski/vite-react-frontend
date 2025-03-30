import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  // given
  it('renders with default variant', () => {
    // when
    render(<Button>Click me</Button>);
    
    // then
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  // given
  it('renders with outline variant', () => {
    // when
    render(<Button variant="outline">Click me</Button>);
    
    // then
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border-input');
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Button className="custom-class">Click me</Button>);
    
    // then
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('custom-class');
  });

  // given
  it('renders with custom data-testid', () => {
    // when
    render(<Button data-testid="custom-button">Click me</Button>);
    
    // then
    const button = screen.getByTestId('custom-button');
    expect(button).toBeInTheDocument();
  });
}); 