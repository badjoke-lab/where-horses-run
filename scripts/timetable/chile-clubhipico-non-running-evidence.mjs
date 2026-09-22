export const CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL =
  'https://www.clubhipico.cl/sala-prensa/categoria/corporativo/';

export const CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID =
  'chile-club-hipico-santiago-explicit-non-running';

export const CHILE_CLUB_HIPICO_RACECOURSE_ID = 'club-hipico-de-santiago-racecourse';

const MONTHS = Object.freeze({
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
});

const MONTH_PATTERN = Object.keys(MONTHS).join('|');

function decodeEntities(value) {
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

function htmlToText(html) {
  return decodeEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(?:p|div|li|article|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isoDate(year, month, day) {
  const value = String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function dateFromMatch(match) {
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTHS[fold(match[2])];
  const year = Number(match[3]);
  if (!month) return null;
  return isoDate(year, month, day);
}

function assertOfficialHost(url) {
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || !['clubhipico.cl', 'www.clubhipico.cl'].includes(hostname)) {
    throw new Error('Chile Club Hipico non-running evidence requires an official clubhipico.cl source');
  }
}

function assertArchiveSource(sourceUrl) {
  const url = new URL(sourceUrl);
  assertOfficialHost(url);
  if (url.pathname.replace(/\/+$/, '') !== '/sala-prensa/categoria/corporativo') {
    throw new Error('Chile Club Hipico discovery requires the official Corporativo archive route');
  }
}

function assertArticleSource(sourceUrl) {
  const url = new URL(sourceUrl);
  assertOfficialHost(url);
  if (!url.pathname.startsWith('/sala-prensa/noticias/')) {
    throw new Error('Chile Club Hipico evidence requires an official news article route');
  }
}

function articleContext(source, index) {
  return htmlToText(source.slice(Math.max(0, index - 1800), Math.min(source.length, index + 1200)));
}

export function discoverChileClubHipicoNonRunningArticles(html, {
  sourceUrl = CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
  maxCandidates = 24,
} = {}) {
  assertArchiveSource(sourceUrl);
  const source = String(html ?? '');
  const visible = fold(htmlToText(source));
  if (!visible.includes('noticias de corporativo') || !visible.includes('club hipico')) {
    throw new Error('Chile Club Hipico Corporativo archive fingerprint missing');
  }

  const urls = new Map();
  const hrefPattern = /href\s*=\s*(["'])([^"']*\/sala-prensa\/noticias\/[^"']+)\1/gi;
  for (const match of source.matchAll(hrefPattern)) {
    let url;
    try {
      url = new URL(decodeEntities(match[2]), sourceUrl);
      assertArticleSource(url.toString());
    } catch {
      continue;
    }

    const slug = fold(url.pathname);
    if (!/(suspens|posterg|recalendar|anul|cancel)/i.test(slug)) continue;
    const context = articleContext(source, match.index ?? 0);
    if (!urls.has(url.toString())) {
      urls.set(url.toString(), context.slice(0, 1200));
    }
    if (urls.size >= maxCandidates) break;
  }

  return {
    article_urls: [...urls.keys()],
    candidates: [...urls].map(([url, context]) => ({ url, context })),
  };
}

function partialRaceScope(normalized) {
  const patterns = [
    /\ba partir de la\s+\d+(?:ma|a|ra|da)?\s+carrera\b/i,
    /\bdesde la\s+\d+(?:ma|a|ra|da)?\s+carrera\b/i,
    /\b(?:ultimas|primeras)\s+(?:\w+\s+){0,2}(?:competencias|carreras)\b/i,
    /\b(?:anulacion|suspension|cancelacion)\s+de\s+las?\s+(?:ultimas|primeras)\b/i,
    /\b(?:primeras?|ultimas?)\s+\d+\s+(?:competencias|carreras)\b/i,
    /\b(?:se\s+disputaron|se\s+corrieron|realizo)\s+(?:las\s+)?(?:primeras?\s+)?\d+\s+(?:competencias|carreras)\b/i,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

function wholeMeetingSemantics(normalized) {
  const patterns = [
    /\b(?:suspension|postergacion|cancelacion|anulacion)\b[\s\S]{0,180}\b(?:jornada|reunion)(?:\s+de\s+carreras)?\b/i,
    /\b(?:jornada|reunion)(?:\s+de\s+carreras)?\b[\s\S]{0,180}\b(?:suspendid[ao]|postergad[ao]|cancelad[ao]|anulad[ao])\b/i,
    /\brecalendarizacion\b[\s\S]{0,260}\b(?:jornada|reunion)\b[\s\S]{0,220}\b(?:suspendid[ao]|programad[ao])\b/i,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

function originalMeetingDate(normalized) {
  const patterns = [
    new RegExp(
      '\\b(?:jornada|reunion)(?:\\s+de\\s+carreras)?[\\s\\S]{0,220}?\\b(?:programad[ao]|agendad[ao])\\b[\\s\\S]{0,120}?\\b(?:para|el)\\b[\\s\\S]{0,80}?(\\d{1,2})\\s+de\\s+('
        + MONTH_PATTERN + ')\\s+(?:de\\s+)?(20\\d{2})',
      'i',
    ),
    new RegExp(
      '\\b(?:suspension|postergacion|cancelacion|anulacion)\\b[\\s\\S]{0,160}?\\b(?:jornada|reunion)(?:\\s+de\\s+carreras)?\\b[\\s\\S]{0,120}?\\b(?:del|para|correspondiente\\s+a)\\b[\\s\\S]{0,60}?(\\d{1,2})\\s+de\\s+('
        + MONTH_PATTERN + ')\\s+(?:de\\s+)?(20\\d{2})',
      'i',
    ),
  ];

  for (const pattern of patterns) {
    const date = dateFromMatch(normalized.match(pattern));
    if (date) return date;
  }
  return null;
}

function replacementMeetingDate(normalized, originalDate) {
  const marker = normalized.indexOf('nueva fecha');
  if (marker < 0) return null;

  const tail = normalized.slice(marker, marker + 900);
  const datePattern = new RegExp(
    '(\\d{1,2})\\s+de\\s+(' + MONTH_PATTERN + ')\\s+(?:de\\s+)?(20\\d{2})',
    'gi',
  );
  const candidates = [];
  for (const match of tail.matchAll(datePattern)) {
    const date = dateFromMatch(match);
    if (date && (!originalDate || date > originalDate)) candidates.push(date);
  }
  candidates.sort();
  return candidates[0] ?? null;
}

function evidencePhrase(text, normalized) {
  const needles = ['postergacion', 'suspension', 'recalendarizacion', 'cancelacion', 'anulacion'];
  let position = -1;
  for (const needle of needles) {
    const index = normalized.indexOf(needle);
    if (index >= 0 && (position < 0 || index < position)) position = index;
  }
  if (position < 0) return text.slice(0, 600);
  return text.slice(Math.max(0, position - 120), Math.min(text.length, position + 700)).trim();
}

export function parseChileClubHipicoNonRunningArticle(html, {
  sourceUrl,
  startDate = null,
  endDateExclusive = null,
} = {}) {
  if (!sourceUrl) throw new Error('Chile Club Hipico article sourceUrl is required');
  assertArticleSource(sourceUrl);
  const text = htmlToText(html);
  const normalized = fold(text);
  if (!normalized.includes('club hipico de santiago')) {
    throw new Error('Chile Club Hipico article fingerprint missing authority name');
  }

  if (partialRaceScope(normalized)) {
    return {
      evidence: [],
      diagnostics: { disposition: 'rejected_partial_race_scope' },
    };
  }

  if (!wholeMeetingSemantics(normalized)) {
    return {
      evidence: [],
      diagnostics: { disposition: 'not_explicit_whole_meeting_non_running' },
    };
  }

  const date = originalMeetingDate(normalized);
  if (!date) {
    return {
      evidence: [],
      diagnostics: { disposition: 'original_meeting_date_unresolved' },
    };
  }
  if (startDate && date < startDate) {
    return { evidence: [], diagnostics: { disposition: 'outside_window', date } };
  }
  if (endDateExclusive && date >= endDateExclusive) {
    return { evidence: [], diagnostics: { disposition: 'outside_window', date } };
  }

  const replacementDate = replacementMeetingDate(normalized, date);
  return {
    evidence: [{
      date,
      replacement_date: replacementDate,
      source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
      official_source_url: sourceUrl,
      evidence_phrase: evidencePhrase(text, normalized),
    }],
    diagnostics: {
      disposition: 'accepted_whole_meeting_non_running',
      date,
      replacement_date: replacementDate,
    },
  };
}

function isClubHipicoSantiagoCanonicalMeeting(row) {
  return row?.country_id === 'chile'
    && row?.authority_id === 'teletrak-chile'
    && row?.racing_system_id === 'chile-teletrak-racing-system'
    && row?.racecourse_id === CHILE_CLUB_HIPICO_RACECOURSE_ID;
}

function dedupeEvidence(evidence) {
  const selected = new Map();
  for (const item of evidence) {
    if (!item?.date) continue;
    const previous = selected.get(item.date);
    if (!previous || (!previous.replacement_date && item.replacement_date)) {
      selected.set(item.date, item);
    }
  }
  return [...selected.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function bindChileClubHipicoNonRunningEvidence({
  evidence,
  canonicalMeetings,
  checkedAt = new Date().toISOString(),
}) {
  if (!Array.isArray(evidence)) throw new Error('Chile Club Hipico evidence must be an array');
  if (!Array.isArray(canonicalMeetings)) throw new Error('Chile Club Hipico canonicalMeetings must be an array');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('Chile Club Hipico checkedAt must be an ISO date-time');

  const meetingPresenceRecords = [];
  const skipped = [];
  for (const item of dedupeEvidence(evidence)) {
    const matches = canonicalMeetings.filter(
      (row) => isClubHipicoSantiagoCanonicalMeeting(row) && row.date === item.date,
    );
    const unique = [...new Map(matches.map((row) => [row.meeting_id, row])).values()];
    if (unique.length !== 1) {
      skipped.push({
        date: item.date,
        replacement_date: item.replacement_date ?? null,
        reason: unique.length === 0 ? 'canonical_binding_missing' : 'canonical_binding_ambiguous',
        match_count: unique.length,
      });
      continue;
    }

    const meeting = unique[0];
    const expectedMeetingId = 'chile-' + CHILE_CLUB_HIPICO_RACECOURSE_ID + '-' + item.date;
    if (meeting.meeting_id !== expectedMeetingId) {
      skipped.push({
        date: item.date,
        reason: 'canonical_meeting_id_mismatch',
        meeting_id: meeting.meeting_id,
        expected_meeting_id: expectedMeetingId,
      });
      continue;
    }

    meetingPresenceRecords.push({
      meeting_id: meeting.meeting_id,
      country_id: 'chile',
      authority_id: 'teletrak-chile',
      racecourse_id: CHILE_CLUB_HIPICO_RACECOURSE_ID,
      date: item.date,
      state: 'confirmed_non_running',
      scope: 'whole_meeting',
      evidence_type: 'official_explicit_non_running',
      source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
      official_source_url: item.official_source_url,
      checked_at: checked.toISOString(),
      evidence_phrase: item.evidence_phrase,
    });
  }

  return {
    meeting_presence_records: meetingPresenceRecords,
    diagnostics: { skipped },
  };
}
