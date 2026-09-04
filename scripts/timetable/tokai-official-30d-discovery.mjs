import crypto from 'node:crypto';

export const TOKAI_OFFICIAL_PDF_URL = 'https://www.kasamatsu-keiba.com/resources/pdfs/news/2026/1768888484_abd42430844a7f06de8d.pdf';
export const TOKAI_FISCAL_YEAR_WINDOW = Object.freeze({ start: '2026-04-01', end: '2027-03-31' });
export const TOKAI_MONTHLY_SCHEDULE_BASE_URL = 'https://www.kasamatsu-keiba.com/schedule/';

const TOKAI_VENUES = {
  '23': { label: '笠松', racecourse_id: 'kasamatsu-racecourse', venue_code: '23' },
  '24': { label: '名古屋', racecourse_id: 'nagoya-racecourse', venue_code: '24' },
};

function meetingRow(code, date, sourceUrl) {
  const venue = TOKAI_VENUES[code];
  return {
    meeting_id: `nar-${venue.racecourse_id}-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: venue.racecourse_id,
    venue_code: venue.venue_code,
    source_id: 'tokai-region-joint-official-calendar',
    source_label: '東海地区競馬開催日程 / 笠松けいば開催日程',
    official_source_url: sourceUrl,
  };
}

function withinFiscalYear(date) {
  return date >= TOKAI_FISCAL_YEAR_WINDOW.start && date <= TOKAI_FISCAL_YEAR_WINDOW.end;
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function parseTokaiOfficialMonthlySchedule(html, requestedDates, sourceUrl) {
  const body = String(html ?? '');
  if (!/<title[^>]*>[\s\S]*?開催日程[\s\S]*?<\/title>/i.test(body)) {
    throw new Error('Tokai monthly official schedule title marker missing');
  }
  if (!/class=["'][^"']*schedule_(?:name|link)/i.test(body)) {
    throw new Error('Tokai monthly official schedule table marker missing');
  }
  const allowed = new Set(requestedDates ?? []);
  const meetings = [];
  const pattern = /<a\b[^>]*href=["']([^"']*TodayRaceInfo\/RaceList[^"']*k_raceDate=(\d{4})%2F(\d{2})%2F(\d{2})[^"']*k_babaCode=(23|24)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of body.matchAll(pattern)) {
    const [, href, year, month, day, code, anchorBody] = match;
    const date = `${year}-${month}-${day}`;
    if (!allowed.has(date)) continue;
    const anchorText = anchorBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const expected = TOKAI_VENUES[code];
    if (!anchorText.includes(expected.label)) continue;
    // The independent evidence is the official Kasamatsu schedule page itself,
    // not the NAR destination encoded by its outbound RaceList link.
    meetings.push(meetingRow(code, date, sourceUrl));
    void href;
  }
  return [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
}

async function officialFetch(url, fetchImpl, accept) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept,
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.kasamatsu-keiba.com') {
    throw new Error(`unexpected Tokai official redirect: ${finalUrl.toString()}`);
  }
  return { response, finalUrl: finalUrl.toString() };
}

async function fetchJointCalendarBaseline(fetchImpl) {
  const { response, finalUrl } = await officialFetch(TOKAI_OFFICIAL_PDF_URL, fetchImpl, 'application/pdf');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 20000 || bytes.subarray(0, 4).toString('ascii') !== '%PDF') {
    throw new Error(`Tokai joint official PDF payload invalid: ${bytes.length} bytes`);
  }
  return {
    url: finalUrl,
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

function monthKeys(dates) {
  return [...new Set(dates.map((date) => date.slice(0, 7)))].sort();
}

export async function discoverTokaiOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Tokai official discovery requires dates');
  const requested = [...dates].sort();
  const failures = [];
  const unsupportedDates = requested.filter((date) => !withinFiscalYear(date));
  if (unsupportedDates.length) {
    failures.push({
      source_url: TOKAI_OFFICIAL_PDF_URL,
      reason: `outside_tokai_fiscal_year_window:${unsupportedDates[0]}..${unsupportedDates.at(-1)}`,
    });
  }

  let baseline = null;
  try {
    baseline = await fetchJointCalendarBaseline(fetchImpl);
  } catch (error) {
    failures.push({ source_url: TOKAI_OFFICIAL_PDF_URL, reason: String(error?.message ?? error) });
  }

  const meetings = [];
  const monthlyUrls = [];
  for (const monthKey of monthKeys(requested.filter(withinFiscalYear))) {
    const [year, month] = monthKey.split('-');
    const url = `${TOKAI_MONTHLY_SCHEDULE_BASE_URL}${year}/${month}`;
    monthlyUrls.push(url);
    try {
      const { response, finalUrl } = await officialFetch(url, fetchImpl, 'text/html');
      const html = await response.text();
      meetings.push(...parseTokaiOfficialMonthlySchedule(html, requested, finalUrl));
    } catch (error) {
      failures.push({ source_url: url, reason: String(error?.message ?? error) });
    }
  }

  const deduped = [...new Map(meetings.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  const completeness = failures.length === 0 ? 'complete' : deduped.length ? 'partial' : 'failed';
  return {
    meetings: deduped,
    completeness: {
      source_id: 'tokai-region-joint-official-calendar',
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: deduped.length,
      parsed_detail_count: 0,
      pending_count: unsupportedDates.length,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : null,
      source_urls: [baseline?.url ?? TOKAI_OFFICIAL_PDF_URL, ...monthlyUrls],
      joint_calendar_sha256: baseline?.sha256 ?? null,
      joint_calendar_bytes: baseline?.bytes ?? null,
      fiscal_year_window: TOKAI_FISCAL_YEAR_WINDOW,
      failures,
    },
  };
}
