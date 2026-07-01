const MIN_AGE = 13;
const MAX_AGE = 100;

export function parseDateOfBirthParts(
  day: number,
  month: number,
  year: number
): { ok: true; date: string } | { ok: false; message: string } {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { ok: false, message: "Enter a valid day, month, and year." };
  }

  if (month < 1 || month > 12) {
    return { ok: false, message: "Month must be between 1 and 12." };
  }

  if (day < 1 || day > 31) {
    return { ok: false, message: "Day must be between 1 and 31." };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  if (year < currentYear - MAX_AGE || year > currentYear) {
    return { ok: false, message: `Enter a birth year between ${currentYear - MAX_AGE} and ${currentYear}.` };
  }

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return { ok: false, message: "That date is not valid (check day and month)." };
  }

  if (candidate.getTime() > now.getTime()) {
    return { ok: false, message: "Date of birth cannot be in the future." };
  }

  const age = ageFromDateOfBirth(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    now
  );
  if (age < MIN_AGE) {
    return { ok: false, message: `You must be at least ${MIN_AGE} years old to use Core Padel.` };
  }

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { ok: true, date: iso };
}

/** ISO date string `YYYY-MM-DD` → age in full years. */
export function ageFromDateOfBirth(isoDate: string, asOf = new Date()): number {
  const [y, m, d] = isoDate.split("-").map((part) => Number.parseInt(part, 10));
  if (!y || !m || !d) return 0;

  const refY = asOf.getFullYear();
  const refM = asOf.getMonth() + 1;
  const refD = asOf.getDate();

  let age = refY - y;
  if (refM < m || (refM === m && refD < d)) {
    age -= 1;
  }
  return age;
}

export function formatDateOfBirth(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((part) => Number.parseInt(part, 10));
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDate;
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
