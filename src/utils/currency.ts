import { CurrencyOption } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (৳)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (د.إ)' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (﷼)' },
];

export function getCurrencySymbol(currencyCode = 'BDT'): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase());
  return found ? found.symbol : '৳';
}

/**
 * Format currency with symbol and safe 2-decimal formatting.
 * Handles negative numbers like: -৳862,721.10
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'BDT',
  options: { showSign?: boolean; absolute?: boolean } = {}
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const safeAmount = isNaN(amount) ? 0 : amount;
  const isNegative = safeAmount < 0;
  const val = options.absolute ? Math.abs(safeAmount) : safeAmount;

  // Format with thousands separator and 2 decimals
  const formattedVal = Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (options.showSign && safeAmount > 0) {
    return `+${symbol}${formattedVal}`;
  }

  if (isNegative && !options.absolute) {
    return `-${symbol}${formattedVal}`;
  }

  return `${symbol}${formattedVal}`;
}
