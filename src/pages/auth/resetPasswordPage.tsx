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
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-testid="reset-page">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg" data-testid="reset-container">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900" data-testid="reset-title">
            Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600" data-testid="reset-subtitle">
            Choose a new password for your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="reset-form">
          <div className="space-y-4">
            <div data-testid="reset-token-field">
              <Label htmlFor="token">Reset token</Label>
              <Input
                id="token"
                placeholder="Token from your email"
                className="mt-1"
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
                className="mt-1"
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
                className="mt-1"
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
            <Button type="submit" className="w-full" data-testid="reset-submit-button">
              Update password
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <Button
            variant="link"
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={() => navigate('/login')}
            data-testid="reset-back-to-login"
          >
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
