const SOURCE_ID = 'hokkaido-keiba-official-calendar';
const SOURCE_LABEL = 'ホッカイドウ競馬';
const SOURCE_HOST = 'www.hokkaidokeiba.net';

function daysInMonth(year, month) {
  return new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
}

function plain(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function monthKey(date) {
  return String(date).slice(0, 7);
}

export function hokkaidoOfficialMonthUrl(yearMonth) {
  const [year, month] = String(yearMonth).slice(0, 7).split('-');
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) throw new Error(`invalid Hokkaido year-month: ${yearMonth}`);
  return `https://${SOURCE_HOST}/kaisai/nittei.php?p_ym=${year}${month}`;
}

function meetingRow(date, sourceUrl, marker) {
  return {
    meeting_id: `nar-monbetsu-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: 'monbetsu-racecourse',
    venue_code: '04',
    source_id: SOURCE_ID,
    source_label: SOURCE_LABEL,
    official_source_url: sourceUrl,
    official_meeting_marker: marker,
  };
}

export function parseHokkaidoOfficialMonth(html, year, month, sourceUrl) {
  const expectedDays = daysInMonth(year, month);
  const table = String(html).match(/<table\b[^>]*class=["'][^"']*\bcalender_table\b[^"']*["'][^>]*>[\s\S]*?<\/table>/i)?.[0];
  if (!table) return { meetings: [], structural_valid: false, reason: 'missing_calendar_table', day_count: 0 };

  const dayValues = [];
  const meetings = [];
  let hokkaidoRows = 0;
  let invalidCells = 0;
  for (const rowMatch of table.matchAll(/<tr\b[^>]*class=["'][^"']*\bhokkaidokeiba\b[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi)) {
    hokkaidoRows += 1;
    for (const cellMatch of rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)) {
      const cell = cellMatch[1];
      const dayBlock = cell.match(/<div\b[^>]*class=["'][^"']*\bday\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
      if (dayBlock == null) continue;
      const day = Number(plain(dayBlock));
      if (!Number.isInteger(day) || day < 1 || day > expectedDays) {
        invalidCells += 1;
        continue;
      }
      dayValues.push(day);
      const marker = plain(cell).match(/門別\s*(\d+)\s*回\s*(\d+)\s*日/);
      if (!marker) continue;
      if (!/alt=["']ホッカイドウ競馬["']/i.test(cell)) {
        invalidCells += 1;
        continue;
      }
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      meetings.push(meetingRow(date, sourceUrl, `門別${marker[1]}回${marker[2]}日`));
    }
  }

  const uniqueDays = [...new Set(dayValues)].sort((a, b) => a - b);
  const expected = Array.from({ length: expectedDays }, (_, index) => index + 1);
  const structuralValid = hokkaidoRows >= 4
    && invalidCells === 0
    && dayValues.length === expectedDays
    && uniqueDays.length === expectedDays
    && expected.every((day, index) => uniqueDays[index] === day);
  return {
    meetings: [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
      .sort((a, b) => a.date.localeCompare(b.date)),
    structural_valid: structuralValid,
    reason: structuralValid ? null : 'calendar_day_coverage_invalid',
    day_count: dayValues.length,
    unique_day_count: uniqueDays.length,
    hokkaido_row_count: hokkaidoRows,
    invalid_cell_count: invalidCells,
  };
}

async function fetchMonth(yearMonth, fetchImpl) {
  const url = hokkaidoOfficialMonthUrl(yearMonth);
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== SOURCE_HOST) {
    throw new Error(`unexpected Hokkaido official redirect: ${finalUrl.toString()}`);
  }
  const bytes = await response.arrayBuffer();
  const html = new TextDecoder('shift_jis').decode(bytes);
  if (!/開催カレンダー/.test(html) || !/ホッカイドウ競馬/.test(html)) throw new Error(`unexpected Hokkaido calendar document: ${url}`);
  return { html, url: finalUrl.toString() };
}

export async function discoverHokkaidoOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Hokkaido official discovery requires dates');
  const requested = [...new Set(dates)].sort();
  const allowed = new Set(requested);
  const meetings = [];
  const failures = [];
  const sourceUrls = [];
  let successfulMonths = 0;

  for (const ym of [...new Set(requested.map(monthKey))]) {
    const [year, month] = ym.split('-');
    const requestedForMonth = requested.filter((date) => date.startsWith(`${ym}-`));
    const fallbackUrl = hokkaidoOfficialMonthUrl(ym);
    try {
      const fetched = await fetchMonth(ym, fetchImpl);
      sourceUrls.push(fetched.url);
      const parsed = parseHokkaidoOfficialMonth(fetched.html, year, month, fetched.url);
      if (!parsed.structural_valid) throw new Error(`Hokkaido calendar structural validation failed: ${ym}:${parsed.reason}`);
      successfulMonths += 1;
      meetings.push(...parsed.meetings.filter((row) => allowed.has(row.date)));
    } catch (error) {
      failures.push({
        source_url: fallbackUrl,
        requested_dates: requestedForMonth,
        reason: String(error?.message ?? error),
      });
    }
  }

  const deduped = [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
  const monthCount = new Set(requested.map(monthKey)).size;
  const completeness = failures.length === 0 ? 'complete' : successfulMonths > 0 ? 'partial' : 'failed';
  return {
    meetings: deduped,
    completeness: {
      source_id: SOURCE_ID,
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: deduped.length,
      parsed_detail_count: 0,
      pending_count: failures.reduce((sum, row) => sum + row.requested_dates.length, 0),
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : null,
      source_urls: [...new Set(sourceUrls.length ? sourceUrls : [...new Set(requested.map((date) => hokkaidoOfficialMonthUrl(monthKey(date))))])],
      requested_month_count: monthCount,
      successful_month_count: successfulMonths,
      failures,
    },
  };
}
