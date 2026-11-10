import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhookSecretCallout } from './WebhookSecretCallout';
import { WebhookSignatureHelp } from './WebhookSignatureHelp';
import { DeliveryStatusBadge } from './webhookStatus';

describe('WebhookSecretCallout', () => {
  it('shows the secret once with a warning, focuses itself and can be dismissed', async () => {
    // given
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    // when
    render(<WebhookSecretCallout secret="whsec_abc" title="Signing secret" onDismiss={onDismiss} data-testid="secret" />);
    const focused = document.activeElement;
    await user.click(screen.getByTestId('secret-dismiss'));

    // then
    expect(screen.getByRole('region', { name: 'Signing secret' })).toBeInTheDocument();
    expect(focused).toBe(screen.getByRole('heading', { name: 'Signing secret' }));
    expect(screen.getByTestId('secret-value')).toHaveTextContent('whsec_abc');
    expect(screen.getByTestId('secret-warning')).toHaveTextContent('shown only once');
    expect(screen.getByTestId('secret-copy')).toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('WebhookSignatureHelp', () => {
  it('explains the signature header and shows the verification snippet', () => {
    // given / when
    render(<WebhookSignatureHelp />);

    // then
    expect(screen.getByRole('heading', { name: 'Verify the signature' })).toBeInTheDocument();
    expect(screen.getByTestId('webhook-signature-help')).toHaveTextContent('X-Webhook-Signature: t=…,v1=…');
    expect(screen.getByTestId('webhook-signature-snippet')).toHaveTextContent("createHmac('sha256', secret)");
    expect(screen.getByTestId('webhook-signature-copy')).toHaveTextContent('Copy snippet');
  });
});

describe('DeliveryStatusBadge', () => {
  it.each([['DELIVERED', 'emerald'], ['PENDING', 'amber'], ['FAILED', 'red']])('colours %s', (status, colour) => {
    // given / when
    render(<DeliveryStatusBadge status={status} testId="badge" />);

    // then
    expect(screen.getByTestId('badge')).toHaveTextContent(status);
    expect(screen.getByTestId('badge').className).toContain(colour);
  });

  it('falls back to UNKNOWN', () => {
    // given / when
    render(<DeliveryStatusBadge testId="badge" />);

    // then
    expect(screen.getByTestId('badge')).toHaveTextContent('UNKNOWN');
  });
});
