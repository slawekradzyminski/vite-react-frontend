import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  // given
  it('renders with default styling', () => {
    // when
    render(<Label>Email</Label>);
    
    // then
    const label = screen.getByTestId('label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Email');
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Label className="custom-class">Email</Label>);
    
    // then
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('custom-class');
  });

  // given
  it('renders with custom data-testid', () => {
    // when
    render(<Label data-testid="custom-label">Email</Label>);
    
    // then
    const label = screen.getByTestId('custom-label');
    expect(label).toBeInTheDocument();
  });

  // given
  it('renders with htmlFor attribute', () => {
    // when
    render(<Label htmlFor="email-input">Email</Label>);
    
    // then
    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('for', 'email-input');
  });
}); 