import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationEmails } from './NotificationEmails';
import { notifications } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import type { NotificationEmail, NotificationEmailPage } from '../../types/notification';

vi.mock('../../lib/api', () => ({ notifications: { emails: vi.fn() } }));

const email = (overrides: Partial<NotificationEmail> = {}): NotificationEmail => ({
  id: '0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10', template: 'PAYMENT_RECEIVED', subject: 'Payment received for order #42',
  status: 'SENT', recipientMasked: 'c***@example.com', attempts: 1,
  createdAt: '2026-11-10T20:40:33Z', updatedAt: '2026-11-10T20:40:34Z', sentAt: '2026-11-10T20:40:34Z', failureReason: null,
  ...overrides,
});

const page = (content: NotificationEmail[], totalPages = 1): { data: NotificationEmailPage } => ({
  data: { content, totalPages, totalElements: content.length, pageNumber: 0, pageSize: 10 },
});

describe('NotificationEmails', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists the commerce emails with their template, subject, masked recipient and status', async () => {
    vi.mocked(notifications.emails).mockResolvedValue(page([
      email(),
      email({ id: 'e2', template: 'SHIPMENT_DELIVERY_FAILED', subject: 'Delivery attempt failed', status: 'FAILED', sentAt: null, failureReason: 'Broker unavailable' }),
    ]) as never);
    renderWithProviders(<NotificationEmails />);

    const first = await screen.findByTestId('notification-0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10');
    expect(first).toHaveTextContent('Payment received');
    expect(screen.getByTestId('notification-subject-0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10')).toHaveTextContent('Payment received for order #42');
    expect(screen.getByTestId('notification-meta-0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10')).toHaveTextContent('To c***@example.com');
    expect(screen.getByTestId('notification-status-0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10')).toHaveTextContent('SENT');
    expect(screen.getByTestId('notification-template-e2')).toHaveTextContent('Delivery attempt failed');
    expect(screen.getByTestId('notification-failure-e2')).toHaveTextContent('Broker unavailable');
    expect(screen.queryByTestId('notification-failure-0b8f4f0e-3f43-4b8e-9d55-4a3f1c1f6a10')).not.toBeInTheDocument();
    expect(notifications.emails).toHaveBeenCalledWith(0, 10);
    expect(screen.queryByTestId('notifications-next-page')).not.toBeInTheDocument();
  });

  it('pages through older emails', async () => {
    vi.mocked(notifications.emails)
      .mockResolvedValueOnce(page([email()], 2) as never)
      .mockResolvedValueOnce(page([email({ id: 'older', subject: 'Gift card issued' })], 2) as never);
    renderWithProviders(<NotificationEmails />);

    await userEvent.click(await screen.findByTestId('notifications-next-page'));

    expect(await screen.findByTestId('notification-older')).toHaveTextContent('Gift card issued');
    expect(notifications.emails).toHaveBeenLastCalledWith(1, 10);
  });

  it('says when there are no emails yet', async () => {
    vi.mocked(notifications.emails).mockResolvedValue(page([]) as never);
    renderWithProviders(<NotificationEmails />);
    expect(await screen.findByTestId('notifications-empty')).toBeInTheDocument();
  });

  it('says when the emails cannot be loaded', async () => {
    vi.mocked(notifications.emails).mockRejectedValue(new Error('down'));
    renderWithProviders(<NotificationEmails />);
    expect(await screen.findByTestId('notifications-error')).toHaveTextContent('could not be loaded');
  });
});
