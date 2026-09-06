export function isTimeZoneSupported(timeZone) {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function dateParts(instant, timeZone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));
}

export function formatDateInTimeZone(instant, timeZone) {
  if (!isTimeZoneSupported(timeZone)) return null;
  const parts = dateParts(instant, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function localDateTimeToInstant(dateText, timeText, timeZone) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText || '');
  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeText || '');
  if (!dateMatch || !timeMatch || !isTimeZoneSupported(timeZone)) return null;

  const targetUtc = Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    Number(timeMatch[3] ?? '0'),
  );

  let guess = targetUtc;
  for (let pass = 0; pass < 4; pass += 1) {
    const parts = dateParts(new Date(guess), timeZone);
    const representedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const correction = targetUtc - representedUtc;
    guess += correction;
    if (correction === 0) break;
  }

  return new Date(guess);
}

export function deriveMeetingLifecycleState({
  displayedDate,
  displayTimeZone,
  sourceDate,
  sourceTimeZone,
  firstTime = '',
  lastTime = '',
  nowMs = Date.now(),
}) {
  const currentDisplayDate = formatDateInTimeZone(new Date(nowMs), displayTimeZone);
  if (!displayedDate || !currentDisplayDate || !sourceDate || !isTimeZoneSupported(sourceTimeZone)) {
    return {
      calendarDayState: 'unknown',
      state: 'unknown',
      policy: 'invalid',
      sortStartMs: null,
    };
  }

  const calendarDayState = displayedDate < currentDisplayDate
    ? 'past'
    : displayedDate > currentDisplayDate
      ? 'future'
      : 'today';

  const start = firstTime ? localDateTimeToInstant(sourceDate, firstTime, sourceTimeZone) : null;
  const rawEnd = lastTime ? localDateTimeToInstant(sourceDate, lastTime, sourceTimeZone) : null;
  let end = rawEnd;
  if (start && end && end.getTime() < start.getTime()) {
    end = new Date(end.getTime() + 86_400_000);
  }

  const policy = start && end
    ? 'first-last'
    : start
      ? 'first-only'
      : end
        ? 'last-only'
        : 'untimed';

  // Calendar-day relation is authoritative. Timing only refines meetings that are
  // actually on the current day in the selected display timezone.
  if (calendarDayState === 'past') {
    return { calendarDayState, state: 'ended', policy, sortStartMs: start?.getTime() ?? null };
  }
  if (calendarDayState === 'future') {
    return { calendarDayState, state: 'future', policy, sortStartMs: start?.getTime() ?? null };
  }

  let state = 'unknown';
  if (start && end) {
    state = nowMs < start.getTime() ? 'upcoming' : nowMs <= end.getTime() ? 'running' : 'ended';
  } else if (start) {
    state = nowMs < start.getTime() ? 'upcoming' : 'unknown';
  } else if (end) {
    state = nowMs > end.getTime() ? 'ended' : 'unknown';
  }

  return {
    calendarDayState,
    state,
    policy,
    sortStartMs: start?.getTime() ?? null,
  };
}
