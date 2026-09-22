import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const FRANCE_TIMEZONE = 'Europe/Paris';
export const FRANCE_FNCH_SOURCE_ID = 'fnch-national-calendar-directory';
export const FRANCE_FNCH_CALENDAR_URL = 'https://www.fnch.fr/calendrier';
export const FRANCE_GALOP_AUTHORITY_ID = 'france-galop';
export const FRANCE_GALOP_SYSTEM_ID = 'france-france-galop-system';
export const FRANCE_LETROT_AUTHORITY_ID = 'letrot';
export const FRANCE_LETROT_SYSTEM_ID = 'france-letrot-system';

export const FRANCE_FNCH_REGIONAL_PROGRAMME_URLS = Object.freeze([
  'https://www.fnch.fr/federation-anjou-maine/programme-des-courses',
  'https://www.fnch.fr/federation-basse-normandie/programme-des-courses',
  'https://www.fnch.fr/federation-centre-est/programme-des-courses',
  'https://www.fnch.fr/federation-corse/programme-des-courses',
  'https://www.fnch.fr/federation-est/programme',
  'https://www.fnch.fr/federation-ile-de-france-haute-normandie/programme-des-courses',
  'https://www.fnch.fr/federation-nord/programme-des-courses',
  'https://www.fnch.fr/federation-ouest/programme-des-courses',
  'https://www.fnch.fr/federation-sud-est/programmes-des-courses',
  'https://www.fnch.fr/federation-sud-ouest/programme-des-courses',
]);

const MONTHS = Object.freeze({
  jan: 1, janv: 1, january: 1,
  fev: 2, fevr: 2, feb: 2, february: 2,
  mar: 3, mars: 3, march: 3,
  avr: 4, apr: 4, april: 4,
  mai: 5, may: 5,
  juin: 6, jun: 6, june: 6,
  juil: 7, jul: 7, july: 7,
  aou: 8, aout: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
});

const VENUE_ID_ALIASES = Object.freeze({
  'angers-ecouflant': 'angers-racecourse',
  'la-teste-de-buch': 'la-teste-racecourse',
  'sable-sur-sarthe': 'sable-sur-sarthe-racecourse',
  'senonnes-pouance': 'senonnes-pouance-racecourse',
  'vichy-auvergne': 'vichy-racecourse',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&eacute;/gi, '\u00e9')
    .replace(/&egrave;/gi, '\u00e8')
    .replace(/&ecirc;/gi, '\u00ea')
    .replace(/&agrave;/gi, '\u00e0')
    .replace(/&acirc;/gi, '\u00e2')
    .replace(/&ocirc;/gi, '\u00f4')
    .replace(/&ucirc;/gi, '\u00fb')
    .replace(/&ugrave;/gi, '\u00f9')
    .replace(/&ccedil;/gi, '\u00e7')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function fnchVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalized(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugify(value) {
  return normalized(value)
    .replace(/[\u2018\u2019']/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

export function resolveFranceRacecourseId(label) {
  const stripped = String(label ?? '').replace(/^Hippodrome\s+/i, '').trim();
  const slug = slugify(stripped);
  return VENUE_ID_ALIASES[slug] ?? `${slug}-racecourse`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseMonth(token) {
  const key = slugify(token).replace(/-/g, '');
  return MONTHS[key] ?? null;
}

function isoDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(decodeHtml(href), baseUrl).toString();
  } catch {
    return null;
  }
}

function programmeHref(block, baseUrl) {
  for (const match of String(block).matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1] ?? match[2] ?? match[3] ?? '';
    const label = fnchVisibleText(match[4]);
    if (/telecharger\s+le\s+programme/i.test(normalized(label))
      || (/programme/i.test(label) && /\.pdf(?:$|[?#])/i.test(href))) {
      return absoluteUrl(href, baseUrl);
    }
  }
  return null;
}

function systemDefsFromDisciplineText(value) {
  const text = normalized(value);
  const defs = [];
  if (/\btrot\b/.test(text)) {
    defs.push({
      key: 'letrot',
      authority_id: FRANCE_LETROT_AUTHORITY_ID,
      racing_system_id: FRANCE_LETROT_SYSTEM_ID,
    });
  }
  if (/\b(galop|plat|obstacle)\b/.test(text)) {
    defs.push({
      key: 'galop',
      authority_id: FRANCE_GALOP_AUTHORITY_ID,
      racing_system_id: FRANCE_GALOP_SYSTEM_ID,
    });
  }
  return defs;
}

export function parseFnchRegionalProgrammePage(html, { sourceUrl } = {}) {
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('FNCH regional programme HTML must be non-empty');
  }
  if (!/programme/i.test(fnchVisibleText(html))) {
    throw new Error('FNCH programme fingerprint missing');
  }

  const starts = [...html.matchAll(/<h[1-4]\b[^>]*>[\s\S]*?Hippodrome[\s\S]*?<\/h[1-4]>/gi)];
  const records = [];
  const unknown_disciplines = [];
  const parse_failures = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index].index ?? 0;
    const end = index + 1 < starts.length ? (starts[index + 1].index ?? html.length) : html.length;
    const block = html.slice(start, end);
    const text = fnchVisibleText(block);

    const venue = text.match(/^Hippodrome\s+(.+?)\s+R(?:e|\u00e9)union\b/i)?.[1]?.trim() ?? null;
    const dateMatch = text.match(/\b(\d{1,2})\s+([\p{L}.]+)\s+(20\d{2})\s+(?:A|\u00c0)\s+(\d{1,2})h(\d{2})\b/iu);

    if (!venue || !dateMatch) {
      parse_failures.push({ code: 'meeting_header_unparsed', source_text: text.slice(0, 220) });
      continue;
    }

    const month = parseMonth(dateMatch[2]);
    if (!month) {
      parse_failures.push({
        code: 'month_unparsed',
        venue_label: venue,
        month_token: dateMatch[2],
      });
      continue;
    }

    const disciplineText = (
      text.match(/Discipline\s+(.+?)(?:T(?:e|\u00e9)l(?:e|\u00e9)charger\s+le\s+programme|$)/i)?.[1] ?? ''
    ).trim();
    const systemDefs = systemDefsFromDisciplineText(disciplineText);
    const date = isoDate(Number(dateMatch[3]), month, Number(dateMatch[1]));

    if (!systemDefs.length) {
      unknown_disciplines.push({
        venue_label: venue,
        discipline_text: disciplineText,
        date,
      });
      continue;
    }

    const scheduled_start_local = `${pad(dateMatch[4])}:${dateMatch[5]}`;
    const programme_url = programmeHref(block, sourceUrl);

    for (const def of systemDefs) {
      records.push({
        system_key: def.key,
        authority_id: def.authority_id,
        racing_system_id: def.racing_system_id,
        date,
        venue_label: venue,
        racecourse_id: resolveFranceRacecourseId(venue),
        scheduled_start_local,
        discipline_text: disciplineText,
        programme_url,
        source_url: sourceUrl,
      });
    }
  }

  return { records, unknown_disciplines, parse_failures };
}

export function parseFnchProgrammeText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('FNCH programme text must be non-empty');
  }

  const ascii = normalized(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2010\u2011\u2013\u2014]/g, '-');

  const regex = /(\d{1,2})(?:\s*(?:e|er|re|ere|eme))?\s*course\s*[-:]*\s*depart\s*:\s*(\d{1,2})\s*h\.?\s*(\d{2})/gi;
  const byNumber = new Map();

  for (const match of ascii.matchAll(regex)) {
    const number = Number(match[1]);
    const hour = Number(match[2]);
    const minute = Number(match[3]);
    if (hour > 23 || minute > 59) continue;
    if (!byNumber.has(number)) {
      byNumber.set(number, {
        number,
        label: `Race ${number}`,
        post_time_local: `${pad(hour)}:${pad(minute)}`,
      });
    }
  }

  const rows = [...byNumber.values()].sort((a, b) => a.number - b.number);
  if (!rows.length) return [];
  if (rows.some((row, index) => row.number !== index + 1)) {
    throw new Error('FNCH programme race rows are not continuous from Race 1');
  }
  if (rows.some((row, index) => index > 0 && row.post_time_local <= rows[index - 1].post_time_local)) {
    throw new Error('FNCH programme post times are not strictly increasing');
  }
  return rows.map(({ number, ...row }) => row);
}

function evidence(url, checkedAt) {
  return {
    source_id: FRANCE_FNCH_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

function baseRecord(row, checkedAt) {
  const prefix = row.system_key === 'galop' ? 'france-galop' : 'france-letrot';
  const meetingId = `${prefix}-${row.racecourse_id}-${row.date}`;

  return {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'france',
    authority_id: row.authority_id,
    racing_system_id: row.racing_system_id,
    racecourse_id: row.racecourse_id,
    date: row.date,
    timezone: FRANCE_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: FRANCE_FNCH_SOURCE_ID,
      official_url: row.source_url,
      checked_at: checkedAt,
      extraction_method: 'official_fnch_regional_programme_index',
    },
    route_id: 'fnch-regional-programme-index',
    confidence: 'high',
    review_status: 'needs_review',
    notes: `Official FNCH regional programme observation; source venue label: ${row.venue_label}; discipline: ${row.discipline_text}.`,
  };
}

export function buildFnchFixtureRecord(
  row,
  {
    checkedAt,
    detailStatus = 'not_published',
    attemptStatus = 'pending_publication',
    errorCode = null,
  } = {},
) {
  const record = baseRecord(row, checkedAt);
  record.detail_observation = {
    status: detailStatus,
    evaluated_capability_rank: 'A',
    race_count: 0,
    programme_url: row.programme_url,
  };
  record.acquisition_attempt = {
    attempted_at: checkedAt,
    status: attemptStatus,
    source_id: FRANCE_FNCH_SOURCE_ID,
    route_id: 'fnch-regional-programme-pdf',
    error_code: errorCode,
  };

  const meetingEvidence = evidence(row.source_url, checkedAt);
  record.evidence_support = {
    meeting_identity: meetingEvidence,
    meeting_date: meetingEvidence,
  };

  const capability_rank = deriveBestAvailableRank(record, []);
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'A' },
  );

  return { ...record, capability_rank };
}

export function buildFnchProgrammeRecord(row, { checkedAt, programmeText } = {}) {
  const rows = parseFnchProgrammeText(programmeText);
  if (!rows.length) {
    return buildFnchFixtureRecord(row, {
      checkedAt,
      detailStatus: 'parser_failure',
      attemptStatus: 'parser_failure',
      errorCode: 'race_times_not_parsed',
    });
  }

  const record = baseRecord(row, checkedAt);
  record.first_race_time_local = rows[0].post_time_local;
  record.last_race_time_local = rows.at(-1).post_time_local;
  record.timetable_rows = rows;
  record.source = {
    source_id: FRANCE_FNCH_SOURCE_ID,
    official_url: row.programme_url,
    checked_at: checkedAt,
    extraction_method: 'official_fnch_programme_pdf',
  };
  record.route_id = 'fnch-regional-programme-pdf';
  record.detail_observation = {
    status: 'available',
    evaluated_capability_rank: 'A',
    race_count: rows.length,
    programme_url: row.programme_url,
  };
  record.acquisition_attempt = {
    attempted_at: checkedAt,
    status: 'success',
    source_id: FRANCE_FNCH_SOURCE_ID,
    route_id: 'fnch-regional-programme-pdf',
    error_code: null,
  };

  const meetingEvidence = evidence(row.source_url, checkedAt);
  const detailEvidence = evidence(row.programme_url, checkedAt);
  record.evidence_support = {
    meeting_identity: meetingEvidence,
    meeting_date: meetingEvidence,
    race_times: detailEvidence,
    timetable: detailEvidence,
  };

  const capability_rank = deriveBestAvailableRank(record, rows);
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'A' },
  );

  return { ...record, capability_rank };
}
