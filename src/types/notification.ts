// Commerce emails sent by notification-service (payment received, shipped, back in stock, ...).
// Aliases of its OpenAPI snapshot, so they cannot drift from the service.
import type { components } from './generated/notification-api';

type Schemas = components['schemas'];

export type NotificationEmail = Schemas['NotificationEmailDto'];
export type NotificationEmailStatus = NonNullable<NotificationEmail['status']>;
export type NotificationEmailTemplate = NonNullable<NotificationEmail['template']>;
export type NotificationEmailPage = Schemas['PageDtoNotificationEmailDto'];
