import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { auth } from '../lib/api';
import { LoginFormData, loginSchema } from '../validators/auth';
import { useToast } from '../hooks/toast';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="mt-1"
                placeholder="Username"
                error={errors.username?.message}
                {...register('username')}
              />
              {errors.username?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.username.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="mt-1"
                placeholder="Password"
                error={errors.password?.message}
                {...register('password')}
              />
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Button
              variant="link"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 