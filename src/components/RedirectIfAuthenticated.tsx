import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { authStorage } from '../lib/authStorage';
import { readLoginReturnTo } from '../lib/loginNavigation';
import { useMe } from '../hooks/useMe';

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

// Keeps a valid session when a signed-in user opens /login or /register (BUG-003).
// A token the backend rejects is dropped so the form can be used to sign in again.
export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const location = useLocation();
  const token = authStorage.getAccessToken();

  const { isSuccess, isError } = useMe({ enabled: !!token });

  useEffect(() => {
    if (token && isError) {
      authStorage.signOut();
    }
  }, [token, isError]);

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

  return <>{children}</>;
}
