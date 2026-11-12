import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('does not submit the surrounding form unless it is a submit button', () => {
    // given
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button data-testid="plain-button">Plain</Button>
        <Button type="submit" data-testid="submit-button">Submit</Button>
      </form>,
    );

    // when
    fireEvent.click(screen.getByTestId('plain-button'));

    // then
    expect(screen.getByTestId('plain-button')).toHaveAttribute('type', 'button');
    expect(onSubmit).not.toHaveBeenCalled();

    // when
    fireEvent.click(screen.getByTestId('submit-button'));

    // then
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('passes no type to the child it renders as', () => {
    // given / when
    render(<Button asChild><a href="/login" data-testid="link-button">Sign in</a></Button>);

    // then
    expect(screen.getByTestId('link-button')).not.toHaveAttribute('type');
  });
});
