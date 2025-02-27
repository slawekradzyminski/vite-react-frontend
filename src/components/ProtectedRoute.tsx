import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Define the possible role formats
type Role = string | { authority: string };

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
    retry: false,
    enabled: !!token,
  });

  if (!token || isError) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
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
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
} 