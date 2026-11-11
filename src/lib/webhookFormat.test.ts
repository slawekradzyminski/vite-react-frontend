import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { deliveryHeaders, headerValue, parseSignatureHeader, prettyJson, SIGNATURE_SNIPPET } from './webhookFormat';

describe('prettyJson', () => {
  it('indents a JSON document', () => {
    // given
    const compact = '{"id":"e1","data":{"orderId":42}}';

    // when
    const result = prettyJson(compact);

    // then
    expect(result).toBe('{\n  "id": "e1",\n  "data": {\n    "orderId": 42\n  }\n}');
  });

  it('returns text that is not JSON unchanged and empty input as an empty string', () => {
    // given / when / then
    expect(prettyJson('Bad Gateway')).toBe('Bad Gateway');
    expect(prettyJson(undefined)).toBe('');
    expect(prettyJson(null)).toBe('');
  });
});

describe('parseSignatureHeader', () => {
  it('reads the timestamp and every v1 signature', () => {
    // given
    const header = 't=1794346833, v1=abc123,v1=def456';

    // when
    const parsed = parseSignatureHeader(header);

    // then
    expect(parsed).toEqual({ timestamp: '1794346833', signatures: ['abc123', 'def456'] });
  });

  it.each([undefined, '', 'garbage', 't=1', 'v1=abc', '=x,t=1'])('rejects %s', (header) => {
    // given / when / then
    expect(parseSignatureHeader(header)).toBeNull();
  });

  it('ignores unknown schemes and empty signatures', () => {
    // given / when
    const parsed = parseSignatureHeader('t=5,v0=old,v1=,v1=new');

    // then
    expect(parsed).toEqual({ timestamp: '5', signatures: ['new'] });
  });
});

describe('headerValue', () => {
  it('matches header names regardless of case', () => {
    // given
    const headers = { 'x-webhook-signature': 't=1,v1=a', 'Content-Type': 'application/json' };

    // when / then
    expect(headerValue(headers, 'X-Webhook-Signature')).toBe('t=1,v1=a');
    expect(headerValue(headers, 'content-type')).toBe('application/json');
    expect(headerValue(headers, 'X-Missing')).toBeUndefined();
    expect(headerValue(undefined, 'X-Missing')).toBeUndefined();
  });
});

describe('deliveryHeaders', () => {
  it('lists the headers every delivery is sent with', () => {
    // given / when
    const headers = deliveryHeaders({ id: 'd-1', eventType: 'order.created' });

    // then
    expect(headers['X-Webhook-Id']).toBe('d-1');
    expect(headers['X-Webhook-Event']).toBe('order.created');
    expect(headers['User-Agent']).toBe('AwesomeTesting-Webhooks/1.0');
    expect(headers['X-Webhook-Signature']).toContain('HMAC-SHA256');
  });
});

describe('SIGNATURE_SNIPPET', () => {
  it('verifies a signature computed as HMAC-SHA256 of t + "." + body', async () => {
    // given - the documented snippet, loaded as a module
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(SIGNATURE_SNIPPET).toString('base64')}`;
    const { verifyWebhook } = await import(/* @vite-ignore */ moduleUrl);
    const secret = 'whsec_test';
    const body = '{"id":"e1","type":"webhook.ping"}';
    const t = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');

    // when / then
    expect(verifyWebhook(secret, `t=${t},v1=${v1}`, body)).toBe(true);
    expect(verifyWebhook(secret, `t=${t},v1=${v1}`, `${body} `)).toBe(false);
    expect(verifyWebhook('whsec_other', `t=${t},v1=${v1}`, body)).toBe(false);
    expect(verifyWebhook(secret, `t=1,v1=${v1}`, body)).toBe(false);
  });
});
