import { Link, useLocation } from 'react-router';
import { Surface } from '../../components/ui/surface';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

/** Shown for any path no route matches, instead of an empty page (X-32). */
export function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { pathname } = useLocation();

  return (
    <Surface as="section" variant="muted" padding="xl" className="mx-auto max-w-2xl text-center" data-testid="not-found-page">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" data-testid="not-found-title">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]" data-testid="not-found-message">
        There is no page at <code className="rounded bg-white px-1 py-0.5 text-slate-800">{pathname}</code>. Check the address or start again from the home page.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        data-testid="not-found-home-link"
      >
        Go to the home page
      </Link>
    </Surface>
  );
}
