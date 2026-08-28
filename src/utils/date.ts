const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// Monday-first, matching the design's ["L","M","M","J","V","S","D"] week.
const FRENCH_WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Whole calendar days between two date-only values (b - a), ignoring time of day.
export function diffDays(aKey: string, bKey: string): number {
  const a = parseDateKey(aKey);
  const b = parseDateKey(bKey);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function formatFrenchDate(date: Date): string {
  return `${date.getDate()} ${FRENCH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFrenchDateRange(start: Date, end: Date): string {
  return `${formatFrenchDate(start)} → ${formatFrenchDate(end)}`;
}

export function weekdayLetterFR(date: Date): string {
  const jsDay = date.getDay(); // 0 = Sunday
  const mondayFirst = (jsDay + 6) % 7;
  return FRENCH_WEEKDAY_LETTERS[mondayFirst];
}

// Cycle day, 1..100, clamped. Day 1 is the start date itself.
export function cycleDayFor(startKey: string, onKey: string): number {
  const elapsed = diffDays(startKey, onKey);
  return Math.min(100, Math.max(1, elapsed + 1));
}
