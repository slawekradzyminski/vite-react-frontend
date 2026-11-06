import { useEffect } from 'react';

export const APP_TITLE = 'Awesome Testing';

export function formatDocumentTitle(pageTitle?: string) {
  const trimmed = pageTitle?.trim();
  return trimmed ? `${trimmed} – ${APP_TITLE}` : APP_TITLE;
}

/**
 * Sets a page-specific document title (WCAG 2.4.2) and restores the
 * application title when the page unmounts.
 */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = formatDocumentTitle(pageTitle);
    return () => {
      document.title = APP_TITLE;
    };
  }, [pageTitle]);
}
