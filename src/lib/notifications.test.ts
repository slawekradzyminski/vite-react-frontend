import { describe, expect, it } from 'vitest';
import { notificationTemplateLabel } from './notifications';

describe('notificationTemplateLabel', () => {
  it('names every commerce email template', () => {
    expect(notificationTemplateLabel('PAYMENT_RECEIVED')).toBe('Payment received');
    expect(notificationTemplateLabel('GIFT_CARD_ISSUED')).toBe('Gift card issued');
    expect(notificationTemplateLabel('SHIPMENT_OUT_FOR_DELIVERY')).toBe('Out for delivery');
  });

  it('falls back to the raw template name and then to a generic label', () => {
    expect(notificationTemplateLabel('NEW_TEMPLATE')).toBe('NEW_TEMPLATE');
    expect(notificationTemplateLabel(undefined)).toBe('Email');
    expect(notificationTemplateLabel('')).toBe('Email');
  });
});
