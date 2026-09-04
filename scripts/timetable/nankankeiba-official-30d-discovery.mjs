const SOUTH_KANTO_VENUES = {
  '浦和': { slug: 'urawa', code: '18' },
  '船橋': { slug: 'funabashi', code: '19' },
  '大井': { slug: 'oi', code: '20' },
  '川崎': { slug: 'kawasaki', code: '21' },
};
const VENUE_BY_CODE = Object.fromEntries(Object.entries(SOUTH_KANTO_VENUES).map(([name, value]) => [value.code, { name, ...value }]));

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');
const plain = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function quarterStartMonth(month) {
  return Math.floor((Number(month) - 1) / 3) * 3 + 1;
}

export function nankankeibaQuarterUrl(date) {
  const [year, month] = String(date).split('-').map(Number);
  const quarter = String(quarterStartMonth(month)).padStart(2, '0');
  return `https://www.nankankeiba.com/calendar/${year}${quarter}.do`;
}

function cells(rowHtml) {
  return [...String(rowHtml).matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((match) => match[1]);
}

function monthSection(html, month) {
  const source = String(html);
  const marker = new RegExp(`(?:>|\\s)${Number(month)}月(?:<|\\s)`, 'g');
  const match = marker.exec(source);
  if (!match) return null;
  const start = match.index;
  let end = source.length;
  for (let nextMonth = Number(month) + 1; nextMonth <= 12; nextMonth += 1) {
    const next = new RegExp(`(?:>|\\s)${nextMonth}月(?:<|\\s)`).exec(source.slice(start + match[0].length));
    if (next) {
      end = start + match[0].length + next.index;
      break;
    }
  }
  return source.slice(start, end);
}

function meetingCell(cellHtml) {
  const text = plain(cellHtml);
  return /bangumi\//i.test(cellHtml)
    || /(?:alt|title)\s*=\s*["'][^"']*(?:昼|薄暮|ナイター)開催/i.test(cellHtml)
    || /(?:昼|薄暮|ナイター)開催/.test(text)
    || /(?:^|\s)(?:JpnI{1,3}|SI{1,3})(?:\s|$)/i.test(text);
}

function programmeLinks(section, baseUrl) {
  const values = [];
  for (const match of String(section).matchAll(/href\s*=\s*["']([^"']*\/bangumi\/(\d{8})\.do[^"']*)["']/gi)) {
    const href = new URL(entities(match[1]), baseUrl).toString();
    const venue = VENUE_BY_CODE[match[2].slice(4, 6)];
    if (!venue) continue;
    values.push({ url: href, venue, programme_key: match[2] });
  }
  return [...new Map(values.map((row) => [row.url, row])).values()];
}

function meetingRow(venue, date, officialSourceUrl) {
  return {
    meeting_id: `nar-${venue.slug}-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: `${venue.slug}-racecourse`,
    venue_code: venue.code,
    source_id: 'nankankeiba-south-kanto-calendar',
    source_label: '南関東4競馬場',
    official_source_url: officialSourceUrl,
  };
}

export function parseNankankeibaCalendarMonth(html, { year, month, allowedDates, sourceUrl }) {
  const section = monthSection(html, month);
  if (!section) return { structural_valid: false, meetings: [], programme_links: [] };
  const allowed = new Set(allowedDates);
  const meetings = [];
  const seenVenueRows = new Set();
  for (const rowMatch of section.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const rowCells = cells(rowMatch[0]);
    if (rowCells.length < 2) continue;
    const venueEntry = Object.entries(SOUTH_KANTO_VENUES).find(([name]) => plain(rowCells[0]) === name);
    if (!venueEntry) continue;
    const [, venue] = venueEntry;
    seenVenueRows.add(venue.code);
    for (let day = 1; day < rowCells.length; day += 1) {
      if (!meetingCell(rowCells[day])) continue;
      const date = isoDate(year, month, day);
      if (!date || !allowed.has(date)) continue;
      meetings.push(meetingRow(venue, date, sourceUrl));
    }
  }
  return {
    structural_valid: seenVenueRows.size === 4,
    meetings: [...new Map(meetings.map((row) => [row.meeting_id, row])).values()],
    programme_links: programmeLinks(section, sourceUrl),
  };
}

export function parseNankankeibaProgrammeDates(html, year) {
  const text = plain(html);
  const start = text.search(/1日目/);
  if (start < 0) return [];
  const header = text.slice(start, start + 900);
  const dates = [];
  for (const match of header.matchAll(/(\d{1,2})月\s*(\d{1,2})日/g)) {
    const date = isoDate(year, Number(match[1]), Number(match[2]));
    if (date) dates.push(date);
  }
  return [...new Set(dates)];
}

async function fetchHtml(url, fetchImpl) {
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
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.nankankeiba.com') {
    throw new Error(`unexpected nankankeiba redirect: ${finalUrl.toString()}`);
  }
  return { body: await response.text(), url: finalUrl.toString() };
}

export async function discoverNankankeibaOfficial30d({ dates, fetchImpl = fetch }) {
  const allowed = new Set(dates);
  const sourceUrls = [...new Set(dates.map(nankankeibaQuarterUrl))];
  const meetings = [];
  const failures = [];
  const pageResults = [];

  for (const sourceUrl of sourceUrls) {
    try {
      const page = await fetchHtml(sourceUrl, fetchImpl);
      const months = [...new Set(dates.filter((date) => nankankeibaQuarterUrl(date) === sourceUrl).map((date) => Number(date.slice(5, 7))))];
      let structurallyValid = true;
      const links = [];
      for (const month of months) {
        const allowedDates = dates.filter((date) => Number(date.slice(5, 7)) === month);
        const parsed = parseNankankeibaCalendarMonth(page.body, {
          year: Number(dates.find((date) => Number(date.slice(5, 7)) === month).slice(0, 4)),
          month,
          allowedDates,
          sourceUrl: page.url,
        });
        structurallyValid = structurallyValid && parsed.structural_valid;
        meetings.push(...parsed.meetings);
        links.push(...parsed.programme_links);
      }
      if (!structurallyValid) failures.push({ source_url: page.url, reason: 'calendar_structure_incomplete' });

      for (const link of [...new Map(links.map((row) => [row.url, row])).values()]) {
        try {
          const programme = await fetchHtml(link.url, fetchImpl);
          const year = Number(link.programme_key.slice(0, 4));
          const programmeDates = parseNankankeibaProgrammeDates(programme.body, year).filter((date) => allowed.has(date));
          if (!programmeDates.length) {
            failures.push({ source_url: programme.url, reason: 'programme_dates_incomplete' });
            continue;
          }
          for (const date of programmeDates) meetings.push(meetingRow(link.venue, date, programme.url));
        } catch (error) {
          failures.push({ source_url: link.url, reason: String(error?.message ?? error) });
        }
      }
      pageResults.push({ source_url: page.url, result: structurallyValid ? 'complete' : 'partial' });
    } catch (error) {
      failures.push({ source_url: sourceUrl, reason: String(error?.message ?? error) });
      pageResults.push({ source_url: sourceUrl, result: 'failed' });
    }
  }

  const deduped = [...new Map(meetings.map((row) => [row.meeting_id, row])).values()].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  const successfulPages = pageResults.filter((row) => row.result === 'complete').length;
  const completeness = failures.length === 0 && successfulPages === sourceUrls.length
    ? 'complete'
    : successfulPages === 0 ? 'failed' : 'partial';
  return {
    meetings: deduped,
    completeness: {
      source_id: 'nankankeiba-south-kanto-calendar',
      role: 'mother_set',
      requested_window: { start: dates[0], end: dates.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: deduped.length,
      parsed_detail_count: 0,
      pending_count: 0,
      failure_count: failures.length,
      source_visible_horizon: dates.at(-1),
      source_urls: sourceUrls,
      failures,
    },
  };
}
