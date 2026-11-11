import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fieldErrorId } from '../../lib/fieldError';
import { serverMessage } from '../../lib/requestErrors';
import { EMPTY_WEBHOOK_FORM, webhookSchema, webhookServerErrors, type WebhookFormData } from '../../validators/webhook';
import type { WebhookEventType } from '../../types/commerce';

interface WebhookFormProps {
  /** Prefix for ids and test ids, so the create and edit forms can coexist. */
  idPrefix: string;
  mode: 'create' | 'edit';
  initialValues?: WebhookFormData;
  eventTypes: WebhookEventType[];
  eventTypesError?: boolean;
  onSubmit: (values: WebhookFormData) => Promise<unknown>;
  onCancel?: () => void;
}

export function WebhookForm({ idPrefix, mode, initialValues = EMPTY_WEBHOOK_FORM, eventTypes, eventTypesError = false, onSubmit, onCancel }: WebhookFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: initialValues,
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const placed = axios.isAxiosError(error) && error.response?.status === 400 ? webhookServerErrors(error.response.data) : [];
      const unplaced = placed.filter((entry) => !entry.field);
      placed.forEach((entry) => { if (entry.field) setError(entry.field, { type: 'server', message: entry.message }); });
      if (placed.length === 0 || unplaced.length > 0) {
        setFormError(unplaced[0]?.message ?? serverMessage(error, 'Unable to save the webhook.'));
      }
    }
  });

  const id = (field: string) => `${idPrefix}-${field}`;
  const fieldError = (field: keyof WebhookFormData) => errors[field]?.message
    ? <p className="mt-1 text-sm text-red-700" role="alert" id={fieldErrorId(id(field))} data-testid={`${idPrefix}-${field}-error`}>{errors[field]?.message}</p>
    : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid={`${idPrefix}-form`}>
      <div>
        <Label htmlFor={id('url')}>Endpoint URL</Label>
        <Input
          id={id('url')}
          type="url"
          placeholder="https://example.com/webhooks/shop or inbox://…"
          className="mt-1"
          autoComplete="off"
          error={errors.url?.message}
          aria-describedby={`${id('url')}-hint`}
          {...register('url')}
          data-testid={`${idPrefix}-url`}
        />
        <p id={`${id('url')}-hint`} className="mt-1 text-xs text-slate-500">A public http(s) endpoint on port 80 or 443, or one of your built-in inboxes.</p>
        {fieldError('url')}
      </div>

      <fieldset aria-describedby={errors.events?.message ? fieldErrorId(id('events')) : undefined}>
        <legend className="text-sm font-medium text-slate-900">Events</legend>
        {eventTypesError && <p className="mt-1 text-sm text-red-700" role="alert" data-testid={`${idPrefix}-event-types-error`}>Unable to load the event types.</p>}
        <div className="mt-2 grid gap-2 sm:grid-cols-2" data-testid={`${idPrefix}-events`}>
          {eventTypes.map((eventType) => (
            <label key={eventType.name} className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                value={eventType.name}
                className="mt-0.5"
                {...register('events')}
                data-testid={`${idPrefix}-event-${eventType.name}`}
              />
              <span>
                <span className="font-mono text-slate-900">{eventType.name}</span>
                {eventType.description && <span className="block text-xs text-slate-500">{eventType.description}</span>}
              </span>
            </label>
          ))}
        </div>
        {fieldError('events')}
      </fieldset>

      <div>
        <Label htmlFor={id('description')}>Description (optional)</Label>
        <Input id={id('description')} className="mt-1" maxLength={255} error={errors.description?.message} {...register('description')} data-testid={`${idPrefix}-description`} />
        {fieldError('description')}
      </div>

      {mode === 'edit' && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register('active')} data-testid={`${idPrefix}-active`} />
          Active (re-enabling resets the failure counter)
        </label>
      )}

      {formError && <p className="text-sm text-red-700" role="alert" data-testid={`${idPrefix}-error`}>{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} data-testid={`${idPrefix}-submit`}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create webhook' : 'Save changes'}
        </Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} data-testid={`${idPrefix}-cancel`}>Cancel</Button>}
      </div>
    </form>
  );
}
