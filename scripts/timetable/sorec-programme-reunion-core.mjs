const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/;

export const SOREC_PROGRAMME_REUNION_URL = 'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';
export const SOREC_SOURCE_ID = 'sorec-programme-reunion';
export const SOREC_ADAPTER_ID = 'sorec-programme-reunion-rank-c-v1';
export const SOREC_SYSTEM_ID = 'sorec-racing-information-system';
export const SOREC_TIMEZONE = 'Africa/Casablanca';

const VENUE_MAP = Object.freeze(new Map([
  ['casablanca', 'casablanca-anfa-racecourse'],
  ['casablanca-anfa', 'casablanca-anfa-racecourse'],
  ['meknes', 'meknes-racecourse'],
  ['marrakech', 'marrakech-racecourse'],
  ['rabat', 'rabat-racecourse'],
  ['settat', 'settat-racecourse'],
  ['el jadida', 'el-jadida-racecourse'],
  ['khemisset', 'khemisset-racecourse'],
]));

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&egrave;/gi, 'è')
    .replace(/&agrave;/gi, 'à')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLabel(value) {
  return decodeHtml(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[-–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(value) {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const iso = `${year}-${mm}-${dd}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso;
}

function inWindow(date, startDate, endDateExclusive) {
  return (!startDate || date >= startDate) && (!endDateExclusive || date < endDateExclusive);
}

export function resolveSorecRacecourseId(label) {
  return VENUE_MAP.get(normalizeLabel(label)) ?? null;
}

function htmlRows(html) {
  const rows = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((match) => decodeHtml(match[1]));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function fallbackRows(html) {
  const text = decodeHtml(html);
  const venues = 'Casablanca(?:-Anfa)?|Mekn(?:e|è)s|Marrakech|Rabat|Settat|El jadida|Khemisset';
  const pattern = new RegExp(`(\\d{2}\\/\\d{2}\\/(?:\\d{2}|\\d{4}))\\s+(${venues})\\b`, 'gi');
  return [...text.matchAll(pattern)].map((match) => [match[1], match[2]]);
}

export function parseSorecProgrammeReunionHtml(html, { startDate = null, endDateExclusive = null } = {}) {
  if (typeof html !== 'string' || html.trim() === '') throw new Error('SOREC programme source body must be non-empty HTML');
  if (!/Programme\s+R[ée]union/i.test(decodeHtml(html))) throw new Error('SOREC programme fingerprint missing Programme Réunion');

  const rawRows = htmlRows(html);
  const sourceRows = rawRows.length ? rawRows : fallbackRows(html);
  const records = [];
  const unknownVenues = [];
  const parseFailures = [];
  const seen = new Set();

  for (const cells of sourceRows) {
    const dateCell = cells.find((cell) => DATE_PATTERN.test(cell.trim()));
    if (!dateCell) continue;
    const date = toIsoDate(dateCell);
    if (!date) {
      parseFailures.push({ code: 'invalid_date', value: dateCell });
      continue;
    }
    if (!inWindow(date, startDate, endDateExclusive)) continue;

    const dateIndex = cells.indexOf(dateCell);
    const venueLabel = cells[dateIndex + 1] ?? '';
    if (!venueLabel) {
      parseFailures.push({ code: 'missing_venue', date });
      continue;
    }
    const racecourseId = resolveSorecRacecourseId(venueLabel);
    if (!racecourseId) {
      unknownVenues.push({ date, venue_label: venueLabel });
      continue;
    }
    const key = `${date}/${racecourseId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    records.push({ date, venue_label: venueLabel, racecourse_id: racecourseId });
  }

  records.sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
  return { records, unknown_venues: unknownVenues, parse_failures: parseFailures, source_row_count: sourceRows.length };
}

export function buildSorecRankCCandidate({ html, checkedAt, startDate, endDateExclusive }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) throw new Error('startDate must be YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive ?? '')) throw new Error('endDateExclusive must be YYYY-MM-DD');
  if (!(startDate < endDateExclusive)) throw new Error('SOREC candidate window must be non-empty');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('checkedAt must be an ISO date-time');

  const parsed = parseSorecProgrammeReunionHtml(html, { startDate, endDateExclusive });
  const records = parsed.records.map((row) => {
    const meetingId = `sorec-${row.racecourse_id}-${row.date}`;
    return {
      candidate_id: meetingId,
      meeting_id: meetingId,
      country_id: 'morocco',
      authority_id: 'sorec',
      racing_system_id: SOREC_SYSTEM_ID,
      racecourse_id: row.racecourse_id,
      date: row.date,
      timezone: SOREC_TIMEZONE,
      capability_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: SOREC_SOURCE_ID,
        official_url: SOREC_PROGRAMME_REUNION_URL,
        checked_at: checked.toISOString(),
        extraction_method: 'adapter_candidate',
      },
      confidence: 'high',
      review_status: 'needs_review',
      notes: `Official SOREC Programme Réunion meeting identity; source venue label: ${row.venue_label}.`,
    };
  });

  return {
    candidate: {
      schema_version: 'timetable-candidate-v1',
      generated_at: checked.toISOString(),
      adapter_id: SOREC_ADAPTER_ID,
      country_id: 'morocco',
      authority_id: 'sorec',
      source_id: SOREC_SOURCE_ID,
      candidate_window: { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: SOREC_TIMEZONE },
      records,
      review: {
        status: 'needs_review',
        reviewed_at: null,
        reviewer: null,
        summary: 'SOREC Programme Réunion Rank C meeting identities require normal review before promotion.',
        promotion_target: null,
      },
    },
    diagnostics: {
      source_row_count: parsed.source_row_count,
      records_emitted: records.length,
      unknown_venues: parsed.unknown_venues,
      parse_failures: parsed.parse_failures,
    },
  };
}
