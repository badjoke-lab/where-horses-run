const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_WINDOW_DAYS = 30;

function assertDateText(value, label) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a real calendar date.`);
  }
  return value;
}

function assertTimeZone(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Calendar timezone must be a non-empty IANA timezone.');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date(0));
  } catch {
    throw new Error(`Unsupported Calendar timezone: ${value}`);
  }
  return value;
}

function dateInTimeZone(instant, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addCalendarDays(dateText, days) {
  assertDateText(dateText, 'dateText');
  if (!Number.isInteger(days)) throw new Error('days must be an integer.');
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function resolveCalendarReference({
  referenceDate = process.env.WHR_CALENDAR_REFERENCE_DATE,
  sourceDateEpoch = process.env.SOURCE_DATE_EPOCH,
  timeZone = process.env.WHR_CALENDAR_TIMEZONE ?? DEFAULT_TIMEZONE,
  now = new Date()
} = {}) {
  const resolvedTimeZone = assertTimeZone(timeZone);

  if (referenceDate) {
    return {
      date: assertDateText(referenceDate, 'WHR_CALENDAR_REFERENCE_DATE'),
      timeZone: resolvedTimeZone,
      source: 'reference_date_override'
    };
  }

  if (sourceDateEpoch) {
    if (!/^\d+$/.test(sourceDateEpoch)) {
      throw new Error('SOURCE_DATE_EPOCH must contain whole epoch seconds.');
    }
    const instant = new Date(Number(sourceDateEpoch) * 1000);
    if (Number.isNaN(instant.getTime())) throw new Error('SOURCE_DATE_EPOCH is outside the supported date range.');
    return {
      date: dateInTimeZone(instant, resolvedTimeZone),
      timeZone: resolvedTimeZone,
      source: 'source_date_epoch'
    };
  }

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('now must be a valid Date.');
  }
  return {
    date: dateInTimeZone(now, resolvedTimeZone),
    timeZone: resolvedTimeZone,
    source: 'build_clock'
  };
}

export function createCalendarDateContext(options = {}) {
  const reference = resolveCalendarReference(options);
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 366) {
    throw new Error('Calendar windowDays must be an integer from 1 through 366.');
  }
  const today = reference.date;
  const tomorrow = addCalendarDays(today, 1);
  const windowEndExclusive = addCalendarDays(today, windowDays);
  return {
    today,
    tomorrow,
    timeZone: reference.timeZone,
    referenceSource: reference.source,
    windowDays,
    windowStart: today,
    windowEndInclusive: addCalendarDays(windowEndExclusive, -1),
    windowEndExclusive
  };
}

export function filterRecordsForDate(records, date) {
  assertDateText(date, 'date');
  return records.filter((record) => record.date === date);
}

export function filterRecordsForWindow(records, startDate, endDateExclusive) {
  assertDateText(startDate, 'startDate');
  assertDateText(endDateExclusive, 'endDateExclusive');
  if (startDate >= endDateExclusive) throw new Error('Calendar window start must be before end.');
  return records.filter((record) => record.date >= startDate && record.date < endDateExclusive);
}

export function evaluateCalendarDataState({ records, generatedAt, context }) {
  if (!Array.isArray(records)) throw new Error('records must be an array.');
  if (!context?.today || !context?.windowEndExclusive) throw new Error('context is incomplete.');
  const generatedTimestamp = Date.parse(generatedAt);
  if (Number.isNaN(generatedTimestamp)) throw new Error('generatedAt must be a valid ISO date-time.');

  const dates = records.map((record) => assertDateText(record.date, `record ${record.meeting_id ?? 'unknown'} date`)).sort();
  const earliestRecordDate = dates[0] ?? null;
  const latestRecordDate = dates.at(-1) ?? null;
  const generatedDate = new Date(generatedTimestamp).toISOString().slice(0, 10);
  const windowRecords = filterRecordsForWindow(records, context.windowStart, context.windowEndExclusive);

  let status = 'current_window_available';
  if (records.length === 0) status = 'no_public_records';
  else if (windowRecords.length === 0 && latestRecordDate < context.windowStart) status = 'records_before_window';
  else if (windowRecords.length === 0 && earliestRecordDate >= context.windowEndExclusive) status = 'records_after_window';
  else if (generatedDate < context.windowStart) status = 'stale_generation_with_window_records';

  return {
    status,
    generatedAt,
    generatedDate,
    earliestRecordDate,
    latestRecordDate,
    totalRecordCount: records.length,
    windowRecordCount: windowRecords.length
  };
}

export const calendarDateDefaults = {
  timeZone: DEFAULT_TIMEZONE,
  windowDays: DEFAULT_WINDOW_DAYS
};
