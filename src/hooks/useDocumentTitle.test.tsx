import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_TITLE, formatDocumentTitle, useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  afterEach(() => {
    document.title = APP_TITLE;
  });

  it('formats a page title with the application name', () => {
    expect(formatDocumentTitle('Sign in')).toBe('Sign in – Awesome Testing');
  });

  it('falls back to the application name for empty titles', () => {
    expect(formatDocumentTitle()).toBe(APP_TITLE);
    expect(formatDocumentTitle('   ')).toBe(APP_TITLE);
  });

  it('sets, updates and restores the document title', () => {
    document.title = 'Something else';
    const { rerender, unmount } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Products' },
    });
    expect(document.title).toBe('Products – Awesome Testing');

    rerender({ title: 'Clean Code' });
    expect(document.title).toBe('Clean Code – Awesome Testing');

    unmount();
    expect(document.title).toBe(APP_TITLE);
  });
});
