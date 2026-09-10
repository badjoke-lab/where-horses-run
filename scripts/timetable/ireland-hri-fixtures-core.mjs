import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const IRELAND_HRI_SOURCE_ID = 'hri-fixtures';
export const IRELAND_HRI_ADAPTER_ID = 'ireland-hri-fixture-list-best-available-v1';
export const IRELAND_HRI_SYSTEM_ID = 'ireland-hri-racing-system';
export const IRELAND_HRI_AUTHORITY_ID = 'horse-racing-ireland';
export const IRELAND_TIMEZONE = 'Europe/Dublin';
export const IRELAND_HRI_FIXTURE_PAGE_URL = 'https://www.hri.ie/fixture-list';
export const IRELAND_HRI_PDF_URLS = Object.freeze([
  'https://www.hri.ie/HRI/media/HRI/Comms/Documents/2026-Fixture-List-%28Weekly%29-%28Incl-Tipperary-Changes%29.pdf',
  'https://www.hri.ie/HRI/media/HRI/Comms/Documents/2026-Irish-Racing-Fixture-List-%28Weekly%29.pdf',
]);

const MONTHS = Object.freeze({ JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12 });
const WEEKDAYS = Object.freeze({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
const VENUES = Object.freeze({
  Ballinrobe: 'ireland--ballinrobe', Bellewstown: 'ireland--bellewstown', Clonmel: 'ireland--clonmel', Cork: 'ireland--cork-mallow', Curragh: 'ireland--curragh', Downpatrick: 'ireland--downpatrick', 'Down Royal': 'ireland--down-royal', Dundalk: 'ireland--dundalk', Fairyhouse: 'ireland--fairyhouse', Galway: 'ireland--galway', 'Gowran Park': 'ireland--gowran-park', Kilbeggan: 'ireland--kilbeggan', Killarney: 'ireland--killarney', Laytown: 'ireland--laytown', Leopardstown: 'ireland--leopardstown', Limerick: 'ireland--limerick', Listowel: 'ireland--listowel', Naas: 'ireland--naas', Navan: 'ireland--navan', Punchestown: 'ireland--punchestown', Roscommon: 'ireland--roscommon', Sligo: 'ireland--sligo', Thurles: 'ireland--thurles', Tipperary: 'ireland--tipperary', Tramore: 'ireland--tramore', Wexford: 'ireland--wexford',
});

// HRI's revised 2026 fixture PDF moved the Curragh fixture from 3 October to
// 4 October but retained the old "Sat" weekday token. Keep this exception
// narrow and explicit; every other weekday/date mismatch remains fail-closed.
const KNOWN_SOURCE_WEEKDAY_MISMATCHES = Object.freeze({
  '2026-10-04/Curragh': Object.freeze({ source_weekday: 'Sat', calendar_weekday: 'Sun', reason: 'HRI 2026 Tipperary-change revision moved the Curragh fixture from 3 October to 4 October.' }),
});

function pad(value) { return String(value).padStart(2, '0'); }
function isoDate(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }
function inWindow(date, startDate, endDateExclusive) { return (!startDate || date >= startDate) && (!endDateExclusive || date < endDateExclusive); }

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
      review: { status: 'needs_review', reviewed_at: null, reviewer: null, summary: 'HRI annual fixture-list observations use centrally derived best-available rank. The annual fixture PDF currently proves meeting date and venue; race-time/detail enrichment is a separate source path.', promotion_target: null },
    },
    diagnostics: { fixture_line_count: parsed.fixture_line_count, records_emitted: records.length, unknown_venues: parsed.unknown_venues, parse_failures: parsed.parse_failures, source_warnings: parsed.source_warnings },
  };
}
