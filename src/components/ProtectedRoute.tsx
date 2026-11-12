import { Navigate, useLocation } from 'react-router';
import { authStorage } from '../lib/authStorage';
import { hasAnyRole } from '../lib/roles';
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

  const { data, isLoading, isError } = useMe({ enabled: !!token });

  if (!token || isError) {
    return <Navigate to={loginRedirectTarget(location.pathname, location.search)} replace data-testid="protected-route-redirect" />;
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
