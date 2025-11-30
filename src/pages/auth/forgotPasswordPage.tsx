import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { ForgotPasswordFormData, forgotPasswordSchema } from '../../validators/auth';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rawToken, setRawToken] = useState<string | null>(null);

  const resetDestination = useMemo(
    () => import.meta.env.VITE_PASSWORD_RESET_BASE_URL ?? `${window.location.origin}/reset`,
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-testid="forgot-page">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg" data-testid="forgot-container">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900" data-testid="forgot-title">
            Forgot password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600" data-testid="forgot-subtitle">
            Enter your username or e-mail and we will send a password reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="forgot-form">
          <div className="space-y-4">
            <div data-testid="forgot-identifier-field">
              <Label htmlFor="identifier">Username or email</Label>
              <Input
                id="identifier"
                placeholder="username or email"
                className="mt-1"
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
            <Button type="submit" className="w-full" disabled={loading} data-testid="forgot-submit-button">
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </div>
        </form>

        {rawToken && (
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700" data-testid="forgot-token-container">
            <p className="font-semibold">Developer token (local profile only):</p>
            <Input
              readOnly
              className="mt-2"
              value={rawToken}
              onFocus={(e) => e.currentTarget.select()}
              data-testid="forgot-token-value"
            />
          </div>
        )}

        <div className="text-center text-sm text-gray-600">
          <Button
            variant="link"
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={() => navigate('/login')}
            data-testid="forgot-back-to-login"
          >
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
