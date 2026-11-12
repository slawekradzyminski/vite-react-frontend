import { describe, expect, it } from 'vitest';
import { parseRouteId } from './routeIds';

describe('parseRouteId', () => {
  it.each([['1', 1], ['42', 42], ['9007199254740991', 9007199254740991]])('accepts %s', (value, expected) => {
    expect(parseRouteId(value)).toBe(expected);
  });

  it.each([undefined, '', '0', '-1', '01', '1.5', '1e3', 'abc', ' 1', '9007199254740992', '9223372036854775807'])('rejects %s', (value) => {
    expect(parseRouteId(value)).toBeNull();
  });
});
