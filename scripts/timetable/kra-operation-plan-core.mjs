function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(value) {
  return decodeHtmlEntities(String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCells(rowHtml) {
  return [...String(rowHtml).matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
    .map((match) => stripHtml(match[1]));
}

function rowsFromHtml(html) {
  return [...String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => parseCells(match[1]))
    .filter((cells) => cells.length);
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseMonthDay(value) {
  const match = String(value ?? '').match(/(\d{1,2})\s*\.\s*(\d{1,2})/);
  return match ? { month: Number(match[1]), day: Number(match[2]) } : null;
}

function parseRange(value, year) {
  const tokens = [...String(value ?? '').matchAll(/(\d{1,2})\s*\.\s*(\d{1,2})/g)]
    .map((match) => ({ month: Number(match[1]), day: Number(match[2]) }));
  if (tokens.length < 2) return null;
  return {
    start: isoDate(year, tokens[0].month, tokens[0].day),
    end_inclusive: isoDate(year, tokens[1].month, tokens[1].day),
  };
}

function parseIntCell(value) {
  const match = String(value ?? '').match(/(\d[\d,]*)\s*일?/);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

function requireRow(rows, label) {
  const row = rows.find((cells) => cells[0]?.includes(label));
  if (!row) throw new Error(`KRA operation-plan row missing: ${label}`);
  return row;
}

export function parseKraOperationPlan(html) {
  const text = stripHtml(html);
  const periodMatch = text.match(/경마시행\s*기간\s*:\s*(20\d{2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2}).*?(\d{1,2})\s*\.\s*(\d{1,2})/);
  if (!periodMatch) throw new Error('KRA operation-plan year/period fingerprint changed');
  const year = Number(periodMatch[1]);
  const rows = rowsFromHtml(html);
  const periodRow = requireRow(rows, '개최기간');
  const dayRow = requireRow(rows, '경마일수');
  if (periodRow.length < 6 || dayRow.length < 6) throw new Error('KRA operation-plan track table shape changed');

  const periods = {
    seoul: parseRange(periodRow[1], year),
    busan: parseRange(periodRow[2], year),
    yeongcheon: parseRange(periodRow[3], year),
    jeju: parseRange(periodRow.at(-1), year),
  };
  if (Object.values(periods).some((value) => !value)) throw new Error('KRA operation-plan track period parsing failed');

  const expected_days = {
    seoul: parseIntCell(dayRow[1]),
    busan: parseIntCell(dayRow[2]),
    yeongcheon: parseIntCell(dayRow[3]),
    jeju: parseIntCell(dayRow.at(-1)),
  };
  if (Object.values(expected_days).some((value) => !Number.isInteger(value) || value < 1)) {
    throw new Error('KRA operation-plan day-count parsing failed');
  }

  const closures = [];
  for (const cells of rows) {
    if (!cells.some((cell) => cell.includes('휴장'))) continue;
    const range = parseRange(cells[0], year);
    if (range) closures.push([range.start, range.end_inclusive]);
  }
  if (!closures.length) throw new Error('KRA operation-plan closure parsing failed');

  const holidaySection = text.split('월요일 공휴경마 운영').slice(1).join('월요일 공휴경마 운영');
  const holiday_mondays = [...new Set([...holidaySection.matchAll(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\(월\)/g)]
    .map((match) => isoDate(year, Number(match[1]), Number(match[2]))))]
    .sort();
  if (!holiday_mondays.length) throw new Error('KRA operation-plan holiday-Monday parsing failed');

  return {
    year,
    season_start: isoDate(year, Number(periodMatch[2]), Number(periodMatch[3])),
    season_end_inclusive: isoDate(year, Number(periodMatch[4]), Number(periodMatch[5])),
    periods,
    closures,
    holiday_mondays,
    expected_days,
  };
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function eachDate(start, endInclusive) {
  const rows = [];
  for (let cursor = start; cursor <= endInclusive; cursor = plusDays(cursor, 1)) rows.push(cursor);
  return rows;
}

function inPeriod(date, period) {
  return date >= period.start && date <= period.end_inclusive;
}

function inClosure(date, plan) {
  return plan.closures.some(([start, end]) => date >= start && date <= end);
}

export function assessKraWindowCoverage(planYear, startDate, days) {
  if (!Number.isInteger(planYear) || planYear < 2000) throw new Error('KRA plan year is invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('KRA window start date is invalid');
  if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('KRA window days are invalid');

  const endDateExclusive = plusDays(startDate, days);
  const lastDate = plusDays(endDateExclusive, -1);
  const requestedPlanYears = [...new Set(eachDate(startDate, lastDate).map((date) => Number(date.slice(0, 4))))].sort((a, b) => a - b);
  const startYear = Number(startDate.slice(0, 4));
  const startYearAvailable = startYear === planYear;
  const coveredPlanYears = requestedPlanYears.filter((year) => year === planYear);
  const unresolvedPlanYears = requestedPlanYears.filter((year) => year !== planYear);

  return {
    status: !startYearAvailable ? 'unavailable' : (unresolvedPlanYears.length ? 'partial' : 'complete'),
    start_year_available: startYearAvailable,
    requested_plan_years: requestedPlanYears,
    covered_plan_years: coveredPlanYears,
    unresolved_plan_years: unresolvedPlanYears,
    unresolved_reason: unresolvedPlanYears.length ? 'official_annual_plan_not_available' : null,
    end_date_exclusive: endDateExclusive,
  };
}

export function generateKraPlanMeetings(plan, trackConfig) {
  const rows = [];
  const add = (date, key) => {
    if (!inPeriod(date, plan.periods[key])) return;
    rows.push({
      meeting_id: `kra-${trackConfig[key].racecourse_id}-${date}`,
      country_id: 'south-korea',
      authority_id: 'korea-racing-authority',
      racing_system_id: 'kra-national-racing-system',
      racecourse_id: trackConfig[key].racecourse_id,
      date,
      timezone: 'Asia/Seoul',
      capability_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: { source_id: 'kra-annual-race-operation-plan', official_url: 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1' },
      detail_observation: { status: 'not_published', race_count: 0, conflicts: [] },
    });
  };

  for (const date of eachDate(plan.season_start, plan.season_end_inclusive)) {
    if (inClosure(date, plan)) continue;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 5) { add(date, 'busan'); add(date, 'jeju'); }
    if (weekday === 6) { add(date, 'seoul'); add(date, 'jeju'); }
    if (weekday === 0) {
      add(date, 'seoul');
      if (inPeriod(date, plan.periods.yeongcheon)) add(date, 'yeongcheon');
      else add(date, 'busan');
    }
    if (plan.holiday_mondays.includes(date)) { add(date, 'seoul'); add(date, 'jeju'); }
  }
  return rows;
}

export function validateKraGeneratedPlan(rows, plan, trackConfig) {
  const byRacecourse = new Map(Object.entries(trackConfig).map(([key, value]) => [value.racecourse_id, key]));
  const counts = { seoul: 0, busan: 0, yeongcheon: 0, jeju: 0 };
  for (const row of rows) {
    const key = byRacecourse.get(row.racecourse_id);
    if (!key) throw new Error(`KRA generated unknown racecourse: ${row.racecourse_id}`);
    counts[key] += 1;
  }
  for (const [key, expected] of Object.entries(plan.expected_days)) {
    if (counts[key] !== expected) {
      throw new Error(`KRA official-plan generated ${key} day count ${counts[key]} != ${expected}; weekly pattern may have changed`);
    }
  }
  return counts;
}

export function currentSeoulWeekBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const localDate = `${values.year}-${values.month}-${values.day}`;
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday);
  const monday = new Date(`${localDate}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() + (dayIndex === 0 ? -6 : 1 - dayIndex));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { monday: monday.toISOString().slice(0, 10), sunday: sunday.toISOString().slice(0, 10) };
}

export function parseKraRegistrationDates(html) {
  const text = stripHtml(html);
  if (!text.includes('출전등록현황') || !text.includes('경주일자')) {
    throw new Error('KRA registration page fingerprint changed');
  }
  const dates = [...new Set([...text.matchAll(/(20\d{2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/g)]
    .map((match) => isoDate(Number(match[1]), Number(match[2]), Number(match[3]))))]
    .sort();
  if (!dates.length) throw new Error('KRA registration page exposed no meeting dates');
  return dates;
}
