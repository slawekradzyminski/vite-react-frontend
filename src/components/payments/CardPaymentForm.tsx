import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fieldErrorId } from '../../lib/fieldError';
import { formatCardNumber, formatExpiry, type TestCard } from '../../lib/payment';
import { formatPrice } from '../../lib/format';
import { ChargedInUsdNote } from '../commerce/ChargedInUsdNote';
import { createCardSchema, toPaymentCard, type CardFormValues } from '../../validators/payment';
import type { PaymentCard } from '../../types/payment';
import { TestCardsHelper } from './TestCardsHelper';

interface CardPaymentFormProps {
  amountDue: number;
  submitting: boolean;
  error?: string;
  onSubmit: (card: PaymentCard) => void;
  now?: () => Date;
}

const FIELD_ERROR_CLASS = 'mt-1 text-sm text-red-600';

export function CardPaymentForm({ amountDue, submitting, error, onSubmit, now }: CardPaymentFormProps) {
  const schema = useMemo(() => createCardSchema(now), [now]);
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { number: '', expiry: '', cvc: '', holderName: '' },
  });

  const fillTestCard = (card: TestCard) => {
    const year = ((now?.() ?? new Date()).getFullYear() + 3) % 100;
    setValue('number', card.number, { shouldValidate: true });
    setValue('expiry', `12/${String(year).padStart(2, '0')}`, { shouldValidate: true });
    setValue('cvc', '123', { shouldValidate: true });
    if (!getValues('holderName').trim()) setValue('holderName', 'Test Cardholder', { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <TestCardsHelper onPick={fillTestCard} />
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => onSubmit(toPaymentCard(values)))}
        data-testid="payment-card-form"
      >
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" data-testid="payment-form-error">{error}</p>}
        <div>
          <Label htmlFor="card-number" data-testid="payment-card-number-label">Card number</Label>
          <Input
            id="card-number"
            className="mt-2 font-mono"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            {...register('number', { onChange: (event) => setValue('number', formatCardNumber(event.target.value)) })}
            error={errors.number?.message}
            data-testid="payment-card-number-input"
          />
          {errors.number && <p className={FIELD_ERROR_CLASS} id={fieldErrorId('card-number')} data-testid="payment-card-number-error">{errors.number.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="card-expiry" data-testid="payment-card-expiry-label">Expiry (MM/YY)</Label>
            <Input
              id="card-expiry"
              className="mt-2 font-mono"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              {...register('expiry', { onChange: (event) => setValue('expiry', formatExpiry(event.target.value)) })}
              error={errors.expiry?.message}
              data-testid="payment-card-expiry-input"
            />
            {errors.expiry && <p className={FIELD_ERROR_CLASS} id={fieldErrorId('card-expiry')} data-testid="payment-card-expiry-error">{errors.expiry.message}</p>}
          </div>
          <div>
            <Label htmlFor="card-cvc" data-testid="payment-card-cvc-label">CVC</Label>
            <Input
              id="card-cvc"
              className="mt-2 font-mono"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              {...register('cvc')}
              error={errors.cvc?.message}
              data-testid="payment-card-cvc-input"
            />
            {errors.cvc && <p className={FIELD_ERROR_CLASS} id={fieldErrorId('card-cvc')} data-testid="payment-card-cvc-error">{errors.cvc.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="card-holder" data-testid="payment-card-holder-label">Name on card</Label>
          <Input
            id="card-holder"
            className="mt-2"
            autoComplete="cc-name"
            {...register('holderName')}
            error={errors.holderName?.message}
            data-testid="payment-card-holder-input"
          />
          {errors.holderName && <p className={FIELD_ERROR_CLASS} id={fieldErrorId('card-holder')} data-testid="payment-card-holder-error">{errors.holderName.message}</p>}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={submitting} data-testid="payment-submit">
          {submitting ? 'Processing payment…' : `Pay ${formatPrice(amountDue)}`}
        </Button>
        <ChargedInUsdNote amountUsd={amountDue} testId="payment-charged-in-usd" />
      </form>
    </div>
  );
}
