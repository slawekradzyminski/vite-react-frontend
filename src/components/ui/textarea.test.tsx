import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea', () => {
  // given
  it('renders with default styling', () => {
    // when
    render(<Textarea />);
    
    // then
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeInTheDocument();
  });

  // given
  it('renders with custom className', () => {
    // when
    render(<Textarea className="custom-class" />);
    
    // then
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  // given
  it('renders with custom data-testid', () => {
    // when
    render(<Textarea data-testid="custom-textarea" />);
    
    // then
    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toBeInTheDocument();
  });

  // given
  it('renders with placeholder text', () => {
    // when
    render(<Textarea placeholder="Enter text here" />);
    
    // then
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
  });

  // given
  it('renders with provided value', () => {
    // when
    render(<Textarea value="Test content" readOnly />);
    
    // then
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveValue('Test content');
  });
}); 