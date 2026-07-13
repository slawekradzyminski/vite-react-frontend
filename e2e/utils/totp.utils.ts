import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodeBase32(secret: string): Buffer {
  let buffer = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (const character of secret.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value < 0) {
      throw new Error('Invalid Base32 TOTP secret');
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

export function generateTotp(secret: string, epochMilliseconds = Date.now()): string {
  const counter = BigInt(Math.floor(epochMilliseconds / 30_000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export function millisecondsUntilNextTotpStep(now = Date.now()): number {
  return 30_000 - (now % 30_000) + 750;
}
