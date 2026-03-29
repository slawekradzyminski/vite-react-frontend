import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { ResetPasswordFormData, resetPasswordSchema } from '../../validators/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setValue('token', token);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await auth.resetPassword(data);
      toast({
        variant: 'success',
        title: 'Password updated',
        description: 'You can now log in with your new password.',
      });
      navigate('/login', {
        state: {
          toast: {
            variant: 'success',
            title: 'Password updated',
            description: 'Sign in with your new password.',
          },
        },
      });
    } catch (err: any) {
      const description = err.response?.data?.message ?? 'Unable to reset password';
      toast({
        variant: 'error',
        title: 'Reset failed',
        description,
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center py-6" data-testid="reset-page">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]" data-testid="reset-container">
        <section className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(244,240,235,0.98))] p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <div className="space-y-8">
            <img
              src="/images/logo/generated/at-transparent.png"
              alt="Awesome Testing"
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Password recovery</p>
              <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="reset-title">
                Reset password
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600" data-testid="reset-subtitle">
                Choose a new password for your account.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Prefill ready</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Query-string token support keeps the reset flow short.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Validation</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Password confirmation stays enforced before submit.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Return path</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Successful reset routes the user back into sign-in cleanly.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white/88 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="reset-form">
            <div className="space-y-4">
              <div data-testid="reset-token-field">
                <Label htmlFor="token">Reset token</Label>
                <Input
                  id="token"
                  placeholder="Token from your email"
                  className="mt-2 bg-white"
                  error={errors.token?.message}
                  {...register('token')}
                  data-testid="reset-token-input"
                />
                {errors.token?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="reset-token-error">
                    {errors.token.message}
                  </p>
                )}
              </div>

              <div data-testid="reset-password-field">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="New password"
                  className="mt-2 bg-white"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                  data-testid="reset-password-input"
                />
                {errors.newPassword?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="reset-password-error">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div data-testid="reset-confirm-password-field">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  className="mt-2 bg-white"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                  data-testid="reset-confirm-password-input"
                />
                {errors.confirmPassword?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="reset-confirm-password-error">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                data-testid="reset-submit-button"
              >
                Update password
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-slate-600">
            <Button
              variant="link"
              type="button"
              className="px-0 font-medium text-sky-700 hover:text-sky-600"
              onClick={() => navigate('/login')}
              data-testid="reset-back-to-login"
            >
              Back to login
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
