import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';
import { authStorage } from '../lib/authStorage';
import { hasRole } from '../lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  'data-testid'?: string;
}

export function ProtectedRoute({ children, requiredRole, 'data-testid': dataTestId }: ProtectedRouteProps) {
  const token = authStorage.getAccessToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
    retry: false,
    enabled: !!token,
  });

  if (!token || isError) {
    return <Navigate to="/login" replace data-testid="protected-route-redirect" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="protected-route-loading">
        <div className="text-lg text-gray-600" data-testid="protected-route-loading-text">Loading...</div>
      </div>
    );
  }

  if (requiredRole && !hasRole(data?.data?.roles, requiredRole)) {
    return <Navigate to="/" replace data-testid="protected-route-unauthorized" />;
  }

  return <div data-testid={dataTestId || 'protected-route-content'}>{children}</div>;
} 
