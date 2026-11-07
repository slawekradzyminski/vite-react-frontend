import { describe, expect, it } from 'vitest';
import { hasRole } from './roles';

describe('hasRole', () => {
  it('grants access when any of several roles matches', () => {
    expect(hasRole(['ROLE_CLIENT', 'ROLE_ADMIN'], 'ADMIN')).toBe(true);
  });

  it('accepts the role with or without the ROLE_ prefix', () => {
    expect(hasRole(['ADMIN'], 'ADMIN')).toBe(true);
    expect(hasRole([{ authority: 'ROLE_ADMIN' }], 'ADMIN')).toBe(true);
  });

  it('denies access when no role matches', () => {
    expect(hasRole(['ROLE_CLIENT'], 'ADMIN')).toBe(false);
  });

  it('denies access for an authority object without an authority', () => {
    expect(hasRole([{}], 'ADMIN')).toBe(false);
  });

  it('denies access when the roles payload is not a list', () => {
    expect(hasRole(undefined, 'ADMIN')).toBe(false);
    expect(hasRole('ROLE_ADMIN', 'ADMIN')).toBe(false);
  });
});
