import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const IRELAND_HRI_SOURCE_ID = 'hri-fixtures';
export const IRELAND_HRI_DETAIL_SOURCE_ID = 'hri-racecards-month';
export const IRELAND_HRI_ADAPTER_ID = 'ireland-hri-fixture-list-best-available-v1';
export const IRELAND_HRI_DETAIL_ADAPTER_ID = 'ireland-hri-racecards-month-best-available-v1';
export const IRELAND_HRI_SYSTEM_ID = 'ireland-hri-racing-system';
export const IRELAND_HRI_AUTHORITY_ID = 'horse-racing-ireland';
export const IRELAND_TIMEZONE = 'Europe/Dublin';
export const IRELAND_HRI_FIXTURE_PAGE_URL = 'https://www.hri.ie/fixture-list';
export const IRELAND_HRI_RACECARDS_URL = 'https://www.hri.ie/racecards';
export const IRELAND_HRI_RACECARD_MONTH_ENDPOINT = 'https://www.hri.ie/Ajax/RaceMeetingByMonth';
export const IRELAND_HRI_PDF_URLS = Object.freeze([
  'https://www.hri.ie/HRI/media/HRI/Comms/Documents/2026-Fixture-List-%28Weekly%29-%28Incl-Tipperary-Changes%29.pdf',
  'https://www.hri.ie/HRI/media/HRI/Comms/Documents/2026-Irish-Racing-Fixture-List-%28Weekly%29.pdf',
]);

const MONTHS = Object.freeze({ JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12 });
const MONTH_ABBR = Object.freeze({ Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 });
const WEEKDAYS = Object.freeze({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
const VENUES = Object.freeze({
  Ballinrobe: 'ireland--ballinrobe', Bellewstown: 'ireland--bellewstown', Clonmel: 'ireland--clonmel', Cork: 'ireland--cork-mallow', Curragh: 'ireland--curragh', Downpatrick: 'ireland--downpatrick', 'Down Royal': 'ireland--down-royal', Dundalk: 'ireland--dundalk', Fairyhouse: 'ireland--fairyhouse', Galway: 'ireland--galway', 'Gowran Park': 'ireland--gowran-park', Kilbeggan: 'ireland--kilbeggan', Killarney: 'ireland--killarney', Laytown: 'ireland--laytown', Leopardstown: 'ireland--leopardstown', Limerick: 'ireland--limerick', Listowel: 'ireland--listowel', Naas: 'ireland--naas', Navan: 'ireland--navan', Punchestown: 'ireland--punchestown', Roscommon: 'ireland--roscommon', Sligo: 'ireland--sligo', Thurles: 'ireland--thurles', Tipperary: 'ireland--tipperary', Tramore: 'ireland--tramore', Wexford: 'ireland--wexford',
});

const KNOWN_SOURCE_WEEKDAY_MISMATCHES = Object.freeze({
  '2026-10-04/Curragh': Object.freeze({ source_weekday: 'Sat', calendar_weekday: 'Sun', reason: 'HRI 2026 Tipperary-change revision moved the Curragh fixture from 3 October to 4 October.' }),
});

function pad(value) { return String(value).padStart(2, '0'); }
function isoDate(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }
function inWindow(date, startDate, endDateExclusive) { return (!startDate || date >= startDate) && (!endDateExclusive || date < endDateExclusive); }
function monthKey(date) { return String(date).slice(0, 7); }
function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));
}
function visibleText(value) {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function hrefFromAnchorMatch(match) { return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? ''); }
function parseHriHref(href) {
  try { return new URL(href, 'https://www.hri.ie'); } catch { return null; }
}

export function resolveIrelandHriRacecourseId(label) { return VENUES[label.trim()] ?? null; }

export function parseIrelandHriFixtureText(text, { startDate = null, endDateExclusive = null } = {}) {
  if (typeof text !== 'string' || text.trim() === '') throw new Error('HRI fixture source text must be non-empty');
  if (!/Fixture List/i.test(text) || !/(Horse Racing Ireland|©\s*Horse Racing Ireland)/i.test(text)) throw new Error('HRI fixture source fingerprint missing Fixture List / Horse Racing Ireland');
  const yearMatch = text.match(/\b(20\d{2})\s+Fixture List\b/i) ?? text.match(/\bFixture List\s+(20\d{2})\b/i);
  if (!yearMatch) throw new Error('HRI fixture source year could not be resolved');
  const year = Number(yearMatch[1]);
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const records = [];
  const unknownVenues = [];
  const parseFailures = [];
  const sourceWarnings = [];
  let month = null;
  for (const line of lines) {
    const monthMatch = line.match(/^(?:\d{1,2}\s*)?(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)$/i);
    if (monthMatch) { month = MONTHS[monthMatch[1].toUpperCase()]; continue; }
    const fixtureMatch = line.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+([0-3]?\d)\s+(.+)$/);
    if (!fixtureMatch) continue;
    if (!month) { parseFailures.push({ code: 'fixture_before_month', source_line: line }); continue; }
    const weekday = fixtureMatch[1];
    const day = Number(fixtureMatch[2]);
    const rawVenue = fixtureMatch[3].trim();
    const flags = [...rawVenue.matchAll(/\((e|STC|TBC)\)/gi)].map((match) => match[1].toUpperCase());
    const venueLabel = rawVenue.replace(/\s*\((?:e|STC|TBC)\)/gi, '').trim();
    const racecourseId = resolveIrelandHriRacecourseId(venueLabel);
    const date = isoDate(year, month, day);
    const parsedWeekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (WEEKDAYS[weekday] !== parsedWeekday) {
      const known = KNOWN_SOURCE_WEEKDAY_MISMATCHES[`${date}/${venueLabel}`];
      if (known?.source_weekday === weekday) {
        sourceWarnings.push({ code: 'known_source_weekday_mismatch', date, source_weekday: weekday, calendar_weekday: known.calendar_weekday, venue_label: venueLabel, reason: known.reason });
      } else {
        parseFailures.push({ code: 'weekday_mismatch', date, weekday, venue_label: venueLabel });
        continue;
      }
    }
    if (!racecourseId) { unknownVenues.push({ date, venue_label: venueLabel, source_line: line }); continue; }
    if (!inWindow(date, startDate, endDateExclusive)) continue;
    records.push({ date, venue_label: venueLabel, racecourse_id: racecourseId, source_flags: flags });
  }
  const deduped = [...new Map(records.map((row) => [`${row.date}/${row.racecourse_id}`, row])).values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
  if (!deduped.length && startDate && endDateExclusive) parseFailures.push({ code: 'no_records_in_requested_window', start_date: startDate, end_date_exclusive: endDateExclusive });
  return { records: deduped, unknown_venues: unknownVenues, parse_failures: parseFailures, source_warnings: sourceWarnings, fixture_line_count: records.length };
}

export function parseIrelandHriRacecardMonthHtml(html) {
  if (typeof html !== 'string' || html.trim() === '') throw new Error('HRI racecard month source must be non-empty HTML');
  const blocks = html.split(/<div\b[^>]*class=["'][^"']*\brace-result-item\b[^"']*["'][^>]*>/i).slice(1);
  const meetings = [];
  const unknownVenues = [];
  const parseFailures = [];

  for (const block of blocks) {
    const header = block.match(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*,\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
    if (!header) continue;
    const href = hrefFromAnchorMatch(header);
    const url = parseHriHref(href);
    const meetingId = url?.searchParams.get('meeting') ?? null;
    const venueLabel = visibleText(header[4]);
    const weekday = header[5];
    const month = MONTH_ABBR[header[6]];
    const day = Number(header[7]);
    const yearMatch = meetingId?.match(/^(20\d{2})-/);
    if (!meetingId || !yearMatch || !month || !day) {
      parseFailures.push({ code: 'invalid_meeting_header', venue_label: venueLabel, href });
      continue;
    }
    const date = isoDate(Number(yearMatch[1]), month, day);
    const calendarWeekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (WEEKDAYS[weekday] !== calendarWeekday) {
      parseFailures.push({ code: 'racecard_weekday_mismatch', date, weekday, venue_label: venueLabel, hri_meeting_id: meetingId });
      continue;
    }
    const racecourseId = resolveIrelandHriRacecourseId(venueLabel);
    if (!racecourseId) {
      unknownVenues.push({ date, venue_label: venueLabel, hri_meeting_id: meetingId });
      continue;
    }

    const races = [];
    const tables = [...block.matchAll(/<table\b[^>]*class=["'][^"']*\btable-condensed\b[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)];
    for (const tableMatch of tables) {
      const table = tableMatch[1];
      const timeMatch = table.match(/<td\b[^>]*>\s*([0-2]\d:[0-5]\d)\s*<\/td>/i);
      const anchor = table.match(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/i);
      if (!timeMatch || !anchor) continue;
      const raceHref = hrefFromAnchorMatch(anchor);
      const raceUrl = parseHriHref(raceHref);
      const raceMeetingId = raceUrl?.searchParams.get('meeting') ?? null;
      const raceToken = raceUrl?.searchParams.get('race') ?? null;
      const postTime = timeMatch[1];
      const expectedToken = postTime.replace(':', '');
      if (raceMeetingId !== meetingId || (raceToken && raceToken !== expectedToken)) {
        parseFailures.push({ code: 'race_link_conflict', date, venue_label: venueLabel, hri_meeting_id: meetingId, race_meeting_id: raceMeetingId, post_time_local: postTime, race_token: raceToken });
        continue;
      }
      const raceName = visibleText(anchor[4]);
      if (!raceName) {
        parseFailures.push({ code: 'race_name_missing', date, venue_label: venueLabel, hri_meeting_id: meetingId, post_time_local: postTime });
        continue;
      }
      races.push({ label: `Race ${races.length + 1}`, post_time_local: postTime, race_name: raceName });
    }
    meetings.push({ date, venue_label: venueLabel, racecourse_id: racecourseId, hri_meeting_id: meetingId, races });
  }

  const deduped = new Map();
  for (const meeting of meetings) {
    const key = `${meeting.date}/${meeting.racecourse_id}`;
    const previous = deduped.get(key);
    if (previous && previous.hri_meeting_id !== meeting.hri_meeting_id) {
      parseFailures.push({ code: 'duplicate_meeting_conflict', date: meeting.date, racecourse_id: meeting.racecourse_id, hri_meeting_ids: [previous.hri_meeting_id, meeting.hri_meeting_id] });
      continue;
    }
    deduped.set(key, meeting);
  }
  return { meetings: [...deduped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id)), unknown_venues: unknownVenues, parse_failures: parseFailures };
}

export function buildIrelandHriCandidate({ text, checkedAt, startDate, endDateExclusive, sourceUrl = IRELAND_HRI_FIXTURE_PAGE_URL }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) throw new Error('startDate must be YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive ?? '')) throw new Error('endDateExclusive must be YYYY-MM-DD');
  if (!(startDate < endDateExclusive)) throw new Error('Ireland HRI candidate window must be non-empty');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('checkedAt must be an ISO date-time');
  const parsed = parseIrelandHriFixtureText(text, { startDate, endDateExclusive });
  const records = parsed.records.map((row) => {
    const meetingId = `ireland-${row.racecourse_id}-${row.date}`;
    const record = {
      candidate_id: meetingId, meeting_id: meetingId, country_id: 'ireland', authority_id: IRELAND_HRI_AUTHORITY_ID, racing_system_id: IRELAND_HRI_SYSTEM_ID, racecourse_id: row.racecourse_id, date: row.date, timezone: IRELAND_TIMEZONE,
      first_race_time_local: null, last_race_time_local: null, timetable_rows: [],
      source: { source_id: IRELAND_HRI_SOURCE_ID, official_url: sourceUrl, checked_at: checked.toISOString(), extraction_method: 'official_pdf_adapter_candidate' },
      confidence: 'high', review_status: 'needs_review', notes: `Official HRI fixture-list meeting observation; source venue label: ${row.venue_label}${row.source_flags.length ? `; flags: ${row.source_flags.join(',')}` : ''}.`,
    };
    return { ...record, capability_rank: deriveBestAvailableRank(record, record.timetable_rows) };
  });
  return {
    candidate: {
      schema_version: 'timetable-candidate-v1', generated_at: checked.toISOString(), adapter_id: IRELAND_HRI_ADAPTER_ID, country_id: 'ireland', authority_id: IRELAND_HRI_AUTHORITY_ID, source_id: IRELAND_HRI_SOURCE_ID, collection_target_rank: 'best_available', candidate_window: { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: IRELAND_TIMEZONE }, records,
      review: { status: 'needs_review', reviewed_at: null, reviewer: null, summary: 'HRI annual fixture-list observations provide meeting discovery; the official HRI racecard month endpoint is evaluated separately for Best Available race-time evidence through A.', promotion_target: null },
    },
    diagnostics: { fixture_line_count: parsed.fixture_line_count, records_emitted: records.length, unknown_venues: parsed.unknown_venues, parse_failures: parsed.parse_failures, source_warnings: parsed.source_warnings },
  };
}

export function enrichIrelandHriCandidateWithRacecards(candidate, { meetings = [], sourceErrorsByMonth = {}, checkedAt, detailSourceUrl = IRELAND_HRI_RACECARDS_URL } = {}) {
  if (!candidate || !Array.isArray(candidate.records)) throw new Error('Ireland HRI candidate.records must be an array');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('checkedAt must be an ISO date-time');
  const byMeeting = new Map(meetings.map((meeting) => [`${meeting.date}/${meeting.racecourse_id}`, meeting]));
  const records = candidate.records.map((base) => {
    const key = `${base.date}/${base.racecourse_id}`;
    const error = sourceErrorsByMonth[monthKey(base.date)] ?? null;
    if (error) {
      return {
        ...base,
        detail_observation: { status: 'source_error', evaluated_capability_rank: null, race_count: 0, hri_meeting_id: null, source_url: detailSourceUrl, error_code: error.code ?? 'racecard_month_fetch_failed' },
      };
    }
    const detail = byMeeting.get(key) ?? null;
    if (!detail || detail.races.length === 0) {
      return {
        ...base,
        ...(detail?.hri_meeting_id ? { hri_meeting_id: detail.hri_meeting_id } : {}),
        detail_observation: { status: 'not_published', evaluated_capability_rank: null, race_count: 0, hri_meeting_id: detail?.hri_meeting_id ?? null, source_url: detailSourceUrl },
      };
    }
    const rows = detail.races.map((row) => ({ label: row.label, post_time_local: row.post_time_local, race_name: row.race_name }));
    const first = rows[0].post_time_local;
    const last = rows.at(-1).post_time_local;
    const enriched = {
      ...base,
      hri_meeting_id: detail.hri_meeting_id,
      first_race_time_local: first,
      last_race_time_local: last,
      timetable_rows: rows,
      source: { source_id: IRELAND_HRI_DETAIL_SOURCE_ID, official_url: detailSourceUrl, checked_at: checked.toISOString(), extraction_method: 'official_hri_racecard_month_ajax' },
      detail_observation: { status: 'available', evaluated_capability_rank: 'A', race_count: rows.length, hri_meeting_id: detail.hri_meeting_id, source_url: detailSourceUrl },
      notes: `${base.notes} HRI official racecard month evidence acquired for ${rows.length} races.`,
    };
    return { ...enriched, capability_rank: deriveBestAvailableRank(enriched, rows) };
  });
  return { ...candidate, adapter_id: IRELAND_HRI_DETAIL_ADAPTER_ID, source_id: IRELAND_HRI_DETAIL_SOURCE_ID, records };
}
