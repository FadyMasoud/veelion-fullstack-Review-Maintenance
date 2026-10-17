// A sortable number for an ISO date. Missing or invalid dates become 0, so
// they sort as the oldest instead of breaking the order.
export function toTime(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

// "5 minutes ago", "yesterday", "3 months ago"...
export function formatRelativeTime(value: string, now = Date.now()): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return "Unknown time";
  }

  const seconds = Math.round((time - now) / 1000);
  for (const [unit, unitSeconds] of TIME_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTimeFormat.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return "just now";
}

export function formatFullDate(value: string): string {
  const time = Date.parse(value);
  return Number.isNaN(time) ? "" : new Date(time).toLocaleString();
}

// Short date for table cells, e.g. "Oct 16, 2026, 11:50 PM".
export function formatShortDate(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return "-";
  }

  return new Date(time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
