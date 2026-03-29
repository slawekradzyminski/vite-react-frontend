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
    <div className="flex min-h-[calc(100svh-7rem)] items-center py-6" data-testid="register-page">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,0.9fr)]" data-testid="register-container">
        <section className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(244,240,235,0.98))] p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <div className="space-y-8">
            <img
              src="/images/logo/generated/at-transparent.png"
              alt="Awesome Testing"
              className="h-14 w-14 object-contain"
            />
            <div className="space-y-4" data-testid="register-header">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Awesome Testing</p>
              <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950" data-testid="register-title">
                Create your account
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Join the workspace and get immediate access to operations tooling, monitoring flows, and the AI surface.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Fast start</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create an account and move straight into the dashboard.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Managed access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Client role defaults keep onboarding predictable.</p>
            </div>
            <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Connected tools</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Products, email, QR, traffic, and LLM tools stay in one place.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white/88 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="register-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2" data-testid="register-username-field">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  className="mt-2 bg-white"
                  placeholder="Username"
                  error={errors.username?.message}
                  {...register('username')}
                  data-testid="register-username-input"
                />
                {errors.username?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-username-error">{errors.username.message}</p>
                )}
              </div>
              <div className="sm:col-span-2" data-testid="register-email-field">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-2 bg-white"
                  placeholder="Email"
                  error={errors.email?.message}
                  {...register('email')}
                  data-testid="register-email-input"
                />
                {errors.email?.message && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-testid="register-email-error">{errors.email.message}</p>
                )}
              </div>
              <div className="sm:col-span-2" data-testid="register-password-field">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="mt-2 bg-white"
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
                  className="mt-2 bg-white"
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
                  className="mt-2 bg-white"
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
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="register-submit-error">
                {submitError}
              </div>
            )}

            <div data-testid="register-submit-container">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                disabled={loading}
                data-testid="register-submit-button"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>

            <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm text-slate-600" data-testid="register-login-link-container">
              <span>Already have an account? </span>
              <Button
                variant="link"
                className="px-0 font-medium text-sky-700 hover:text-sky-600"
                onClick={() => navigate('/login')}
                data-testid="register-login-link"
              >
                Sign in
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
} 
