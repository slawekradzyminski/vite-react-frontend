import { useMoney } from '../../hooks/useMoney';
import { formatPrice } from '../../lib/format';

/** Explains that a converted price is an estimate: orders and payments are always in USD. */
export function ChargedInUsdNote({ amountUsd, testId = 'charged-in-usd-note' }: { amountUsd: number; testId?: string }) {
  const { currency, isConverted } = useMoney();
  if (!isConverted) return null;
  return (
    <p className="mt-1 text-xs text-slate-500" data-testid={testId}>
      Charged in USD: {formatPrice(amountUsd)}. {currency.code} prices are estimates.
    </p>
  );
}
