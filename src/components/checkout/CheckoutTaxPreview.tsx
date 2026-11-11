import { useQuery } from '@tanstack/react-query';
import { vatRates } from '../../lib/api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useMoney } from '../../hooks/useMoney';
import { formatPercent } from '../../lib/money';
import { responseStatus } from '../../lib/requestErrors';

export const TAX_PREVIEW_DEBOUNCE_MS = 300;

/**
 * VAT contained in the cart total for the country typed at checkout. Prices already include
 * VAT, so this never changes the total; unknown countries are checked out without VAT.
 */
export function CheckoutTaxPreview({ country, cartTotal }: { country: string; cartTotal: number }) {
  const { formatMoney } = useMoney();
  const debouncedCountry = useDebouncedValue(country.trim(), TAX_PREVIEW_DEBOUNCE_MS);
  // The cart total is part of the key so a coupon or quantity change asks again.
  const preview = useQuery({
    queryKey: ['tax-preview', debouncedCountry, cartTotal],
    queryFn: async () => (await vatRates.preview(debouncedCountry)).data,
    enabled: debouncedCountry.length > 0,
    retry: false,
  });

  if (!debouncedCountry) return null;
  if (preview.isLoading) {
    return <p className="mb-3 text-sm text-slate-500" data-testid="checkout-tax-loading">Calculating VAT…</p>;
  }
  if (preview.isError) {
    const unknown = responseStatus(preview.error) === 404;
    return (
      <p className="mb-3 text-sm text-slate-500" data-testid="checkout-tax-unavailable">
        {unknown ? `No VAT rate for "${debouncedCountry}"; the order is placed without VAT.` : 'VAT preview is unavailable right now.'}
      </p>
    );
  }
  const tax = preview.data;
  if (!tax || tax.rate == null || tax.taxAmount == null) return null;

  return (
    <div className="mb-3 flex items-center justify-between text-sm text-slate-600" data-testid="checkout-tax-preview">
      <span data-testid="checkout-tax-label">Includes VAT {formatPercent(tax.rate)} ({tax.country})</span>
      <span data-testid="checkout-tax-amount">{formatMoney(tax.taxAmount)}</span>
    </div>
  );
}
