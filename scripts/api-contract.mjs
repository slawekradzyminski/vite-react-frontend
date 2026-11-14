#!/usr/bin/env node
// Keeps the OpenAPI snapshots in step with the service images pinned in docker-compose.yml.
//   node scripts/api-contract.mjs snapshot [service] [url]  rewrites a snapshot from a running service
//   node scripts/api-contract.mjs check [service] [url]     fails when a running service no longer matches its snapshot
// `service` is `backend` (default, openapi/backend-api-docs.json), `warehouse`
// (openapi/warehouse-api-docs.json), `payment` (openapi/payment-api-docs.json) or
// `notification` (openapi/notification-api-docs.json).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DEFAULT_API_DOCS_URL = 'http://localhost:8081/v3/api-docs';
export const DEFAULT_WAREHOUSE_API_DOCS_URL = 'http://localhost:8081/warehouse/v3/api-docs';
export const DEFAULT_PAYMENT_API_DOCS_URL = 'http://localhost:8081/payment/v3/api-docs';
export const DEFAULT_NOTIFICATION_API_DOCS_URL = 'http://localhost:8081/notification/v3/api-docs';

export const SERVICES = {
  backend: {
    label: 'Backend',
    snapshot: 'openapi/backend-api-docs.json',
    // Literal URLs: Vite rewrites `new URL(template, import.meta.url)` into a glob import.
    snapshotUrl: () => new URL('../openapi/backend-api-docs.json', import.meta.url),
    urlEnv: 'BACKEND_API_DOCS_URL',
    defaultUrl: DEFAULT_API_DOCS_URL,
    snapshotScript: 'api:snapshot',
  },
  warehouse: {
    label: 'Warehouse service',
    snapshot: 'openapi/warehouse-api-docs.json',
    snapshotUrl: () => new URL('../openapi/warehouse-api-docs.json', import.meta.url),
    urlEnv: 'WAREHOUSE_API_DOCS_URL',
    defaultUrl: DEFAULT_WAREHOUSE_API_DOCS_URL,
    snapshotScript: 'api:snapshot:warehouse',
  },
  payment: {
    label: 'Payment service',
    snapshot: 'openapi/payment-api-docs.json',
    snapshotUrl: () => new URL('../openapi/payment-api-docs.json', import.meta.url),
    urlEnv: 'PAYMENT_API_DOCS_URL',
    defaultUrl: DEFAULT_PAYMENT_API_DOCS_URL,
    snapshotScript: 'api:snapshot:payment',
  },
  notification: {
    label: 'Notification service',
    snapshot: 'openapi/notification-api-docs.json',
    snapshotUrl: () => new URL('../openapi/notification-api-docs.json', import.meta.url),
    urlEnv: 'NOTIFICATION_API_DOCS_URL',
    defaultUrl: DEFAULT_NOTIFICATION_API_DOCS_URL,
    snapshotScript: 'api:snapshot:notification',
  },
};

// The service name is optional so `check <url>` keeps working for the backend.
export function resolveTarget([command, ...rest], env = {}) {
  const [first, second] = rest;
  const serviceName = first && Object.hasOwn(SERVICES, first) ? first : 'backend';
  const service = SERVICES[serviceName];
  const explicitUrl = serviceName === first ? second : first;
  return { command, serviceName, service, url: explicitUrl ?? env[service.urlEnv] ?? service.defaultUrl };
}

const sortKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
};

// springdoc fills `servers` from the request host, so the same backend reached through the
// gateway and directly would otherwise produce different snapshots.
export function normalizeSpec(spec) {
  const { servers: _servers, ...contract } = spec;
  return sortKeys(contract);
}

export function serializeSpec(spec) {
  return `${JSON.stringify(normalizeSpec(spec), null, 2)}\n`;
}

const diffSection = (label, expected = {}, actual = {}) => {
  const lines = [];
  const names = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  for (const name of names) {
    if (!(name in actual)) {
      lines.push(`- ${label} removed: ${name}`);
    } else if (!(name in expected)) {
      lines.push(`+ ${label} added: ${name}`);
    } else if (JSON.stringify(sortKeys(expected[name])) !== JSON.stringify(sortKeys(actual[name]))) {
      lines.push(`~ ${label} changed: ${name}`);
    }
  }
  return lines;
};

// Returns one line per path or schema that differs; an empty list means the contracts match.
export function describeDrift(expected, actual) {
  const normalizedExpected = normalizeSpec(expected);
  const normalizedActual = normalizeSpec(actual);
  const lines = [
    ...diffSection('path', normalizedExpected.paths, normalizedActual.paths),
    ...diffSection('schema', normalizedExpected.components?.schemas, normalizedActual.components?.schemas),
  ];
  if (lines.length === 0 && JSON.stringify(normalizedExpected) !== JSON.stringify(normalizedActual)) {
    lines.push('~ document changed outside paths and schemas');
  }
  return lines;
}

const fetchSpec = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} returned ${response.status}`);
  }
  return response.json();
};

async function main(args) {
  const { command, service, url } = resolveTarget(args, process.env);
  // Resolved here, not at import: Vitest loads this module in jsdom, where import.meta.url is not a file URL.
  const snapshotPath = fileURLToPath(service.snapshotUrl());
  if (command === 'snapshot') {
    await writeFile(snapshotPath, serializeSpec(await fetchSpec(url)));
    console.log(`Wrote ${snapshotPath} from ${url}`);
    return 0;
  }
  if (command === 'check') {
    const expected = JSON.parse(await readFile(snapshotPath, 'utf8'));
    const drift = describeDrift(expected, await fetchSpec(url));
    if (drift.length === 0) {
      console.log(`${service.label} API at ${url} matches the snapshot.`);
      return 0;
    }
    console.error(`${service.label} API at ${url} drifted from ${service.snapshot}:`);
    drift.forEach((line) => console.error(`  ${line}`));
    console.error(`If the change is intended, run \`npm run ${service.snapshotScript}\` and fix the type errors it surfaces.`);
    return 1;
  }
  console.error(`Usage: node scripts/api-contract.mjs <snapshot|check> [${Object.keys(SERVICES).join('|')}] [api-docs-url]`);
  return 2;
}

if (process.argv[1]?.endsWith('api-contract.mjs')) {
  process.exitCode = await main(process.argv.slice(2));
}
