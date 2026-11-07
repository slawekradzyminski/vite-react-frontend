#!/usr/bin/env node
// Keeps openapi/backend-api-docs.json in step with the backend image pinned in docker-compose.yml.
//   node scripts/api-contract.mjs snapshot [url]  rewrites the snapshot from a running backend
//   node scripts/api-contract.mjs check [url]     fails when a running backend no longer matches the snapshot
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DEFAULT_API_DOCS_URL = 'http://localhost:8081/v3/api-docs';

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

async function main([command, url = process.env.BACKEND_API_DOCS_URL ?? DEFAULT_API_DOCS_URL]) {
  // Resolved here, not at import: Vitest loads this module in jsdom, where import.meta.url is not a file URL.
  const snapshotPath = fileURLToPath(new URL('../openapi/backend-api-docs.json', import.meta.url));
  if (command === 'snapshot') {
    await writeFile(snapshotPath, serializeSpec(await fetchSpec(url)));
    console.log(`Wrote ${snapshotPath} from ${url}`);
    return 0;
  }
  if (command === 'check') {
    const expected = JSON.parse(await readFile(snapshotPath, 'utf8'));
    const drift = describeDrift(expected, await fetchSpec(url));
    if (drift.length === 0) {
      console.log(`Backend API at ${url} matches the snapshot.`);
      return 0;
    }
    console.error(`Backend API at ${url} drifted from openapi/backend-api-docs.json:`);
    drift.forEach((line) => console.error(`  ${line}`));
    console.error('If the backend change is intended, run `npm run api:snapshot` and fix the type errors it surfaces.');
    return 1;
  }
  console.error('Usage: node scripts/api-contract.mjs <snapshot|check> [api-docs-url]');
  return 2;
}

if (process.argv[1]?.endsWith('api-contract.mjs')) {
  process.exitCode = await main(process.argv.slice(2));
}
