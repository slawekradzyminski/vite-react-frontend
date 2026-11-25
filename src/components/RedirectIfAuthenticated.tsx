import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { authStorage } from '../lib/authStorage';
import { readLoginReturnTo } from '../lib/loginNavigation';
import { isSessionRejected } from '../lib/requestErrors';
import { useMe } from '../hooks/useMe';

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

// Keeps a valid session when a signed-in user opens /login or /register (BUG-003).
// A token the backend rejects (401) is dropped so the form can be used to sign in again. Any other
// failure (5xx, network, timeout) says nothing about the token: it is kept, and the form is shown
// with a retry so the user is not signed out by an outage.
export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const location = useLocation();
  const token = authStorage.getAccessToken();

  const { isSuccess, isError, error, refetch, isFetching } = useMe({ enabled: !!token });
  const sessionRejected = isError && isSessionRejected(error);

  useEffect(() => {
    if (token && sessionRejected) {
      authStorage.signOut();
    }
  }, [token, sessionRejected]);

  if (token && isSuccess) {
    return <Navigate to={readLoginReturnTo(location.search)} replace />;
  }

  if (token && !isError) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="auth-redirect-loading">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (token && !sessionRejected) {
    return (
      <>
        <div className="mx-auto mb-4 flex max-w-md items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert" data-testid="auth-redirect-error">
          <span>We could not check your existing session. The server may be temporarily unavailable.</span>
          <button
            type="button"
            className="shrink-0 font-medium underline disabled:opacity-60"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="auth-redirect-retry"
          >
            Retry
          </button>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
