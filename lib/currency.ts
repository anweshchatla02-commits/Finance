import Decimal from 'decimal.js';

/**
 * Formats a monetary number in Indian standard currency format (en-IN).
 * Examples:
 * 20000 -> ₹20,000
 * 125000 -> ₹1,25,000
 * 250000 -> ₹2,50,000
 */
export function formatINR(amount: number | string | Decimal | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0';
  }

  const num = new Decimal(amount).toNumber();

  if (isNaN(num)) {
    return '₹0';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return formatter.format(num);
}

/**
 * Formats plain number without currency symbol in Indian format
 */
export function formatIndianNumber(amount: number | string | Decimal | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const num = new Decimal(amount).toNumber();

  if (isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
}
