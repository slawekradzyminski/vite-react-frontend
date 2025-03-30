import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
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
      localStorage.setItem('token', response.data.token);
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-testid="login-page">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg" data-testid="login-container">
        <div data-testid="login-header">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900" data-testid="login-title">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="login-form">
          <div className="space-y-4 rounded-md shadow-sm">
            <div data-testid="login-username-field">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="mt-1"
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
                className="mt-1"
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

          <div data-testid="login-submit-container">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center text-sm" data-testid="login-register-link-container">
            <span className="text-gray-600">Don't have an account? </span>
            <Button
              variant="link"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => navigate('/register')}
              data-testid="login-register-link"
            >
              Register
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 