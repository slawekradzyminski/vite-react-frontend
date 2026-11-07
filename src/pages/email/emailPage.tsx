import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { email } from '../../lib/api';
import { EmailForm } from '../../components/email/EmailForm';
import type { EmailFormData } from '../../types/email';
import { useToast } from '../../hooks/useToast';
import { Surface } from '../../components/ui/surface';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function EmailPage() {
  useDocumentTitle('Send Email');
  const { toast } = useToast();
  // isPending only flips after a re-render; the ref also blocks a fast double click (BUG-012).
  const inFlight = useRef(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmailFormData) => email.send(data),
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Email queued for delivery',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send email',
      });
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });

  const sendEmail = (data: EmailFormData) => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutate(data);
  };

  return (
    <div className="space-y-6 pb-10" data-testid="email-page">
      <Surface as="section" variant="hero" padding="xl" data-testid="email-page-container">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Communications</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="email-page-title">
              Send Email
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Compose outbound messages with a recipient picker, subject line, and a single review surface.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
            Delivery is queued and processed asynchronously.
          </div>
        </div>
      </Surface>

      <div className="mx-auto max-w-3xl" data-testid="email-content">
        <Surface variant="default" padding="lg" data-testid="email-card">
          <EmailForm onSubmit={sendEmail} isLoading={isPending} />
        </Surface>
      </div>
    </div>
  );
} 
