import axios from 'axios';

/**
 * The largest QR code (version 40, error correction L) holds 2953 bytes in byte mode. Text is
 * sent as UTF-8, where letters such as "ą" take 2 bytes and emoji 4, so the limit is counted in
 * UTF-8 bytes, not characters. The backend has the final word: a text it cannot encode is
 * rejected with a message, which the page shows.
 */
export const QR_MAX_BYTES = 2953;

export function utf8ByteLength(text: string) {
  return new TextEncoder().encode(text).length;
}

/**
 * The QR endpoint answers with a PNG, so its error bodies arrive as a Blob. Returns the field
 * message of a 400 ({"text": "..."}) or the ErrorDto message; null when there is none.
 */
export async function qrErrorMessage(error: unknown): Promise<string | null> {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return null;
  const data: unknown = error.response.data;
  let body: unknown = data;
  try {
    if (data instanceof Blob) body = JSON.parse(await data.text());
    else if (typeof data === 'string') body = JSON.parse(data);
  } catch {
    return null;
  }
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const message = [record.text, record.message].find((value): value is string => typeof value === 'string' && value.trim() !== '');
  return message ?? null;
}
