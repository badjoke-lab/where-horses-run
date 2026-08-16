const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const SOURCE_REVIEW_DUE_AFTER_DAYS = 30;

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

export function evaluateSourceFreshness({
  checkedDate,
  referenceDate,
  reviewDueAfterDays = SOURCE_REVIEW_DUE_AFTER_DAYS,
} = {}) {
  if (checkedDate === null || checkedDate === undefined || checkedDate === '') {
    return {
      status: 'unknown',
      ageDays: null,
      reviewDueAfterDays,
    };
  }

  if (!Number.isInteger(reviewDueAfterDays) || reviewDueAfterDays < 1 || reviewDueAfterDays > 365) {
    throw new Error('reviewDueAfterDays must be an integer from 1 through 365.');
  }

  const checked = parseDate(checkedDate, 'checkedDate');
  const reference = parseDate(referenceDate, 'referenceDate');
  const rawAgeDays = Math.floor((reference.getTime() - checked.getTime()) / DAY_MS);
  const ageDays = Math.max(0, rawAgeDays);

  return {
    status: rawAgeDays > reviewDueAfterDays ? 'review_due' : 'current',
    ageDays,
    reviewDueAfterDays,
  };
}
