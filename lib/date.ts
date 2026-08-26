/**
 * Indian timezone and date handling utilities (Asia/Kolkata)
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date string YYYY-MM-DD in IST
 */
export function getTodayISTString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a date or string to midnight IST (00:00:00.000)
 */
export function toISTStartOfDay(dateInput: Date | string): Date {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date();
  
  // Format as YYYY-MM-DD in IST timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
}

/**
 * Formats a date for UI display (e.g. "25 Aug 2026")
 */
export function formatDateReadable(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats timestamp for audit logs and receipts (e.g. "25 Aug 2026, 11:45 PM IST")
 */
export function formatDateTimeReadable(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats a date to HTML input date string YYYY-MM-DD
 */
export function formatDateInput(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return getTodayISTString();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getTodayISTString();

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}
