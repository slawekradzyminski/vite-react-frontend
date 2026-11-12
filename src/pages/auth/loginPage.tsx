import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { authStorage } from '../../lib/authStorage';
import { LoginFormData, loginSchema } from '../../validators/auth';
import { useToast } from '../../hooks/useToast';
import { Surface } from '../../components/ui/surface';
import { Badge } from '../../components/ui/badge';
import type { LoginResponse } from '../../types/auth';
import { navigateAfterLogin, readLoginReturnTo } from '../../lib/loginNavigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fieldErrorId } from '../../lib/fieldError';

export function LoginPage() {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const response = await auth.login(data);
      if (response.data.mfaRequired) {
        if (!response.data.challengeToken) {
          throw new Error('MFA challenge was not returned');
        }
        setMfaChallenge(response.data.challengeToken);
        setMfaCode('');
        return;
      }
      finishLogin(response.data);
    } catch (err: any) {
      if (err.response?.status === 422) {
        toast({
          variant: 'error',
          title: 'Error',
          description: 'Invalid username/password',
        });
      } else {
        toast({
          variant: 'error',
          title: 'Error',
          description: err.response?.data?.message || 'Failed to login',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = (response: LoginResponse) => {
    if (!response.token || !response.refreshToken) {
      throw new Error('Login tokens were not returned');
    }
    authStorage.setTokens({ token: response.token, refreshToken: response.refreshToken });
    navigateAfterLogin(readLoginReturnTo(location.search), navigate);
  };

  const handleMfaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaChallenge || mfaCode.trim().length < 6) {
      return;
    }
    setLoading(true);
    try {
      const response = await auth.completeMfaLogin({
        challengeToken: mfaChallenge,
        code: mfaCode.trim(),
      });
      finishLogin(response.data);
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to verify the security code',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center py-1 sm:py-2" data-testid="login-page">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]" data-testid="login-container">
        <Surface as="section" variant="heroAccent" padding="auth" className="relative overflow-hidden p-6 lg:p-7" data-testid="login-hero">
          <div className="absolute inset-x-8 bottom-0 h-28 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.10),_transparent_72%)]" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-center" data-testid="login-hero-content">
            <div className="space-y-8 lg:space-y-10" data-testid="login-header">
              <Badge tone="tracking" variant="outline" className="text-[11px] tracking-[0.26em]" data-testid="login-brand-badge">Awesome Testing</Badge>
              <div className="space-y-5 lg:space-y-6">
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="login-title">
                  Sign in to your account
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600" data-testid="login-subtitle">
                  Step into the operations workspace for product management, live monitoring, and AI-assisted testing flows.
                </p>
              </div>
              <div
                className="max-w-xl rounded-[1.4rem] border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm leading-6 text-amber-950 shadow-[0_18px_40px_-32px_rgba(120,53,15,0.55)]"
                data-testid="login-playground-notice"
              >
                Public training playground only. Use fake data, expect resets, and do not treat this environment as private or production-grade.
              </div>
            </div>
          </div>
        </Surface>

        <Surface as="section" variant="default" padding="auth" className="bg-white/88 p-6 lg:p-7 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]" data-testid="login-card">
          <form
            className="space-y-4"
            onSubmit={mfaChallenge ? handleMfaSubmit : handleSubmit(onSubmit)}
            noValidate
            data-testid="login-form"
          >
            {mfaChallenge ? (
              <div className="space-y-5" data-testid="login-mfa-step">
                <div className="space-y-2">
                  <Badge tone="tracking" variant="outline" className="text-[11px] tracking-[0.2em]">Second factor</Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Verify your sign-in</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Enter the six-digit code from Microsoft Authenticator, or use one of your recovery codes.
                  </p>
                </div>
                <div>
                  <Label htmlFor="mfa-code">Authenticator or recovery code</Label>
                  <Input
                    id="mfa-code"
                    className="mt-2 font-mono tracking-[0.16em]"
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value)}
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="123456"
                    data-testid="login-mfa-code-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  disabled={loading || mfaCode.trim().length < 6}
                  data-testid="login-mfa-submit-button"
                >
                  {loading ? 'Verifying...' : 'Verify and sign in'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-full"
                  disabled={loading}
                  onClick={() => {
                    setMfaChallenge(null);
                    setMfaCode('');
                  }}
                  data-testid="login-mfa-back-button"
                >
                  Back to password
                </Button>
              </div>
            ) : (
              <>
            <div className="space-y-4">
              <div data-testid="login-username-field">
                <Label htmlFor="username" data-testid="login-username-label">Username</Label>
                <Input
                  id="username"
                  className="mt-2"
                  placeholder="Username"
                  error={errors.username?.message}
                  autoComplete="username"
                  {...register('username')}
                  data-testid="login-username-input"
                />
                {errors.username?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" id={fieldErrorId('username')} data-testid="login-username-error">{errors.username.message}</p>
                )}
              </div>
              <div data-testid="login-password-field">
                <Label htmlFor="password" data-testid="login-password-label">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="mt-2"
                  placeholder="Password"
                  error={errors.password?.message}
                  autoComplete="current-password"
                  {...register('password')}
                  data-testid="login-password-input"
                />
                {errors.password?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" id={fieldErrorId('password')} data-testid="login-password-error">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end text-sm" data-testid="login-forgot-link-container">
              <Button
                variant="link"
                type="button"
                className="px-0 text-sky-700 hover:text-sky-600"
                onClick={() => navigate('/forgot-password')}
                data-testid="login-forgot-link"
              >
                Forgot password?
              </Button>
            </div>

            <div data-testid="login-submit-container">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-slate-600" data-testid="login-register-link-container">
              <span>Don't have an account? </span>
              <Button
                variant="link"
                className="px-0 font-medium text-sky-700 hover:text-sky-600"
                type="button"
                onClick={() => navigate('/register')}
                data-testid="login-register-link"
              >
                Register
              </Button>
            </div>
              </>
            )}
          </form>
        </Surface>
      </div>
    </div>
  );
} 
