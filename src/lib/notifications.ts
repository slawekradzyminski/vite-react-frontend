import type { NotificationEmailTemplate } from '../types/notification';

const TEMPLATE_LABELS: Record<NotificationEmailTemplate, string> = {
  PAYMENT_RECEIVED: 'Payment received',
  PAYMENT_FAILED: 'Payment failed',
  BACK_IN_STOCK: 'Back in stock',
  ORDER_SHIPPED: 'Order shipped',
  ORDER_DELIVERED: 'Order delivered',
  RETURN_UPDATED: 'Return update',
  SHIPMENT_OUT_FOR_DELIVERY: 'Out for delivery',
  SHIPMENT_DELIVERY_FAILED: 'Delivery attempt failed',
  LOYALTY_POINTS_EARNED: 'Points earned',
  GIFT_CARD_ISSUED: 'Gift card issued',
};

export const notificationTemplateLabel = (template?: string) =>
  (template && TEMPLATE_LABELS[template as NotificationEmailTemplate]) || template || 'Email';

export const NOTIFICATION_EMAILS_QUERY_KEY = ['notification-emails'] as const;
