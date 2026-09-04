const HYOGO_VENUES = {
  '園田': { slug: 'sonoda', code: '27' },
  '姫路': { slug: 'himeji', code: '28' },
};

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
}

export function hyogoOfficialMonthUrl(date) {
  const [year, month] = String(date).split('-');
  return `https://www.sonoda-himeji.jp/schedule/${year}/${month}`;
}

function meetingRow(venueJa, date, officialSourceUrl) {
  const venue = HYOGO_VENUES[venueJa];
  return {
    meeting_id: `nar-${venue.slug}-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: `${venue.slug}-racecourse`,
    venue_code: venue.code,
    source_id: 'hyogo-urban-keiba-official-calendar',
    source_label: '兵庫県競馬組合',
    official_source_url: officialSourceUrl,
  };
}

export function parseHyogoOfficialCalendarMonth(html, { year, month, allowedDates, sourceUrl }) {
  const text = String(html);
  const expectedMonth = `${year}/${String(month).padStart(2, '0')}`;
  const navMonth = text.match(/<div\b[^>]*class=["'][^"']*l-cal_nav_date[^"']*["'][^>]*>\s*(\d{4}\/\d{2})\s*<\/div>/i)?.[1] ?? null;
  const table = text.match(/<table\b[^>]*class=["'][^"']*\bl-cal\b[^"']*["'][^>]*>[\s\S]*?<\/table>/i)?.[0] ?? '';
  const allowed = new Set(allowedDates);
  const meetings = [];
  const currentDays = new Set();
  let currentCellCount = 0;
  let invalidCellCount = 0;

  for (const match of table.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)) {
    const attrs = match[1];
    const body = match[2];
    const className = attrs.match(/class=["']([^"']*)["']/i)?.[1] ?? '';
    if (!/(?:^|\s)l-cal_itm(?:\s|$)/.test(className) || /(?:^|\s)-out(?:\s|$)/.test(className)) continue;
    currentCellCount += 1;
    const day = Number(body.match(/<div\b[^>]*class=["'][^"']*l-cal_date[^"']*["'][^>]*>\s*<span>\s*(\d{1,2})\s*<\/span>/i)?.[1] ?? NaN);
    const date = Number.isInteger(day) ? isoDate(year, month, day) : null;
    if (!date || currentDays.has(day)) {
      invalidCellCount += 1;
      continue;
    }
    currentDays.add(day);
    const venueJa = body.match(/(園田|姫路)競馬\s*\d+回\s*\d+日目/)?.[1] ?? null;
    if (venueJa && allowed.has(date)) meetings.push(meetingRow(venueJa, date, sourceUrl));
  }

  const expectedDays = daysInMonth(year, month);
  const structuralValid = navMonth === expectedMonth
    && Boolean(table)
    && currentCellCount === expectedDays
    && currentDays.size === expectedDays
    && invalidCellCount === 0;
  return {
    structural_valid: structuralValid,
    current_cell_count: currentCellCount,
    expected_day_count: expectedDays,
    invalid_cell_count: invalidCellCount,
    meetings: [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
      .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id)),
  };
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
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.sonoda-himeji.jp') {
    throw new Error(`unexpected Hyogo official redirect: ${finalUrl.toString()}`);
  }
  return {
    body: new TextDecoder('utf-8').decode(await response.arrayBuffer()),
    url: finalUrl.toString(),
  };
}

export async function discoverHyogoOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Hyogo official discovery requires dates');
  const sourceUrls = [...new Set(dates.map(hyogoOfficialMonthUrl))];
  const meetings = [];
  const failures = [];
  let completePages = 0;

  for (const sourceUrl of sourceUrls) {
    try {
      const page = await fetchHtml(sourceUrl, fetchImpl);
      const monthDates = dates.filter((date) => hyogoOfficialMonthUrl(date) === sourceUrl);
      const parsed = parseHyogoOfficialCalendarMonth(page.body, {
        year: Number(monthDates[0].slice(0, 4)),
        month: Number(monthDates[0].slice(5, 7)),
        allowedDates: monthDates,
        sourceUrl: page.url,
      });
      meetings.push(...parsed.meetings);
      if (!parsed.structural_valid) {
        failures.push({ source_url: page.url, reason: 'calendar_structure_incomplete' });
      } else {
        completePages += 1;
      }
    } catch (error) {
      failures.push({ source_url: sourceUrl, reason: String(error?.message ?? error) });
    }
  }

  const deduped = [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  const completeness = failures.length === 0 && completePages === sourceUrls.length
    ? 'complete'
    : completePages === 0 ? 'failed' : 'partial';
  return {
    meetings: deduped,
    completeness: {
      source_id: 'hyogo-urban-keiba-official-calendar',
      role: 'mother_set',
      requested_window: { start: dates[0], end: dates.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: deduped.length,
      parsed_detail_count: 0,
      pending_count: 0,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? dates.at(-1) : null,
      source_urls: sourceUrls,
      failures,
    },
  };
}
