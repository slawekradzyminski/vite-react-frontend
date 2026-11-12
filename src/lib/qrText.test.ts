import { describe, expect, it } from 'vitest';
import { QR_MAX_BYTES, qrErrorMessage, utf8ByteLength } from './qrText';

const badRequest = (data: unknown, status = 400) => Object.assign(new Error('Request failed'), { isAxiosError: true, response: { status, data } });

describe('qrText', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(utf8ByteLength('abc')).toBe(3);
    expect(utf8ByteLength('zażółć')).toBe(10);
    expect(utf8ByteLength('😀')).toBe(4);
    expect(QR_MAX_BYTES).toBe(2953);
  });

  it('reads the field message from a 400 Blob body', async () => {
    const body = new Blob([JSON.stringify({ text: 'Text is too long for a QR code' })], { type: 'application/json' });
    await expect(qrErrorMessage(badRequest(body))).resolves.toBe('Text is too long for a QR code');
  });

  it('falls back to the ErrorDto message and accepts plain objects and JSON strings', async () => {
    await expect(qrErrorMessage(badRequest({ message: 'Invalid QR text' }))).resolves.toBe('Invalid QR text');
    await expect(qrErrorMessage(badRequest('{"text":"Text must not be blank"}'))).resolves.toBe('Text must not be blank');
  });

  it('returns null for other statuses, unreadable bodies and non-HTTP errors', async () => {
    await expect(qrErrorMessage(badRequest(new Blob([JSON.stringify({ message: 'Internal server error' })]), 500))).resolves.toBeNull();
    await expect(qrErrorMessage(badRequest(new Blob(['not json'])))).resolves.toBeNull();
    await expect(qrErrorMessage(badRequest({ text: '  ' }))).resolves.toBeNull();
    await expect(qrErrorMessage(new Error('network'))).resolves.toBeNull();
  });
});
