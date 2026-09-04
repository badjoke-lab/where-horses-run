const IWATE_VENUES = {
  miz: { slug: 'mizusawa', code: '11', label: '水沢' },
  mori: { slug: 'morioka', code: '10', label: '盛岡' },
};

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

export function iwatekeibaMonthUrl(date) {
  const [year, month] = String(date).split('-');
  return `https://www.iwatekeiba.or.jp/calendar/${year}_${month}`;
}

function meetingRow(venue, date, officialSourceUrl) {
  return {
    meeting_id: `nar-${venue.slug}-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: `${venue.slug}-racecourse`,
    venue_code: venue.code,
    source_id: 'iwatekeiba-official-calendar',
    source_label: '岩手競馬',
    official_source_url: officialSourceUrl,
  };
}

export function parseIwatekeibaCalendarMonth(html, { year, month, allowedDates, sourceUrl }) {
  const rows = [...String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  const allowed = new Set(allowedDates);
  const meetings = [];
  let recognizedBlocks = 0;
  let invalidBlocks = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const venueToken = row.match(/18_c_(miz|mori)\.png/i)?.[1]?.toLowerCase();
    if (!venueToken) continue;
    const venue = IWATE_VENUES[venueToken];
    if (!venue) continue;
    recognizedBlocks += 1;
    const rowspan = Number(row.match(/rowspan\s*=\s*["']?(\d+)/i)?.[1] ?? 0);
    if (!Number.isInteger(rowspan) || rowspan < 1 || index + rowspan > rows.length) {
      invalidBlocks += 1;
      continue;
    }
    const block = rows.slice(index, index + rowspan).join('\n');
    const seenDates = new Set();
    for (const match of block.matchAll(new RegExp(`${Number(month)}月\\s*(\\d{1,2})日`, 'g'))) {
      const date = isoDate(year, month, Number(match[1]));
      if (!date || seenDates.has(date)) continue;
      seenDates.add(date);
      if (allowed.has(date)) meetings.push(meetingRow(venue, date, sourceUrl));
    }
  }

  return {
    structural_valid: recognizedBlocks > 0 && invalidBlocks === 0,
    recognized_block_count: recognizedBlocks,
    invalid_block_count: invalidBlocks,
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
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.iwatekeiba.or.jp') {
    throw new Error(`unexpected Iwate Keiba redirect: ${finalUrl.toString()}`);
  }
  const bytes = await response.arrayBuffer();
  return {
    body: new TextDecoder('utf-8').decode(bytes),
    url: finalUrl.toString(),
  };
}

export async function discoverIwatekeibaOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Iwate Keiba discovery requires dates');
  const allowed = new Set(dates);
  const sourceUrls = [...new Set(dates.map(iwatekeibaMonthUrl))];
  const meetings = [];
  const failures = [];
  const pageResults = [];

  for (const sourceUrl of sourceUrls) {
    try {
      const page = await fetchHtml(sourceUrl, fetchImpl);
      const monthDates = dates.filter((date) => iwatekeibaMonthUrl(date) === sourceUrl);
      const parsed = parseIwatekeibaCalendarMonth(page.body, {
        year: Number(monthDates[0].slice(0, 4)),
        month: Number(monthDates[0].slice(5, 7)),
        allowedDates: monthDates,
        sourceUrl: page.url,
      });
      meetings.push(...parsed.meetings.filter((row) => allowed.has(row.date)));
      if (!parsed.structural_valid) {
        failures.push({ source_url: page.url, reason: 'calendar_structure_incomplete' });
        pageResults.push({ source_url: page.url, result: 'partial' });
      } else {
        pageResults.push({ source_url: page.url, result: 'complete' });
      }
    } catch (error) {
      failures.push({ source_url: sourceUrl, reason: String(error?.message ?? error) });
      pageResults.push({ source_url: sourceUrl, result: 'failed' });
    }
  }

  const deduped = [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  const successfulPages = pageResults.filter((row) => row.result === 'complete').length;
  const completeness = failures.length === 0 && successfulPages === sourceUrls.length
    ? 'complete'
    : successfulPages === 0 ? 'failed' : 'partial';

  return {
    meetings: deduped,
    completeness: {
      source_id: 'iwatekeiba-official-calendar',
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
