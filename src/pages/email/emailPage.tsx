import { useMutation } from '@tanstack/react-query';
import { email } from '../../lib/api';
import { EmailForm } from '../../components/email/EmailForm';
import type { EmailFormData } from '../../types/email';
import { useToast } from '../../hooks/useToast';

export function EmailPage() {
  const { toast } = useToast();

  const { mutate } = useMutation({
    mutationFn: (data: EmailFormData) => email.send(data),
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Email sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send email',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50" data-testid="email-page">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8" data-testid="email-page-container">
        <div className="bg-white rounded-lg shadow p-6" data-testid="email-card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6" data-testid="email-page-title">
            Send Email
          </h1>
          <EmailForm onSubmit={mutate} />
        </div>
      </div>
    </div>
  );
} 