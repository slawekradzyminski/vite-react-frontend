import type { Route } from '@playwright/test';
import type { components } from '../../src/types/generated/backend-api';
import type { components as PaymentComponents } from '../../src/types/generated/payment-api';

// Mock bodies are typed against the backend OpenAPI snapshot, so `npm run typecheck` fails
// when a mock invents, renames, or retypes a field the real backend would not send.
export type BackendSchemaName = keyof components['schemas'];
export type BackendSchema<Name extends BackendSchemaName> = components['schemas'][Name];

export async function fulfillWithSchema<Name extends BackendSchemaName>(
  route: Route,
  _schema: Name,
  body: BackendSchema<Name> | BackendSchema<Name>[],
  status = 200,
) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

// Server-sent events carry one schema-typed JSON document per `data:` line.
export function eventStream<Name extends BackendSchemaName>(_schema: Name, chunks: BackendSchema<Name>[]): string {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('');
}

// payment-service has its own OpenAPI snapshot; its mocks are typed against that document.
export type PaymentSchemaName = keyof PaymentComponents['schemas'];
export type PaymentSchema<Name extends PaymentSchemaName> = PaymentComponents['schemas'][Name];

export async function fulfillWithPaymentSchema<Name extends PaymentSchemaName>(
  route: Route,
  _schema: Name,
  body: PaymentSchema<Name> | PaymentSchema<Name>[],
  status = 200,
) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}
