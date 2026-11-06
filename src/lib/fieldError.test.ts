import { describe, expect, it } from 'vitest';
import { fieldErrorAriaProps, fieldErrorId } from './fieldError';

describe('fieldError', () => {
  it('derives the message id from the field id', () => {
    expect(fieldErrorId('username')).toBe('username-error');
  });

  it('marks an erroneous field invalid and points at its message', () => {
    expect(fieldErrorAriaProps('username', 'Username is required')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'username-error',
    });
  });

  it('keeps an existing description before the error message', () => {
    expect(fieldErrorAriaProps('password', 'Too short', 'password-hint')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'password-hint password-error',
    });
  });

  it('exposes nothing extra for a valid field', () => {
    expect(fieldErrorAriaProps('username', undefined)).toEqual({
      'aria-invalid': undefined,
      'aria-describedby': undefined,
    });
    expect(fieldErrorAriaProps('username', undefined, 'username-hint')).toEqual({
      'aria-invalid': undefined,
      'aria-describedby': 'username-hint',
    });
  });

  it('does not reference a message when the field has no id', () => {
    expect(fieldErrorAriaProps(undefined, 'Required')).toEqual({
      'aria-invalid': true,
      'aria-describedby': undefined,
    });
  });
});
