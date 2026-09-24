import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SPAIN_TIMEZONE = 'Europe/Madrid';
export const SPAIN_AUTHORITY_ID = 'hipodromo-zarzuela';
export const SPAIN_SYSTEM_ID = 'spain-reviewed-gallop-system';
export const SPAIN_SOURCE_ID = 'zarzuela-programme-2026';
export const SPAIN_RACECOURSE_ID = 'spain--hipodromo-de-la-zarzuela';
export const SPAIN_HOME_URL = 'https://www.hipodromodelazarzuela.es/carreras';
export const SPAIN_AUTUMN_PDF_URL = 'https://www.hipodromodelazarzuela.es/sites/default/files/PROGRAMA%20OTO%C3%91O%20HZ%202026%20v6%20SN.pdf';

const MONTHS = Object.freeze({
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function zarzuelaVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pad(value) { return String(value).padStart(2, '0'); }

export function zarzuelaMeetingUrl(date) {
  return `https://www.hipodromodelazarzuela.es/carreras/jornada/${String(date).replaceAll('-', '')}`;
}

export function parseZarzuelaAutumnProgrammeText(text, { year = 2026, sourceUrl = SPAIN_AUTUMN_PDF_URL } = {}) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Zarzuela autumn programme text must be non-empty');
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!/HIP[ÓO]DROMO DE LA ZARZUELA/i.test(normalized) || !/PROGRAMA DE LAS CARRERAS/i.test(normalized)) {
    throw new Error('Zarzuela official programme fingerprint missing');
  }

  const records = [];
  for (const match of normalized.matchAll(/([0-9,\sy]+)\s+de\s+(septiembre|octubre|noviembre)/gi)) {
    const month = MONTHS[match[2].toLowerCase()];
    if (!month) continue;
    const days = [...match[1].matchAll(/\d{1,2}/g)].map((item) => Number(item[0]));
    for (const day of days) {
      if (day < 1 || day > 31) continue;
      records.push({
        date: `${year}-${pad(month)}-${pad(day)}`,
        venue_label: 'Hipódromo de la Zarzuela',
        racecourse_id: SPAIN_RACECOURSE_ID,
        source_url: sourceUrl,
      });
    }
  }

  const deduped = new Map();
  for (const row of records) deduped.set(row.date, row);
  if (!deduped.size) throw new Error('Zarzuela official programme dates not parsed');
  return [...deduped.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function cellsFromRow(block) {
  return [...String(block).matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) => zarzuelaVisibleText(match[1]));
}

function parseDistance(value) {
  const match = String(value ?? '').replace(/\./g, '').match(/Dist\.?\s*:?\s*(\d{3,4})/i);
  return match ? Number(match[1]) : null;
}

export function parseZarzuelaMeetingHtml(html, { date, sourceUrl } = {}) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('Zarzuela meeting HTML must be non-empty');
  const visible = zarzuelaVisibleText(html);
  if (!/Carreras de la Jornada/i.test(visible)) {
    return { race_rows: [], status: 'not_published', parse_failures: [] };
  }

  const race_rows = [];
  const parse_failures = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = cellsFromRow(match[1]);
    if (cells.length < 4) continue;
    const timeCell = cells.find((cell) => /Hora\s*:/i.test(cell)) ?? '';
    const raceCell = cells.find((cell) => /Carrera\s*:/i.test(cell)) ?? '';
    const timeMatch = timeCell.match(/Hora\s*:\s*(\d{1,2}:\d{2})/i);
    const raceMatch = raceCell.match(/Carrera\s*:\s*(\d+)/i);
    if (!raceMatch) continue;
    const race_number = Number(raceMatch[1]);
    const post_time_local = timeMatch ? timeMatch[1].padStart(5, '0') : null;
    race_rows.push({
      date,
      racecourse_id: SPAIN_RACECOURSE_ID,
      race_number,
      race_name: cells[0] || null,
      post_time_local,
      distance_m: parseDistance(cells.find((cell) => /Dist\.?\s*:/i.test(cell))),
      source_url: sourceUrl,
    });
  }

  const unique = new Map();
  for (const row of race_rows) unique.set(row.race_number, row);
  const rows = [...unique.values()].sort((a, b) => a.race_number - b.race_number);
  if (rows.some((row, index) => row.race_number !== index + 1)) {
    parse_failures.push({ code: 'race_number_gap', date, race_numbers: rows.map((row) => row.race_number) });
  }
  return {
    race_rows: rows,
    status: rows.length ? (rows.every((row) => row.post_time_local) ? 'available' : 'not_published') : 'not_published',
    parse_failures,
  };
}

function evidence(url, checkedAt) {
  return {
    source_id: SPAIN_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildZarzuelaMeetingRecord(scheduleRow, detailRows = [], { checkedAt, detailStatus = null, detailUrl = null } = {}) {
  const sorted = [...detailRows].sort((a, b) => a.race_number - b.race_number);
  const timetable_rows = sorted.map((row) => ({
    label: `Race ${row.race_number}`,
    post_time_local: row.post_time_local,
    race_name: row.race_name,
    distance_m: row.distance_m,
  }));
  const allTimed = sorted.length > 0 && sorted.every((row) => /^\d{2}:\d{2}$/.test(row.post_time_local ?? ''));
  const allContinuous = sorted.every((row, index) => row.race_number === index + 1);
  const meetingId = `spain-zarzuela-${scheduleRow.date}`;
  const scheduleEvidence = evidence(scheduleRow.source_url ?? SPAIN_AUTUMN_PDF_URL, checkedAt);
  const resolvedDetailUrl = detailUrl ?? zarzuelaMeetingUrl(scheduleRow.date);

  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'spain',
    authority_id: SPAIN_AUTHORITY_ID,
    racing_system_id: SPAIN_SYSTEM_ID,
    racecourse_id: SPAIN_RACECOURSE_ID,
    date: scheduleRow.date,
    timezone: SPAIN_TIMEZONE,
    first_race_time_local: allTimed && allContinuous ? sorted[0].post_time_local : null,
    last_race_time_local: allTimed && allContinuous ? sorted.at(-1).post_time_local : null,
    timetable_rows: allTimed && allContinuous ? timetable_rows : [],
    source: {
      source_id: SPAIN_SOURCE_ID,
      official_url: allTimed && allContinuous ? resolvedDetailUrl : (scheduleRow.source_url ?? SPAIN_AUTUMN_PDF_URL),
      checked_at: checkedAt,
      extraction_method: allTimed && allContinuous ? 'official_zarzuela_meeting_page' : 'official_zarzuela_autumn_programme_pdf',
    },
    route_id: allTimed && allContinuous ? 'zarzuela-meeting-page' : 'zarzuela-autumn-programme-pdf',
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'Official Hipódromo de la Zarzuela gallop observation. Wider Spanish horse-racing code and venue coverage remains outside this bounded subsystem.',
    detail_observation: {
      status: detailStatus ?? (allTimed && allContinuous ? 'available' : 'not_published'),
      evaluated_capability_rank: allTimed && allContinuous ? 'A' : 'C',
      race_count: sorted.length,
      timed_race_count: sorted.filter((row) => row.post_time_local).length,
      meeting_url: resolvedDetailUrl,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: SPAIN_SOURCE_ID,
      route_id: 'zarzuela-autumn-programme-plus-meeting-page',
      error_code: null,
    },
    evidence_support: {
      meeting_identity: scheduleEvidence,
      meeting_date: scheduleEvidence,
    },
  };

  if (allTimed && allContinuous) {
    const detailEvidence = evidence(resolvedDetailUrl, checkedAt);
    record.evidence_support.race_times = detailEvidence;
    record.evidence_support.timetable = detailEvidence;
  }

  const capability_rank = deriveBestAvailableRank(record, record.timetable_rows);
  if (record.detail_observation.status === 'available') {
    record.detail_observation.evaluated_capability_rank = capability_rank;
  }
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'A' },
  );
  return { ...record, capability_rank };
}
