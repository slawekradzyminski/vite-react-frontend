import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeCommerceTransport, readCommerceTransport } from './commerceTransport';

afterEach(() => vi.unstubAllGlobals());

describe('commerce transport selection', () => {
  it.each([null, 'rest', 'invalid'])('defaults to REST for %s', value => {
    // given
    vi.stubGlobal('window', { sessionStorage: { getItem: () => value } });
    // when
    const transport = readCommerceTransport();
    // then
    expect(transport).toBe('rest');
  });

  it('reads GraphQL only when explicitly selected', () => {
    // given
    vi.stubGlobal('window', { sessionStorage: { getItem: () => 'graphql' } });
    // when
    const transport = readCommerceTransport();
    // then
    expect(transport).toBe('graphql');
  });

  it('keeps REST usable when browser storage is unavailable', () => {
    // given
    vi.stubGlobal('window', { sessionStorage: { getItem: () => { throw new Error('Denied'); } } });
    // when
    const transport = readCommerceTransport();
    // then
    expect(transport).toBe('rest');
  });

  it('saves the selected mode and reloads to discard all cached data', () => {
    // given
    const setItem = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal('window', { sessionStorage: { setItem }, location: { reload } });
    // when
    const changed = changeCommerceTransport('graphql', 0);
    // then
    expect(changed).toBe(true);
    expect(setItem).toHaveBeenCalledWith('commerceTransport', 'graphql');
    expect(reload).toHaveBeenCalledOnce();
    expect(setItem.mock.invocationCallOrder[0]).toBeLessThan(reload.mock.invocationCallOrder[0]);
  });

  it.each([1, 2])('does not switch with %s pending mutations', pending => {
    // given
    const setItem = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal('window', { sessionStorage: { setItem }, location: { reload } });
    // when
    const changed = changeCommerceTransport('graphql', pending);
    // then
    expect(changed).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when the current mode is selected', () => {
    // given
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    // when
    const changed = changeCommerceTransport('rest', 0);
    // then
    expect(changed).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
