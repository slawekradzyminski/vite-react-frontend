import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');

  const { isLoading, isError } = useQuery({
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

  return <>{children}</>;
} 