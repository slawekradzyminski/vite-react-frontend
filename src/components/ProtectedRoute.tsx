import { Navigate, useLocation } from 'react-router';
import { authStorage } from '../lib/authStorage';
import { hasAnyRole } from '../lib/roles';
import { isSessionRejected } from '../lib/requestErrors';
import { useMe } from '../hooks/useMe';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** One role, or several where any one grants access. */
  requiredRole?: string | string[];
  'data-testid'?: string;
}

export function ProtectedRoute({ children, requiredRole, 'data-testid': dataTestId }: ProtectedRouteProps) {
  const location = useLocation();
  const token = authStorage.getAccessToken();

  const { data, isLoading, isError, error, refetch, isFetching } = useMe({ enabled: !!token });

  // Only a 401 that survived the token refresh ends the session. A 5xx or a network failure says
  // nothing about the tokens, so they are kept and the user can retry once the backend recovers.
  if (!token || (isError && isSessionRejected(error))) {
    return <Navigate to={loginRedirectTarget(location.pathname, location.search)} replace data-testid="protected-route-redirect" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center" data-testid="protected-route-error">
        <p className="text-lg text-slate-700" role="alert" data-testid="protected-route-error-message">
          We could not verify your session. The server may be temporarily unavailable.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="protected-route-retry"
        >
          {isFetching ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="protected-route-loading">
        <div className="text-lg text-gray-600" data-testid="protected-route-loading-text">Loading...</div>
      </div>
    );
  }

  if (requiredRole && !hasAnyRole(data?.data?.roles, requiredRole)) {
    return <Navigate to="/" replace data-testid="protected-route-unauthorized" />;
  }

  return <div data-testid={dataTestId || 'protected-route-content'}>{children}</div>;
} 

// Preserves deep links such as a shared /products/:id across the login redirect.
function loginRedirectTarget(pathname: string, search: string) {
  const returnTo = `${pathname}${search}`;
  return returnTo === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
