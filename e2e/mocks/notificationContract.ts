import type { Route } from '@playwright/test';
import type { components } from '../../src/types/generated/notification-api';

// notification-service mock bodies (webhooks, inboxes, commerce emails) are typed against its
// OpenAPI snapshot, like backendContract.
export type NotificationSchemaName = keyof components['schemas'];
export type NotificationSchema<Name extends NotificationSchemaName> = components['schemas'][Name];

export async function fulfillWithNotificationSchema<Name extends NotificationSchemaName>(
  route: Route,
  _schema: Name,
  body: NotificationSchema<Name> | NotificationSchema<Name>[],
  status = 200,
) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}
