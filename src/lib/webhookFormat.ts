// Pretty-prints a JSON document; anything that is not JSON is returned unchanged.
export function prettyJson(text?: string | null) {
  if (!text) return '';
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export interface ParsedSignature {
  timestamp: string;
  signatures: string[];
}

// Parses `X-Webhook-Signature: t=1794346833,v1=5f2b...`; returns null for anything else.
export function parseSignatureHeader(header?: string | null): ParsedSignature | null {
  if (!header) return null;
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1' && value) signatures.push(value);
  }
  return timestamp && signatures.length > 0 ? { timestamp, signatures } : null;
}

// Header lookup that ignores case, since servers and proxies normalise names differently.
export function headerValue(headers: Record<string, string> | undefined, name: string) {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === wanted);
  return key === undefined ? undefined : headers[key];
}

export const SIGNATURE_HEADER = 'X-Webhook-Signature';

// The headers every delivery carries; the signature itself is visible in the inbox.
export function deliveryHeaders(delivery: { id?: string; eventType?: string }) {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'AwesomeTesting-Webhooks/1.0',
    'X-Webhook-Id': delivery.id ?? '',
    'X-Webhook-Event': delivery.eventType ?? '',
    [SIGNATURE_HEADER]: 't=<unix seconds>,v1=<hex HMAC-SHA256 of t + "." + body>',
  };
}

export const MAX_INBOXES = 3;

export const DELIVERY_STATUSES = ['PENDING', 'DELIVERED', 'FAILED'] as const;

// Node.js receiver-side check, shown in the "Verify the signature" help box.
export const SIGNATURE_SNIPPET = `import { createHmac, timingSafeEqual } from 'node:crypto';

// rawBody: the request body exactly as received (a string, not re-serialised JSON).
export function verifyWebhook(secret, signatureHeader, rawBody, toleranceSeconds = 300) {
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => part.split('=')));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret) // the whole secret, including "whsec_"
    .update(\`\${parts.t}.\${rawBody}\`)
    .digest('hex');
  const received = parts.v1 ?? '';
  return received.length === expected.length
    && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}`;
