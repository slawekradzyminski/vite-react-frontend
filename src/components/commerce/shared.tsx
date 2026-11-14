import type { ReactNode } from 'react';
import { Badge } from '../ui/badge';

export function PageHeader({ eyebrow, title, description, aside }: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      {aside}
    </div>
  );
}

const variantByStatus: Record<string, 'default' | 'success' | 'warning' | 'error' | 'solid'> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  DELIVERED: 'success',
  RECEIVED: 'success',
  REFUNDED: 'success',
  PENDING: 'warning',
  REQUESTED: 'warning',
  AWAITING_PICK: 'warning',
  SCHEDULED: 'warning',
  SUBMITTED: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  DRAFT: 'default',
  PICKED: 'default',
  PACKED: 'default',
  SHIPPED: 'solid',
  SENT: 'success',
  QUEUED: 'warning',
  FAILED: 'error',
  INACTIVE: 'error',
  EXPIRED: 'error',
  EXHAUSTED: 'error',
  REJECTED: 'error',
  CANCELLED: 'error',
};

export function StatusBadge({ status, testId }: { status?: string; testId: string }) {
  const value = status ?? 'UNKNOWN';
  return <Badge variant={variantByStatus[value] ?? 'default'} data-testid={testId}>{value.replace(/_/g, ' ')}</Badge>;
}
