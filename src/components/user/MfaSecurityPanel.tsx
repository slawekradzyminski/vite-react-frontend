import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Check, Copy, Download, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { auth } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { MfaSetupResponse } from '../../types/auth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';

type ActiveAction = 'setup' | 'regenerate' | 'disable' | null;
type BusyAction = Exclude<ActiveAction, null> | 'confirm' | null;

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function MfaSecurityPanel() {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const statusQuery = useQuery({
    queryKey: ['mfa-status'],
    queryFn: async () => (await auth.mfa.status()).data,
  });

  const resetAction = () => {
    setActiveAction(null);
    setSetup(null);
    setCode('');
    setPassword('');
  };

  const beginSetup = async () => {
    setBusyAction('setup');
    try {
      const response = await auth.mfa.setup();
      setSetup(response.data);
      setRecoveryCodes(null);
      setActiveAction('setup');
    } catch (error) {
      toast({ variant: 'error', title: 'Setup failed', description: errorMessage(error, 'Could not start two-factor setup') });
    } finally {
      setBusyAction(null);
    }
  };

  const confirmSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyAction('confirm');
    try {
      const response = await auth.mfa.confirm({ code: code.trim() });
      setRecoveryCodes(response.data.recoveryCodes);
      resetAction();
      await statusQuery.refetch();
      toast({ variant: 'success', title: 'Two-factor authentication enabled', description: 'Save your recovery codes before leaving this page.' });
    } catch (error) {
      toast({ variant: 'error', title: 'Code not accepted', description: errorMessage(error, 'Check the current code and try again') });
    } finally {
      setBusyAction(null);
    }
  };

  const regenerateRecoveryCodes = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyAction('regenerate');
    try {
      const response = await auth.mfa.regenerateRecoveryCodes({ password, code: code.trim() });
      setRecoveryCodes(response.data.recoveryCodes);
      resetAction();
      await statusQuery.refetch();
      toast({ variant: 'success', title: 'Recovery codes replaced', description: 'Your previous recovery codes no longer work.' });
    } catch (error) {
      toast({ variant: 'error', title: 'Could not replace codes', description: errorMessage(error, 'Check your password and authenticator code') });
    } finally {
      setBusyAction(null);
    }
  };

  const disableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyAction('disable');
    try {
      await auth.mfa.disable({ password, code: code.trim() });
      setRecoveryCodes(null);
      resetAction();
      await statusQuery.refetch();
      toast({ variant: 'success', title: 'Two-factor authentication disabled', description: 'Your authenticator and recovery codes have been removed.' });
    } catch (error) {
      toast({ variant: 'error', title: 'Could not disable two-factor authentication', description: errorMessage(error, 'Check your password and security code') });
    } finally {
      setBusyAction(null);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ variant: 'success', title: 'Copied', description: `${label} copied to the clipboard.` });
    } catch {
      toast({ variant: 'error', title: 'Copy failed', description: `Select and copy the ${label.toLowerCase()} manually.` });
    }
  };

  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const blob = new Blob([
      `LocalTalk two-factor recovery codes\n\n${recoveryCodes.join('\n')}\n\nEach code can be used once. Store them securely.\n`,
    ], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'localtalk-recovery-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const queryStatus = axios.isAxiosError(statusQuery.error) ? statusQuery.error.response?.status : undefined;

  return (
    <Surface as="section" variant="default" padding="lg" data-testid="mfa-security-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Two-factor authentication</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Require a code from Microsoft Authenticator after your password.
            </p>
          </div>
        </div>
        {!statusQuery.isLoading && statusQuery.data && (
          <Badge variant={statusQuery.data.enabled ? 'success' : 'default'} data-testid="mfa-status-badge">
            {statusQuery.data.enabled ? 'Enabled' : 'Not enabled'}
          </Badge>
        )}
      </div>

      <div className="mt-6 border-t border-stone-200 pt-6">
        {statusQuery.isLoading && <p className="text-sm text-slate-500">Loading security settings...</p>}

        {statusQuery.isError && (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-slate-700">
              {queryStatus === 409
                ? 'Two-factor authentication for this account is managed by its identity provider.'
                : 'Security settings could not be loaded.'}
            </p>
            {queryStatus !== 409 && <Button type="button" variant="secondary" onClick={() => statusQuery.refetch()}>Try again</Button>}
          </div>
        )}

        {statusQuery.data && !statusQuery.data.enabled && activeAction !== 'setup' && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Protect password sign-ins</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">You will scan a QR code, verify one code, and receive one-time recovery codes.</p>
            </div>
            <Button type="button" onClick={beginSetup} disabled={busyAction !== null} data-testid="mfa-enable-button">
              {busyAction === 'setup' ? 'Preparing...' : 'Enable two-factor authentication'}
            </Button>
          </div>
        )}

        {setup && activeAction === 'setup' && (
          <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]" data-testid="mfa-setup-step">
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <img src={setup.qrCodeDataUri} alt="QR code for authenticator setup" className="aspect-square w-full" data-testid="mfa-setup-qr" />
            </div>
            <div className="space-y-5">
              <div>
                <p className="font-medium text-slate-950">1. Add an account in Microsoft Authenticator</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Choose “Other account”, then scan this QR code. You can also enter the setup key manually.</p>
              </div>
              <div>
                <Label htmlFor="mfa-manual-key">Manual setup key</Label>
                <div className="mt-2 flex gap-2">
                  <Input id="mfa-manual-key" value={setup.secret} readOnly className="font-mono tracking-[0.12em]" data-testid="mfa-manual-key" />
                  <Button type="button" variant="secondary" aria-label="Copy manual setup key" onClick={() => copyText(setup.secret, 'Setup key')}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Setup expires {new Date(setup.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
              </div>
              <form className="space-y-3" onSubmit={confirmSetup}>
                <div>
                  <Label htmlFor="mfa-confirm-code">2. Enter the current six-digit code</Label>
                  <Input
                    id="mfa-confirm-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="mt-2 max-w-xs font-mono tracking-[0.2em]"
                    placeholder="123456"
                    data-testid="mfa-confirm-code"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={code.length !== 6 || busyAction !== null} data-testid="mfa-confirm-button">
                    {busyAction === 'confirm' ? 'Verifying...' : 'Verify and enable'}
                  </Button>
                  <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={resetAction}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {statusQuery.data?.enabled && !activeAction && (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-900">Authenticator verification is active</p>
                <p className="mt-1 text-sm text-slate-600" data-testid="mfa-recovery-count">{statusQuery.data.unusedRecoveryCodes} unused recovery codes remain.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => { setRecoveryCodes(null); setActiveAction('regenerate'); }} data-testid="mfa-regenerate-button">
                <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Replace recovery codes
              </Button>
              <Button type="button" variant="secondary" className="text-red-700 hover:text-red-800" onClick={() => setActiveAction('disable')} data-testid="mfa-disable-button">
                <ShieldOff className="mr-2 h-4 w-4" aria-hidden="true" /> Disable
              </Button>
            </div>
          </div>
        )}

        {activeAction === 'regenerate' && (
          <ProtectedActionForm
            title="Replace recovery codes"
            description="Enter your current password and a fresh authenticator code. All existing recovery codes will stop working."
            codeLabel="Authenticator code"
            submitLabel="Replace codes"
            busy={busyAction === 'regenerate'}
            password={password}
            code={code}
            onPasswordChange={setPassword}
            onCodeChange={setCode}
            onCancel={resetAction}
            onSubmit={regenerateRecoveryCodes}
            testId="mfa-regenerate-form"
          />
        )}

        {activeAction === 'disable' && (
          <ProtectedActionForm
            title="Disable two-factor authentication"
            description="Enter your current password and an authenticator or recovery code. This removes all registered factors."
            codeLabel="Authenticator or recovery code"
            submitLabel="Disable two-factor authentication"
            busy={busyAction === 'disable'}
            password={password}
            code={code}
            onPasswordChange={setPassword}
            onCodeChange={setCode}
            onCancel={resetAction}
            onSubmit={disableMfa}
            danger
            testId="mfa-disable-form"
          />
        )}
      </div>

      {recoveryCodes && (
        <div className="mt-6 border-t border-stone-200 pt-6" data-testid="mfa-recovery-codes">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Save your recovery codes now</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Each code works once. They will not be shown again after you leave this page.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => copyText(recoveryCodes.join('\n'), 'Recovery codes')}>
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy all
              </Button>
              <Button type="button" variant="secondary" onClick={downloadRecoveryCodes}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-x-8 gap-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2" aria-label="Recovery codes">
            {recoveryCodes.map((recoveryCode) => (
              <code key={recoveryCode} className="font-mono text-sm tracking-[0.12em] text-amber-950">{recoveryCode}</code>
            ))}
          </div>
          <Button type="button" variant="link" className="mt-3 px-0" onClick={() => setRecoveryCodes(null)}>I saved these codes</Button>
        </div>
      )}
    </Surface>
  );
}

interface ProtectedActionFormProps {
  title: string;
  description: string;
  codeLabel: string;
  submitLabel: string;
  busy: boolean;
  password: string;
  code: string;
  danger?: boolean;
  testId: string;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function ProtectedActionForm({ title, description, codeLabel, submitLabel, busy, password, code, danger, testId, onPasswordChange, onCodeChange, onCancel, onSubmit }: ProtectedActionFormProps) {
  return (
    <form className="max-w-2xl space-y-4" onSubmit={onSubmit} data-testid={testId}>
      <div>
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${testId}-password`}>Current password</Label>
          <Input id={`${testId}-password`} type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete="current-password" className="mt-2" />
        </div>
        <div>
          <Label htmlFor={`${testId}-code`}>{codeLabel}</Label>
          <Input id={`${testId}-code`} value={code} onChange={(event) => onCodeChange(event.target.value.trim().slice(0, 32))} autoComplete="one-time-code" className="mt-2 font-mono tracking-[0.12em]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant={danger ? 'destructive' : 'default'} disabled={!password || code.length < 6 || busy}>
          {busy ? 'Working...' : submitLabel}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
