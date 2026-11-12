import { describe, expect, it } from 'vitest';
import { pendingWriteCount, trackWrite, withTrackedWrites } from './pendingWrites';

describe('pendingWrites', () => {
  it('counts a write until it settles, also when it fails', async () => {
    // given
    let finish!: () => void;
    let fail!: (error: Error) => void;
    const succeeding = trackWrite(() => new Promise<void>((resolve) => { finish = resolve; }));
    const failing = trackWrite(() => new Promise<void>((_, reject) => { fail = reject; }));

    // then
    expect(pendingWriteCount()).toBe(2);

    // when
    finish();
    await succeeding;

    // then
    expect(pendingWriteCount()).toBe(1);

    // when
    fail(new Error('409'));

    // then
    await expect(failing).rejects.toThrow('409');
    expect(pendingWriteCount()).toBe(0);
  });

  it('does not leak a count when the write throws synchronously', () => {
    expect(() => trackWrite(() => { throw new Error('boom'); })).toThrow('boom');
    expect(pendingWriteCount()).toBe(0);
  });

  it('tracks only the named methods and keeps their arguments and results', async () => {
    // given
    const api = {
      read: (id: number) => Promise.resolve(`read ${id}`),
      write: (id: number, quantity: number) => Promise.resolve(`wrote ${id}x${quantity}`),
    };
    const tracked = withTrackedWrites(api, ['write']);

    // when
    const read = tracked.read(1);
    const readCount = pendingWriteCount();
    const write = tracked.write(2, 3);
    const writeCount = pendingWriteCount();

    // then
    expect(readCount).toBe(0);
    expect(writeCount).toBe(1);
    await expect(read).resolves.toBe('read 1');
    await expect(write).resolves.toBe('wrote 2x3');
    expect(pendingWriteCount()).toBe(0);
  });
});
