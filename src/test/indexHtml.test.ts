import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const html = readFileSync(join(__dirname, '..', '..', 'index.html'), 'utf8');

describe('index.html boot fallback', () => {
  it('keeps a fallback inside #root, so React replaces it once the app mounts', () => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const root = document.getElementById('root');

    expect(root?.querySelector('#app-boot-fallback')).not.toBeNull();
    expect(root?.textContent).toContain('The application could not be loaded');
    expect(document.querySelector('noscript')).not.toBeNull();
  });

  it('reveals the fallback only after a delay, so a normal start never flashes it', () => {
    expect(html).toMatch(/#app-boot-fallback\s*\{[^}]*visibility:\s*hidden;[^}]*animation:\s*app-boot-fallback-show 0s linear 10s forwards/);
    expect(html).toMatch(/@keyframes app-boot-fallback-show\s*\{\s*to\s*\{\s*visibility:\s*visible;/);
  });
});
