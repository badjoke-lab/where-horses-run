function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function compactText(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function attributeValue(attrs, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  return decodeEntities(attrs.match(pattern)?.[1] ?? '');
}

function positiveSpan(attrs, name) {
  const value = Number(attributeValue(attrs, name) || 1);
  return Number.isInteger(value) && value > 0 && value <= 64 ? value : 1;
}

function extractUrls(body) {
  const urls = [];
  for (const match of body.matchAll(/href=["']([^"']+)["']/gi)) {
    const literal = decodeEntities(match[1]);
    try {
      urls.push(new URL(literal, 'https://www.keiba.go.jp/').toString());
    } catch {
      // Ignore malformed links; the caller validates canonical schedule records.
    }
  }
  return urls;
}

function cellSignal(attrs, body) {
  const altValues = [...body.matchAll(/\balt=["']([^"']*)["']/gi)].map((match) => decodeEntities(match[1]));
  const titleValues = [...body.matchAll(/\btitle=["']([^"']*)["']/gi)].map((match) => decodeEntities(match[1]));
  const attrAlt = attributeValue(attrs, 'alt');
  const attrTitle = attributeValue(attrs, 'title');
  return [compactText(body), ...altValues, ...titleValues, attrAlt, attrTitle].filter(Boolean).join(' ').trim();
}

function parseCells(rowHtml) {
  const cells = [];
  for (const match of rowHtml.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const attrs = match[2] ?? '';
    const body = match[3] ?? '';
    const cell = {
      text: compactText(body),
      signal: cellSignal(attrs, body),
      raw: body,
      urls: extractUrls(body),
      colspan: positiveSpan(attrs, 'colspan'),
    };
    for (let index = 0; index < cell.colspan; index += 1) cells.push(cell);
  }
  return cells;
}

function parseRows(html) {
  const rows = [];
  for (const tableMatch of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const table = tableMatch[1] ?? '';
    for (const rowMatch of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = parseCells(rowMatch[1] ?? '');
      if (cells.length) rows.push(cells);
    }
  }
  return rows;
}

function daysInMonth(month) {
  const [year, mm] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mm, 0)).getUTCDate();
}

function findDayHeader(rows, monthLength) {
  for (const row of rows) {
    for (let start = 0; start <= row.length - monthLength; start += 1) {
      let valid = true;
      for (let offset = 0; offset < monthLength; offset += 1) {
        if (row[start + offset]?.text !== String(offset + 1)) {
          valid = false;
          break;
        }
      }
      if (valid) return { row, start };
    }
  }
  return null;
}

function raceListDate(url) {
  try {
    const parsed = new URL(url);
    if (!/\/TodayRaceInfo\/RaceList$/i.test(parsed.pathname)) return null;
    const raw = parsed.searchParams.get('k_raceDate');
    return raw?.replaceAll('/', '-') ?? null;
  } catch {
    return null;
  }
}

function raceListUrlForCell(cell, venueCode, expectedDate) {
  for (const url of cell?.urls ?? []) {
    try {
      const parsed = new URL(url);
      if (!/\/TodayRaceInfo\/RaceList$/i.test(parsed.pathname)) continue;
      const code = parsed.searchParams.get('k_babaCode')?.padStart(2, '0');
      const date = raceListDate(url);
      if (code === venueCode && date === expectedDate) return parsed.toString();
    } catch {
      // Continue through other URLs in the cell.
    }
  }
  return null;
}

function rowOffsetFromLinkedDates(row, headerStart, month, venueCode) {
  const offsets = [];
  for (let index = 0; index < row.length; index += 1) {
    for (const url of row[index]?.urls ?? []) {
      try {
        const parsed = new URL(url);
        if (!/\/TodayRaceInfo\/RaceList$/i.test(parsed.pathname)) continue;
        const code = parsed.searchParams.get('k_babaCode')?.padStart(2, '0');
        const date = raceListDate(url);
        if (code !== venueCode || !date?.startsWith(month)) continue;
        const day = Number(date.slice(-2));
        if (!Number.isInteger(day) || day < 1 || day > 31) continue;
        offsets.push(index - (headerStart + day - 1));
      } catch {
        // Ignore malformed URLs.
      }
    }
  }
  if (!offsets.length) return 0;
  const counts = new Map();
  for (const value of offsets) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || Math.abs(a[0]) - Math.abs(b[0]))[0][0];
}

function isMeetingCell(cell) {
  const signal = String(cell?.signal ?? '');
  if (/[●☆Ｄ△○★]/u.test(signal)) return true;
  return (cell?.urls ?? []).some((url) => /\/TodayRaceInfo\/RaceList(?:\?|$)/i.test(url));
}

function venueRow(rows, labels) {
  return rows.find((row) => row.some((cell) => labels.includes(cell.text))) ?? null;
}

function canonicalRaceListUrl(venueCode, date) {
  const url = new URL('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList');
  url.searchParams.set('k_babaCode', venueCode);
  url.searchParams.set('k_raceDate', date.replaceAll('-', '/'));
  return url.toString();
}

export function parseNarMonthlyScheduleGrid({ html, month, venues }) {
  if (!/^\d{4}-\d{2}$/.test(month ?? '')) throw new Error('month must use YYYY-MM.');
  if (!Array.isArray(venues) || venues.length === 0) throw new Error('venues must be a non-empty array.');

  const rows = parseRows(html);
  const monthLength = daysInMonth(month);
  const header = findDayHeader(rows, monthLength);
  if (!header) throw new Error(`Could not locate a complete 1-${monthLength} day header in the monthly schedule table.`);

  const records = [];
  for (const venue of venues) {
    const labels = [...new Set([venue.name_ja, ...(venue.schedule_aliases ?? [])].filter(Boolean))];
    const row = venueRow(rows, labels);
    if (!row) throw new Error(`Could not locate schedule row for ${venue.racecourse_id ?? venue.name_ja}.`);
    const offset = rowOffsetFromLinkedDates(row, header.start, month, venue.venue_code);
    const meetings = [];
    for (let day = 1; day <= monthLength; day += 1) {
      const index = header.start + day - 1 + offset;
      const cell = row[index];
      if (!cell || !isMeetingCell(cell)) continue;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const linkedRaceListUrl = raceListUrlForCell(cell, venue.venue_code, date);
      meetings.push({
        date,
        schedule_marker: cell.signal || null,
        race_list_url: linkedRaceListUrl ?? canonicalRaceListUrl(venue.venue_code, date),
        race_list_linked_from_schedule: Boolean(linkedRaceListUrl),
      });
    }
    records.push({
      venue_code: venue.venue_code,
      racecourse_id: venue.racecourse_id,
      name_en: venue.name_en,
      name_ja: venue.name_ja,
      meeting_dates: meetings.map((meeting) => meeting.date),
      meetings,
    });
  }

  return {
    month,
    month_length: monthLength,
    racecourses_checked: records.length,
    meetings_scheduled: records.reduce((sum, record) => sum + record.meetings.length, 0),
    records,
  };
}
