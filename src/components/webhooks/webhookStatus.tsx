import { Badge } from '../ui/badge';

const variantByStatus: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  DELIVERED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
};

export function DeliveryStatusBadge({ status, testId }: { status?: string; testId: string }) {
  return <Badge variant={variantByStatus[status ?? ''] ?? 'default'} data-testid={testId}>{status ?? 'UNKNOWN'}</Badge>;
}
