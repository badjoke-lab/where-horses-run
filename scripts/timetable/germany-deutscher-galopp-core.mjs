import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const GERMANY_TIMEZONE = 'Europe/Berlin';
export const GERMANY_AUTHORITY_ID = 'deutscher-galopp';
export const GERMANY_SYSTEM_ID = 'germany-deutscher-galopp-system';
export const GERMANY_SOURCE_ID = 'deutscher-galopp-calendar';
export const GERMANY_CALENDAR_URL = 'https://www.deutscher-galopp.de/gr/renntage/rennkalender.php';
export const GERMANY_ANNUAL_PDF_URL = 'https://www.deutscher-galopp.de/gr-wAssets/docs/renntermine2026.pdf';

const VENUE_IDS = Object.freeze({
  'Bad Harzburg': 'germany--bad-harzburg',
  'Baden-Baden': 'germany--baden-baden',
  'Berlin-Hoppegarten': 'germany--hoppegarten',
  'Billigheim': 'germany--billigheim',
  'Cuxhaven': 'germany--cuxhaven',
  'Dortmund': 'germany--dortmund',
  'Dresden': 'germany--dresden',
  'Düsseldorf': 'germany--dusseldorf',
  'Erbach': 'germany--erbach',
  'Halle': 'germany--halle',
  'Hamburg': 'germany--hamburg',
  'Hannover': 'germany--hannover',
  'Hassloch': 'germany--hassloch',
  'Honzrath': 'germany--honzrath',
  'Hoppegarten': 'germany--hoppegarten',
  'Köln': 'germany--koln',
  'Krefeld': 'germany--krefeld',
  'Leipzig': 'germany--leipzig',
  'Magdeburg': 'germany--magdeburg',
  'Mannheim': 'germany--mannheim',
  'Mülheim': 'germany--mulheim',
  'München': 'germany--munchen',
  'Quakenbrück': 'germany--quakenbruck',
  'Saarbrücken': 'germany--saarbrucken',
  'Zweibrücken': 'germany--zweibrucken',
});

const VENUES = Object.keys(VENUE_IDS).sort((a,b)=>b.length-a.length);

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/gi, 'ß')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function germanyVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveGermanyRacecourseId(label) {
  const normalized = String(label ?? '').trim();
  const id = VENUE_IDS[normalized];
  if (!id) throw new Error(`Unknown Deutscher Galopp venue: ${label}`);
  return id;
}

function pad(value) { return String(value).padStart(2, '0'); }

function isoFromGermanShortDate(value, yearHint = 2026) {
  const match = String(value ?? '').match(/^(\d{1,2})\.(\d{1,2})\.(?:(\d{2})|(\d{4}))$/);
  if (!match) return null;
  const year = match[4] ? Number(match[4]) : (match[3] ? 2000 + Number(match[3]) : yearHint);
  return `${year}-${pad(match[2])}-${pad(match[1])}`;
}

function normalizeDistance(value) {
  const match = String(value ?? '').replace(/\./g, '').match(/(\d{3,4})\s*m\b/i);
  return match ? Number(match[1]) : null;
}

function venueAtStart(text) {
  const value = String(text ?? '').trim();
  return VENUES.find((venue) => value === venue || value.startsWith(`${venue} `)) ?? null;
}

export function parseGermanyAnnualCalendarText(text, { year = 2026, sourceUrl = GERMANY_ANNUAL_PDF_URL } = {}) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Germany annual calendar text must be non-empty');
  if (!/RENNTERMINE\s+2026/i.test(text)) throw new Error('Deutscher Galopp annual calendar fingerprint missing');

  const records = [];
  const unknown_lines = [];
  let currentDate = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const dateMatch = line.match(/(?:^|\s)(\d{1,2}\.\d{1,2}\.)\s+/);
    if (dateMatch) {
      const [day, month] = dateMatch[1].split('.').filter(Boolean).map(Number);
      currentDate = `${year}-${pad(month)}-${pad(day)}`;
      const tail = line.slice((dateMatch.index ?? 0) + dateMatch[0].length).trim();
      const venue = venueAtStart(tail);
      if (venue) {
        records.push({
          date: currentDate,
          venue_label: venue,
          racecourse_id: resolveGermanyRacecourseId(venue),
          source_url: sourceUrl,
        });
      }
      continue;
    }

    if (currentDate) {
      const venue = venueAtStart(line);
      if (venue && line === venue) {
        records.push({
          date: currentDate,
          venue_label: venue,
          racecourse_id: resolveGermanyRacecourseId(venue),
          source_url: sourceUrl,
        });
      } else if (/^[A-ZÄÖÜ][\p{L}-]+$/u.test(line) && !/^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)$/u.test(line)) {
        unknown_lines.push(line);
      }
    }
  }

  const deduped = new Map();
  for (const row of records) deduped.set(`${row.date}/${row.racecourse_id}`, row);
  return {
    records:[...deduped.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),
    unknown_lines,
  };
}

function cellsFromRow(block) {
  return [...String(block).matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => germanyVisibleText(match[1]));
}

export function parseGermanyCalendarHtml(html, { sourceUrl = GERMANY_CALENDAR_URL } = {}) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('Germany calendar HTML must be non-empty');
  const visible = germanyVisibleText(html);
  if (!/Renntermine/i.test(visible)) throw new Error('Deutscher Galopp calendar fingerprint missing');

  const race_rows = [];
  const parse_failures = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = cellsFromRow(match[1]);
    if (cells.length < 5) continue;
    const date = isoFromGermanShortDate(cells[0]);
    const venue = String(cells[1] ?? '').trim();
    if (!date || !VENUE_IDS[venue]) continue;

    const raceNumber = Number.parseInt(String(cells[2] ?? ''), 10);
    if (!Number.isInteger(raceNumber) || raceNumber < 1) {
      parse_failures.push({code:'race_number_unparsed',date,venue_label:venue,cells});
      continue;
    }
    const start = /^\d{1,2}:\d{2}$/.test(String(cells[4] ?? '').trim()) ? String(cells[4]).trim().padStart(5,'0') : null;
    race_rows.push({
      date,
      venue_label: venue,
      racecourse_id: resolveGermanyRacecourseId(venue),
      race_number: raceNumber,
      race_name: String(cells[3] ?? '').trim() || null,
      post_time_local: start,
      distance_m: normalizeDistance(cells[5]),
      category: String(cells[6] ?? '').trim() || null,
      status: String(cells[9] ?? '').trim() || null,
      source_url: sourceUrl,
    });
  }

  return { race_rows, parse_failures };
}

function evidence(url, checkedAt) {
  return {
    source_id: GERMANY_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildGermanyMeetingRecord(scheduleRow, detailRows = [], { checkedAt } = {}) {
  const sorted = [...detailRows].sort((a,b)=>a.race_number-b.race_number);
  const timetable_rows = sorted.map((row)=>({
    label:`Race ${row.race_number}`,
    post_time_local:row.post_time_local,
    race_name:row.race_name,
    distance_m:row.distance_m,
  }));
  const timed = timetable_rows.filter((row)=>/^\d{2}:\d{2}$/.test(row.post_time_local ?? ''));
  const meetingId = `germany-deutscher-galopp-${scheduleRow.racecourse_id.replace(/^germany--/,'')}-${scheduleRow.date}`;
  const scheduleEvidence = evidence(scheduleRow.source_url ?? GERMANY_ANNUAL_PDF_URL, checkedAt);
  const detailUrl = sorted[0]?.source_url ?? GERMANY_CALENDAR_URL;

  const record = {
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'germany',
    authority_id:GERMANY_AUTHORITY_ID,
    racing_system_id:GERMANY_SYSTEM_ID,
    racecourse_id:scheduleRow.racecourse_id,
    date:scheduleRow.date,
    timezone:GERMANY_TIMEZONE,
    first_race_time_local:timed[0]?.post_time_local ?? null,
    last_race_time_local:timed.at(-1)?.post_time_local ?? null,
    timetable_rows,
    source:{
      source_id:GERMANY_SOURCE_ID,
      official_url:timed.length ? detailUrl : (scheduleRow.source_url ?? GERMANY_ANNUAL_PDF_URL),
      checked_at:checkedAt,
      extraction_method:timed.length ? 'official_deutscher_galopp_calendar_table' : 'official_deutscher_galopp_annual_calendar_pdf',
    },
    route_id:timed.length ? 'deutscher-galopp-calendar-table' : 'deutscher-galopp-annual-calendar-pdf',
    confidence:'high',
    review_status:'needs_review',
    notes:`Official Deutscher Galopp gallop observation for ${scheduleRow.venue_label}. Other German racing codes are outside this system scope.`,
    detail_observation:{
      status: sorted.length && timed.length === sorted.length ? 'available' : 'not_published',
      evaluated_capability_rank: sorted.length && timed.length === sorted.length ? 'A' : 'C',
      race_count:sorted.length,
      timed_race_count:timed.length,
      calendar_url:detailUrl,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:GERMANY_SOURCE_ID,
      route_id:'deutscher-galopp-calendar',
      error_code:null,
    },
    evidence_support:{
      meeting_identity:scheduleEvidence,
      meeting_date:scheduleEvidence,
    },
  };
  if (timed.length) {
    const detailEvidence=evidence(detailUrl,checkedAt);
    record.evidence_support.race_times=detailEvidence;
    if (timed.length===sorted.length) record.evidence_support.timetable=detailEvidence;
  }

  const capability_rank=deriveBestAvailableRank(record,timetable_rows);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'A'},
  );
  return {...record,capability_rank};
}
