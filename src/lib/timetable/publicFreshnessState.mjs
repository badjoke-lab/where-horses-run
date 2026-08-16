const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_STALE_AFTER_DAYS = 1;

function parseDate(value, field) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} must be a real calendar date.`);
  }
  return parsed;
}

export function evaluatePublicFreshness({
  lastCheckedDate,
  referenceDate,
  staleAfterDays = DEFAULT_STALE_AFTER_DAYS,
} = {}) {
  if (lastCheckedDate === null || lastCheckedDate === undefined || lastCheckedDate === '') {
    return {
      status: 'unknown',
      ageDays: null,
      staleAfterDays,
    };
  }

  if (!Number.isInteger(staleAfterDays) || staleAfterDays < 0 || staleAfterDays > 365) {
    throw new Error('staleAfterDays must be an integer from 0 through 365.');
  }

  const checked = parseDate(lastCheckedDate, 'lastCheckedDate');
  const reference = parseDate(referenceDate, 'referenceDate');
  const rawAgeDays = Math.floor((reference.getTime() - checked.getTime()) / DAY_MS);
  const ageDays = Math.max(0, rawAgeDays);

  return {
    status: rawAgeDays > staleAfterDays ? 'stale' : 'current',
    ageDays,
    staleAfterDays,
  };
}
