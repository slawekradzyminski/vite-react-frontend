import type { Route } from '@playwright/test';
import type { components } from '../../src/types/generated/warehouse-api';

// Warehouse-service mock bodies are typed against its OpenAPI snapshot, like backendContract.
export type WarehouseSchemaName = keyof components['schemas'];
export type WarehouseSchema<Name extends WarehouseSchemaName> = components['schemas'][Name];

export async function fulfillWithWarehouseSchema<Name extends WarehouseSchemaName>(
  route: Route,
  _schema: Name,
  body: WarehouseSchema<Name> | WarehouseSchema<Name>[],
  status = 200,
) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}
