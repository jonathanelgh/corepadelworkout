export function parseMonth(value: string | null | undefined): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthPeriodStart(year: number, month: number): string {
  return `${monthKey(year, month)}-01`;
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isFinishedMonth(year: number, month: number, now = new Date()): boolean {
  return now.getTime() >= Date.UTC(year, month, 1);
}

export function previousFinishedMonth(now = new Date()): { year: number; month: number } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (month === 0) return { year: year - 1, month: 12 };
  return { year, month };
}

export function recentFinishedMonths(count = 24, now = new Date()): Array<{ year: number; month: number }> {
  const first = previousFinishedMonth(now);
  const months: Array<{ year: number; month: number }> = [];
  let year = first.year;
  let month = first.month;
  for (let i = 0; i < count; i += 1) {
    months.push({ year, month });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return months;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
