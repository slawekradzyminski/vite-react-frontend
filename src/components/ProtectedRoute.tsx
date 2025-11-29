import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';
import { authStorage } from '../lib/authStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  'data-testid'?: string;
}

// Define the possible role formats
type Role = string | { authority: string };

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

  if (requiredRole && data?.data?.roles) {
    const hasRequiredRole = Array.isArray(data.data.roles) 
      ? data.data.roles.some((role: Role) => 
          typeof role === 'string' 
            ? role === `ROLE_${requiredRole}` || role === requiredRole
            : role.authority === `ROLE_${requiredRole}` || role.authority === requiredRole)
      : false;
    
    if (!hasRequiredRole) {
      console.log('User does not have the required role, redirecting to home');
      return <Navigate to="/" replace data-testid="protected-route-unauthorized" />;
    }
  }

  return <div data-testid={dataTestId || "protected-route-content"}>{children}</div>;
} 
