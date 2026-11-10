import { Badge } from '../ui/badge';
import type { PaymentStatus } from '../../types/payment';

const VARIANTS: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  CAPTURED: 'success',
  PROCESSING: 'warning',
  REQUIRES_ACTION: 'warning',
  FAILED: 'error',
  VOIDED: 'error',
  PARTIALLY_REFUNDED: 'outline',
  REFUNDED: 'outline',
};

const LABELS: Record<PaymentStatus, string> = {
  CAPTURED: 'Captured',
  PROCESSING: 'Processing',
  REQUIRES_ACTION: 'Needs verification',
  FAILED: 'Failed',
  VOIDED: 'Voided',
  PARTIALLY_REFUNDED: 'Partially refunded',
  REFUNDED: 'Refunded',
};

export function PaymentStatusBadge({ status, testId }: { status: PaymentStatus; testId: string }) {
  return <Badge variant={VARIANTS[status] ?? 'default'} data-testid={testId} data-status={status}>{LABELS[status] ?? status}</Badge>;
}
