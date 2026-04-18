import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { Surface } from '../../components/ui/surface';
import { authStorage } from '../../lib/authStorage';
import { sso } from '../../lib/sso';

export function SsoCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing single sign-on...');

  useEffect(() => {
    let active = true;

    const finish = async () => {
      try {
        const response = await sso.completeCallback();
        authStorage.setTokens({
          token: response.token,
          refreshToken: response.refreshToken,
        });

        if (!active) {
          return;
        }

        setState('success');
        navigate('/', { replace: true });
      } catch (err: any) {
        sso.clearCallbackState();
        if (!active) {
          return;
        }

        setState('error');
        setMessage(err?.message || 'Failed to complete SSO login');
      }
    };

    finish();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[calc(100svh-7rem)] items-center py-6" data-testid="sso-callback-page">
      <Surface as="section" variant="default" padding="auth" className="mx-auto w-full max-w-xl">
        <div className="flex items-start gap-4">
          {state === 'loading' && <Spinner size="md" data-testid="sso-callback-spinner" />}
          {state === 'success' && <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />}
          {state === 'error' && <AlertCircle className="mt-0.5 h-6 w-6 text-red-600" />}

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950" data-testid="sso-callback-title">
              Single sign-on
            </h1>
            <p className="text-sm leading-6 text-slate-600" data-testid="sso-callback-message">
              {message}
            </p>

            {state === 'error' && (
              <Button
                type="button"
                className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => navigate('/login', { replace: true })}
                data-testid="sso-callback-back-button"
              >
                Back to login
              </Button>
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}
