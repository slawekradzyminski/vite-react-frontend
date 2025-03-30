import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { auth } from '../../lib/api';
import { Role } from '../../types/auth';
import { RegisterFormData, registerSchema } from '../../validators/auth';
import { useToast } from '../../hooks/useToast';

export function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setSubmitError('');

    try {
      await auth.register({
        ...data,
        roles: [Role.CLIENT],
      });
      
      navigate('/login', { state: { toast: { variant: 'success', title: 'Success', description: 'Registration successful! You can now log in.' } } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (errorMessage?.toLowerCase().includes('already in use')) {
        toast({
          variant: 'error',
          title: 'Error',
          description: 'Username already exists',
        });
      } else {
        setSubmitError(errorMessage || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-testid="register-page">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg" data-testid="register-container">
        <div data-testid="register-header">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900" data-testid="register-title">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="register-form">
          <div className="space-y-4">
            <div data-testid="register-username-field">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="mt-1"
                placeholder="Username"
                error={errors.username?.message}
                {...register('username')}
                data-testid="register-username-input"
              />
              {errors.username?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-username-error">{errors.username.message}</p>
              )}
            </div>
            <div data-testid="register-email-field">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="mt-1"
                placeholder="Email"
                error={errors.email?.message}
                {...register('email')}
                data-testid="register-email-input"
              />
              {errors.email?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-email-error">{errors.email.message}</p>
              )}
            </div>
            <div data-testid="register-password-field">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="mt-1"
                placeholder="Password"
                error={errors.password?.message}
                {...register('password')}
                data-testid="register-password-input"
              />
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-password-error">{errors.password.message}</p>
              )}
            </div>
            <div data-testid="register-firstname-field">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                className="mt-1"
                placeholder="First Name"
                error={errors.firstName?.message}
                {...register('firstName')}
                data-testid="register-firstname-input"
              />
              {errors.firstName?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-firstname-error">{errors.firstName.message}</p>
              )}
            </div>
            <div data-testid="register-lastname-field">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                className="mt-1"
                placeholder="Last Name"
                error={errors.lastName?.message}
                {...register('lastName')}
                data-testid="register-lastname-input"
              />
              {errors.lastName?.message && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-lastname-error">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {submitError && (
            <div className="text-sm text-red-600" data-testid="register-submit-error">
              {submitError}
            </div>
          )}

          <div data-testid="register-submit-container">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>

          <div className="text-center text-sm" data-testid="register-login-link-container">
            <span className="text-gray-600">Already have an account? </span>
            <Button
              variant="link"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => navigate('/login')}
              data-testid="register-login-link"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 