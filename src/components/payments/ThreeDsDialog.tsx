import { useState } from 'react';
import { ModalDialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fieldErrorId } from '../../lib/fieldError';

interface ThreeDsDialogProps {
  open: boolean;
  confirming: boolean;
  error?: string;
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

/** Simulated 3-D Secure challenge from the card issuer. */
export function ThreeDsDialog({ open, confirming, error, onConfirm, onCancel }: ThreeDsDialogProps) {
  const [code, setCode] = useState('');
  const trimmed = code.trim();
  return (
    <ModalDialog
      open={open}
      title="3-D Secure verification"
      description="Your bank asks you to confirm this payment."
      onClose={onCancel}
      data-testid="payment-3ds-dialog"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onConfirm(trimmed);
        }}
        data-testid="payment-3ds-form"
      >
        <div>
          <Label htmlFor="three-ds-code" data-testid="payment-3ds-code-label">Verification code</Label>
          <Input
            id="three-ds-code"
            className="mt-2 font-mono"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={12}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-describedby="three-ds-hint"
            error={error}
            data-testid="payment-3ds-code-input"
          />
          <p id="three-ds-hint" className="mt-1 text-xs text-slate-500" data-testid="payment-3ds-hint">Use 123456</p>
          {error && <p className="mt-1 text-sm text-red-600" id={fieldErrorId('three-ds-code')} role="alert" data-testid="payment-3ds-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="payment-3ds-cancel">Cancel</Button>
          <Button type="submit" disabled={!trimmed || confirming} data-testid="payment-3ds-submit">{confirming ? 'Verifying…' : 'Verify'}</Button>
        </div>
      </form>
    </ModalDialog>
  );
}
