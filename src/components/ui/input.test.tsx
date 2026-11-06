import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { Textarea } from './textarea';

describe('Input', () => {
  it('renders with error styling when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('links an error message to the field and marks it invalid', () => {
    render(
      <>
        <label htmlFor="username">Username</label>
        <Input id="username" error="Username is required" aria-describedby="username-hint" />
        <p id="username-hint">Letters only</p>
        <p id="username-error">Username is required</p>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Username' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'username-hint username-error');
    expect(input).toHaveAccessibleDescription('Letters only Username is required');
  });

  it('exposes no invalid state without an error', () => {
    render(<Input id="username" aria-describedby="username-hint" />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('aria-describedby', 'username-hint');
  });
});

describe('Textarea', () => {
  it('links an error message to the field and marks it invalid', () => {
    render(
      <>
        <Textarea id="message" error="Message is required" />
        <p id="message-error">Message is required</p>
      </>,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Message is required');
    expect(textarea).toHaveClass('border-red-500');
  });

  it('exposes no invalid state without an error', () => {
    render(<Textarea id="message" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });
});
