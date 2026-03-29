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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center py-6" data-testid="login-page">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]" data-testid="login-container">
        <section className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(244,240,235,0.98))] p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <div className="space-y-8">
            <img
              src="/images/logo/generated/at-transparent.png"
              alt="Awesome Testing"
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-4" data-testid="login-header">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Awesome Testing</p>
              <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="login-title">
                Sign in to your account
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Step into the operations workspace for product management, live monitoring, and AI-assisted testing flows.
              </p>
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
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white/88 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="login-form">
            <div className="space-y-4 rounded-md shadow-sm">
              <div data-testid="login-username-field">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  className="mt-2 bg-white"
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
                  className="mt-2 bg-white"
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
          </form>
        </section>
      </div>
    </div>
  );
} 
