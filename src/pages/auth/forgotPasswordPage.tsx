import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { getPasswordResetBaseUrl } from '../../lib/runtimeConfig';
import { ForgotPasswordFormData, forgotPasswordSchema } from '../../validators/auth';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rawToken, setRawToken] = useState<string | null>(null);

  const resetDestination = useMemo(
    () => getPasswordResetBaseUrl(),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setRawToken(null);
    try {
      const payload = {
        identifier: data.identifier,
        resetBaseUrl: resetDestination,
      };
      const response = await auth.requestPasswordReset(payload);
      setRawToken(response.data.token ?? null);
      toast({
        variant: 'success',
        title: 'Check your email',
        description: 'If the account exists, we sent password reset instructions.',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ?? 'Unable to process request';
      toast({
        variant: 'error',
        title: 'Request failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-7rem)] items-center py-6" data-testid="forgot-page">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]" data-testid="forgot-container">
        <section className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(244,240,235,0.98))] p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <div className="space-y-8">
            <img
              src="/images/logo/generated/at-transparent.png"
              alt="Awesome Testing"
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Password recovery</p>
              <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="forgot-title">
                Forgot password
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600" data-testid="forgot-subtitle">
                Enter your username or e-mail and we will send a password reset link.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Single step</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Request a reset with either username or e-mail.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Safe flow</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">The response stays neutral even when an account does not exist.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Local dev</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Developer token output remains visible for local workflows.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white/88 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="forgot-form">
            <div className="space-y-4">
              <div data-testid="forgot-identifier-field">
                <Label htmlFor="identifier">Username or email</Label>
                <Input
                  id="identifier"
                  placeholder="username or email"
                  className="mt-2 bg-white"
                  error={errors.identifier?.message}
                  {...register('identifier')}
                  data-testid="forgot-identifier-input"
                />
                {errors.identifier?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="forgot-identifier-error">
                    {errors.identifier.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                disabled={loading}
                data-testid="forgot-submit-button"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>

          {rawToken && (
            <div className="mt-6 rounded-[1.2rem] border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700" data-testid="forgot-token-container">
              <p className="font-semibold">Developer token (local profile only):</p>
              <Input
                readOnly
                className="mt-2 bg-white"
                value={rawToken}
                onFocus={(e) => e.currentTarget.select()}
                data-testid="forgot-token-value"
              />
            </div>
          )}

          <div className="mt-6 rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-slate-600">
            <Button
              variant="link"
              type="button"
              className="px-0 font-medium text-sky-700 hover:text-sky-600"
              onClick={() => navigate('/login')}
              data-testid="forgot-back-to-login"
            >
              Back to login
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
