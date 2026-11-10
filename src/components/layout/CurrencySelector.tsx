import { useCurrencies, useSelectedCurrency } from '../../hooks/useMoney';
import { BASE_CURRENCY, selectCurrency } from '../../lib/money';

/** Display currency for prices. Conversion is display only; orders are charged in USD. */
export function CurrencySelector() {
  const selected = useSelectedCurrency();
  const { data, isError } = useCurrencies();
  const codes = Array.isArray(data)
    ? data.map((currency) => currency.code).filter((code): code is string => Boolean(code))
    : [];
  // Keep USD and the stored choice selectable while the list loads or when it fails.
  const options = [...new Set([BASE_CURRENCY, selected, ...codes])];

  return (
    <div className="text-xs text-slate-600">
      <label className="flex flex-col gap-1">
        <span>Currency</span>
        <select
          aria-label="Display currency"
          title={isError ? 'Exchange rates are unavailable; prices stay in USD.' : 'Prices are converted for display; you are charged in USD.'}
          data-testid="currency-selector"
          className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm"
          value={selected}
          onChange={(event) => selectCurrency(event.target.value)}
        >
          {options.map((code) => {
            const currency = Array.isArray(data) ? data.find((item) => item.code === code) : undefined;
            return (
              <option key={code} value={code}>
                {currency?.symbol && currency.symbol !== code ? `${code} (${currency.symbol})` : code}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
