/** "Nov 9, 2026" from a plain "2026-11-09" (read as that calendar day, whatever the browser's time zone). */
export const formatMemoDate = (value: string): string =>
    new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

/** "Nov 9, 2026, 2:30 PM" from a full timestamp, in the browser's time zone. */
export const formatMemoDateTime = (value: string): string =>
    new Date(value).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
