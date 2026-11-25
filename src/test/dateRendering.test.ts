import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = join(__dirname, '..');

// Backend and payment-service send UTC timestamps without an offset. The Date constructor and
// Date.parse read those as browser-local time (an hour off in CET), so components must parse and
// format dates through src/lib/commerceFormat.ts (parseUtcDateTime, formatDateTime, formatDate,
// formatTime) instead.
const RAW_DATE_PARSING = /new Date\(\s*[^)\s]|Date\.parse\(|\.toLocale(?:Date|Time)?String\(\s*\)/;

// `new Date(value)` on a datetime-local input or a Date built from numbers is local time by design.
const ALLOWED = new Set([
  'lib/commerceFormat.ts',
  'lib/reservation.ts',
  'validators/adminCommerce.ts',
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === 'test' || entry === 'generated' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(path) && !path.includes('.test.') ? [path] : [];
  });
}

describe('date rendering', () => {
  it('parses and formats backend timestamps only through the shared helper', () => {
    const offenders = sourceFiles(srcRoot)
      .map((path) => relative(srcRoot, path))
      .filter((path) => !ALLOWED.has(path))
      .flatMap((path) => readFileSync(join(srcRoot, path), 'utf8')
        .split('\n')
        .map((line, index) => ({ line, at: `${path}:${index + 1}` }))
        .filter(({ line }) => RAW_DATE_PARSING.test(line) && !/toLocaleString\('en-US'\)/.test(line))
        .map(({ at, line }) => `${at}: ${line.trim()}`));

    expect(offenders).toEqual([]);
  });
});
