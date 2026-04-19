import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { sso } from '../../lib/sso';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const { toast } = useToast();
  const ssoEnabled = sso.isEnabled();
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (location.state?.toast) {
      toast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location, toast]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const response = await auth.login(data);
      authStorage.setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      });
      navigate('/');
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

  const handleSsoLogin = async () => {
    setSsoLoading(true);

    try {
      await sso.beginLogin();
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Error',
        description: err?.message || 'Failed to start SSO login',
      });
      setSsoLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setSocialLoading(provider);

    try {
      await sso.beginSocialLogin(provider);
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Error',
        description: err?.message || `Failed to start ${provider} login`,
      });
      setSocialLoading(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-7rem)] items-center py-6" data-testid="login-page">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]" data-testid="login-container">
        <Surface as="section" variant="heroAccent" padding="auth" className="flex flex-col justify-between">
          <div className="space-y-8">
            <img
              src="/branding/generated/at-transparent.png"
              alt="Awesome Testing"
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-4" data-testid="login-header">
              <Badge tone="tracking" variant="outline" className="text-[11px] tracking-[0.26em]">Awesome Testing</Badge>
              <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="login-title">
                Sign in to your account
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Step into the operations workspace for product management, live monitoring, and AI-assisted testing flows.
              </p>
              <div
                className="max-w-xl rounded-[1.4rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-950 shadow-[0_18px_40px_-32px_rgba(120,53,15,0.55)]"
                data-testid="login-playground-notice"
              >
                Public training playground only. Use fake data, expect resets, and do not treat this environment as private or production-grade.
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Operations</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Products, users, and order context in one surface.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Monitoring</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Traffic visibility with live WebSocket updates.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">AI</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Prompt, chat, and tool flows backed by SSE streaming.</p>
            </div>
          </div>
        </Surface>

        <Surface as="section" variant="default" padding="auth" className="bg-white/88 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="login-form">
            <div className="space-y-4">
              <div data-testid="login-username-field">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  className="mt-2"
                  placeholder="Username"
                  error={errors.username?.message}
                  {...register('username')}
                  data-testid="login-username-input"
                />
                {errors.username?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="login-username-error">{errors.username.message}</p>
                )}
              </div>
              <div data-testid="login-password-field">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="mt-2"
                  placeholder="Password"
                  error={errors.password?.message}
                  {...register('password')}
                  data-testid="login-password-input"
                />
                {errors.password?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="login-password-error">{errors.password.message}</p>
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
                disabled={loading || ssoLoading || socialLoading !== null}
                data-testid="login-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            {ssoEnabled && (
              <>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span className="h-px flex-1 bg-stone-200" />
                  <span>or</span>
                  <span className="h-px flex-1 bg-stone-200" />
                </div>

                <div data-testid="login-sso-button-container">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    disabled={loading || ssoLoading || socialLoading !== null}
                    onClick={handleSsoLogin}
                    data-testid="login-sso-button"
                  >
                    {ssoLoading ? 'Redirecting...' : 'Sign in with SSO'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3" data-testid="login-social-buttons-container">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    disabled={loading || ssoLoading || socialLoading !== null}
                    onClick={() => handleSocialLogin('google')}
                    data-testid="login-google-button"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {socialLoading === 'google' ? 'Redirecting...' : 'Google'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    disabled={loading || ssoLoading || socialLoading !== null}
                    onClick={() => handleSocialLogin('github')}
                    data-testid="login-github-button"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    {socialLoading === 'github' ? 'Redirecting...' : 'GitHub'}
                  </Button>
                </div>
              </>
            )}

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
          </form>
        </Surface>
      </div>
    </div>
  );
} 
