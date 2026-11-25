import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Distinguishes the routed-content boundary from the outermost one in tests and logs. */
  testIdPrefix?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

// A render error (for example a product whose name is an object, React error #31) would otherwise
// unmount the whole tree and leave a white page. The routed content is wrapped in one boundary keyed
// by the path, so the navigation stays usable and moving to another page resets it; main.tsx wraps
// the whole app in another as the last line of defence.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const prefix = this.props.testIdPrefix ?? 'app-error';
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center" data-testid={prefix}>
        <h1 className="text-2xl font-semibold text-slate-950" role="alert" data-testid={`${prefix}-title`}>
          Something went wrong
        </h1>
        <p className="text-sm text-slate-600" data-testid={`${prefix}-description`}>
          This page could not be displayed. Reload it, or go back to the home page.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
            data-testid={`${prefix}-reload`}
          >
            Reload
          </button>
          <a
            href="/"
            className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-slate-800"
            data-testid={`${prefix}-home`}
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
