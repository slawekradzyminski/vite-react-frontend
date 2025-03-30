import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './spinner';

describe('Spinner', () => {
  // given
  it('renders with default size (md)', () => {
    // when
    render(<Spinner />);
    
    // then
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toBeInTheDocument();
    
    const svg = screen.getByTestId('spinner-svg');
    expect(svg).toHaveClass('h-6 w-6');
  });

  // given
  it('renders with small size', () => {
    // when
    render(<Spinner size="sm" />);
    
    // then
    const svg = screen.getByTestId('spinner-svg');
    expect(svg).toHaveClass('h-4 w-4');
  });

  // given
  it('renders with large size', () => {
    // when
    render(<Spinner size="lg" />);
    
    // then
    const svg = screen.getByTestId('spinner-svg');
    expect(svg).toHaveClass('h-8 w-8');
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Spinner className="custom-class" />);
    
    // then
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('custom-class');
  });

  // given
  it('renders with custom data-testid', () => {
    // when
    render(<Spinner data-testid="custom-spinner" />);
    
    // then
    const spinner = screen.getByTestId('custom-spinner');
    expect(spinner).toBeInTheDocument();
  });

  // given
  it('renders with sr-only text for accessibility', () => {
    // when
    render(<Spinner />);
    
    // then
    const srText = screen.getByTestId('spinner-text');
    expect(srText).toHaveTextContent('Loading...');
    expect(srText).toHaveClass('sr-only');
  });
}); 