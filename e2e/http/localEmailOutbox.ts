import { APIRequestContext } from '@playwright/test';
import { BACKEND_URL } from '../config/constants';

interface OutboxEmail {
  timestamp: string;
  destination: string;
  payload: {
    subject: string;
    message: string;
    template?: string;
    properties?: Record<string, string>;
  };
}

export async function clearLocalOutbox(request: APIRequestContext) {
  await request.delete(`${BACKEND_URL}/local/email/outbox`);
}

export async function getLatestResetToken(request: APIRequestContext): Promise<{ token: string; link: string | null }> {
  const maxAttempts = 20;
  const delayMs = 1000;
  let attempt = 0;
  let emails: OutboxEmail[] = [];

  while (attempt < maxAttempts) {
    const response = await request.get(`${BACKEND_URL}/local/email/outbox`);
    if (!response.ok()) {
      throw new Error(`Unable to fetch local email outbox (${response.status()})`);
    }
    emails = (await response.json()) as OutboxEmail[];
    if (emails.length) {
      break;
    }
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (!emails.length) {
    throw new Error('Local email outbox is empty');
  }

  const latest = emails[emails.length - 1];
  const link = latest.payload.properties?.resetLink ?? null;
  if (link) {
    try {
      const url = new URL(link);
      const token = url.searchParams.get('token');
      if (token) {
        return { token, link };
      }
    } catch {
      // ignore invalid URL and try fallback below
    }
  }

  const tokenFromProps = latest.payload.properties?.token;
  if (tokenFromProps) {
    return { token: tokenFromProps, link };
  }

  const tokenMatch = latest.payload.message.match(/token=([^\s]+)/);
  if (tokenMatch?.[1]) {
    return { token: tokenMatch[1], link };
  }

  throw new Error('Unable to extract reset token from local email outbox');
}
