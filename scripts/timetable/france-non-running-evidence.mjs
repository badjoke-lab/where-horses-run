import { resolveFranceRacecourseId } from './france-fnch-core.mjs';

export const FRANCE_GALOP_NON_RUNNING_SOURCE_ID = 'france-galop-explicit-non-running';
export const FRANCE_GALOP_NON_RUNNING_ARCHIVE_URL = 'https://www.france-galop.com/fr/hippodromes';
export const FRANCE_LETROT_NON_RUNNING_SOURCE_ID = 'letrot-setf-bulletin-explicit-non-running';
export const FRANCE_LETROT_BULLETIN_ENDPOINT =
  'https://pro.letrot.com/siteletrotws-LMeiJS3SZYjkmC1qpyBvHCsYjfwGkj/publication';

const MONTHS = Object.freeze({
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
});
const MONTH_PATTERN = Object.keys(MONTHS).join('|');
const WEEKDAY_PATTERN = '(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)';

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;/gi, "'")
    .replace(/&eacute;/gi, 'é').replace(/&egrave;/gi, 'è').replace(/&ecirc;/gi, 'ê')
    .replace(/&agrave;/gi, 'à').replace(/&acirc;/gi, 'â').replace(/&ocirc;/gi, 'ô')
    .replace(/&ucirc;/gi, 'û').replace(/&ugrave;/gi, 'ù').replace(/&ccedil;/gi, 'ç')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function htmlToText(value) {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(?:p|div|li|article|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'").toLowerCase();
}
function normalizedText(value) { return fold(value).replace(/\s+/g, ' ').trim(); }

function isoDate(year, month, day) {
  const value = String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}
function dateFromParts(day, monthToken, year) {
  const month = MONTHS[fold(monthToken)];
  return month ? isoDate(Number(year), month, Number(day)) : null;
}
function inWindow(date, startDate, endDateExclusive) {
  return (!startDate || date >= startDate) && (!endDateExclusive || date < endDateExclusive);
}

function assertFranceGalopUrl(sourceUrl, options = {}) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || !['france-galop.com', 'www.france-galop.com'].includes(url.hostname.toLowerCase())) {
    throw new Error('France Galop non-running evidence requires an official france-galop.com source');
  }
  if (options.archive) {
    if (url.pathname.replace(/\/+$/, '') !== '/fr/hippodromes') {
      throw new Error('France Galop discovery requires the official Hippodromes archive');
    }
  } else if (!url.pathname.startsWith('/fr/content/')) {
    throw new Error('France Galop evidence requires an official content article');
  }
}
function assertLetrotBulletinUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'pro.letrot.com') {
    throw new Error('LeTROT non-running evidence requires official pro.letrot.com');
  }
  if (!url.pathname.endsWith('/publication') || url.searchParams.get('type') !== 'BULLETIN') {
    throw new Error('LeTROT non-running evidence requires the official BULLETIN publication route');
  }
}

export function discoverFranceGalopNonRunningArticles(html, options = {}) {
  const sourceUrl = options.sourceUrl ?? FRANCE_GALOP_NON_RUNNING_ARCHIVE_URL;
  const maxCandidates = options.maxCandidates ?? 60;
  assertFranceGalopUrl(sourceUrl, { archive: true });
  const visible = normalizedText(htmlToText(html));
  if (!visible.includes('france galop') || !visible.includes('hippodromes')) {
    throw new Error('France Galop Hippodromes archive fingerprint missing');
  }
  const found = new Map();
  for (const match of String(html ?? '').matchAll(/href\s*=\s*(["'])([^"']*\/fr\/content\/[^"']+)\1/gi)) {
    let url;
    try {
      url = new URL(decodeHtml(match[2]), sourceUrl);
      assertFranceGalopUrl(url.toString());
    } catch {
      continue;
    }
    if (!/(annul|transfert|report)/.test(fold(url.pathname))) continue;
    if (!found.has(url.toString())) {
      const context = htmlToText(String(html).slice(Math.max(0, (match.index ?? 0) - 1000), (match.index ?? 0) + 700));
      found.set(url.toString(), context.slice(0, 1200));
    }
    if (found.size >= maxCandidates) break;
  }
  return {
    article_urls: [...found.keys()],
    candidates: [...found].map(([url, context]) => ({ url, context })),
  };
}

function franceGalopPartialRaceScope(normalized) {
  return [
    /\b(?:deux|trois|quatre|cinq|six|sept|huit|neuf|dix|\d+)\s+(?:epreuves|courses)\b[\s\S]{0,80}\b(?:annulees|reportees)\b/,
    /\b(?:epreuves|courses)\s+annulees\b[\s\S]{0,160}\breprogramm/,
    /\barret de la reunion\b[\s\S]{0,220}\b(?:epreuves|courses)\s+non courues\b/,
  ].some((pattern) => pattern.test(normalized));
}

function evidencePhrase(text, needles) {
  const normalized = normalizedText(text);
  let position = -1;
  for (const needle of needles) {
    const index = normalized.indexOf(needle);
    if (index >= 0 && (position < 0 || index < position)) position = index;
  }
  if (position < 0) return text.slice(0, 700);
  return text.slice(Math.max(0, position - 150), Math.min(text.length, position + 900)).trim();
}

export function parseFranceGalopNonRunningArticle(html, options = {}) {
  const sourceUrl = options.sourceUrl;
  const startDate = options.startDate ?? null;
  const endDateExclusive = options.endDateExclusive ?? null;
  if (!sourceUrl) throw new Error('France Galop article sourceUrl is required');
  assertFranceGalopUrl(sourceUrl);
  const text = htmlToText(html);
  const normalized = normalizedText(text);
  if (!normalized.includes('france galop')) throw new Error('France Galop article fingerprint missing authority name');
  if (franceGalopPartialRaceScope(normalized)) {
    return { evidence: [], diagnostics: { disposition: 'rejected_partial_race_scope' } };
  }

  const transferPattern = new RegExp(
    "\\bla reunion du\\s+(?:" + WEEKDAY_PATTERN + "\\s+)?(\\d{1,2})\\s+(" + MONTH_PATTERN + ")\\s+(20\\d{2}),?\\s+initialement prevue sur l'hippodrome de\\s+(.+?),\\s+est transferee sur l'hippodrome de\\s+(.+?)(?:\\.|,|\\s+afin\\b)",
    'i',
  );
  const transfer = normalized.match(transferPattern);
  if (transfer) {
    const date = dateFromParts(transfer[1], transfer[2], transfer[3]);
    if (!date) return { evidence: [], diagnostics: { disposition: 'original_meeting_date_unresolved' } };
    if (!inWindow(date, startDate, endDateExclusive)) return { evidence: [], diagnostics: { disposition: 'outside_window', date } };
    const venueLabel = transfer[4].trim();
    const replacementVenueLabel = transfer[5].trim();
    return {
      evidence: [{
        authority_id: 'france-galop',
        racing_system_id: 'france-france-galop-system',
        meeting_prefix: 'france-galop',
        date,
        venue_label: venueLabel,
        racecourse_id: resolveFranceRacecourseId(venueLabel),
        replacement_venue_label: replacementVenueLabel,
        replacement_racecourse_id: resolveFranceRacecourseId(replacementVenueLabel),
        replacement_date: date,
        source_id: FRANCE_GALOP_NON_RUNNING_SOURCE_ID,
        official_source_url: sourceUrl,
        evidence_phrase: evidencePhrase(text, ['transfert de la reunion', 'est transferee']),
      }],
      diagnostics: { disposition: 'accepted_whole_meeting_transfer', date, venue_label: venueLabel, replacement_venue_label: replacementVenueLabel },
    };
  }

  const pluralPattern = new RegExp(
    "\\bles reunions du\\s+(?:" + WEEKDAY_PATTERN + "\\s+)?(\\d{1,2})\\s+(" + MONTH_PATTERN + ")\\s+(20\\d{2})\\s+programmees a\\s+(.+?)\\s+sont annulees\\b",
    'i',
  );
  const plural = normalized.match(pluralPattern);
  if (plural) {
    const date = dateFromParts(plural[1], plural[2], plural[3]);
    if (!date) return { evidence: [], diagnostics: { disposition: 'original_meeting_date_unresolved' } };
    if (!inWindow(date, startDate, endDateExclusive)) return { evidence: [], diagnostics: { disposition: 'outside_window', date } };
    const venues = plural[4].split(/\s+et\s+a\s+|\s*,\s*a\s+|\s*,\s*/i)
      .map((value) => value.replace(/^a\s+/i, '').trim()).filter(Boolean);
    const unique = [...new Set(venues)];
    if (!unique.length || unique.length > 6) return { evidence: [], diagnostics: { disposition: 'whole_meeting_venues_unresolved', date } };
    return {
      evidence: unique.map((venueLabel) => ({
        authority_id: 'france-galop',
        racing_system_id: 'france-france-galop-system',
        meeting_prefix: 'france-galop',
        date,
        venue_label: venueLabel,
        racecourse_id: resolveFranceRacecourseId(venueLabel),
        replacement_date: null,
        source_id: FRANCE_GALOP_NON_RUNNING_SOURCE_ID,
        official_source_url: sourceUrl,
        evidence_phrase: evidencePhrase(text, ['annulation des reunions', 'sont annulees']),
      })),
      diagnostics: { disposition: 'accepted_whole_meeting_cancellation', date, venue_labels: unique },
    };
  }

  return { evidence: [], diagnostics: { disposition: 'not_explicit_whole_meeting_non_running' } };
}

function plusDays(date, count) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
function isoWeekParts(date) {
  const d = new Date(date + 'T12:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7) };
}
export function letrotBulletinUrlsForWindow(startDate, endDateExclusive) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive ?? '')) {
    throw new Error('LeTROT bulletin window requires ISO dates');
  }
  const first = plusDays(startDate, -7);
  const last = plusDays(startDate, 7);
  const seen = new Set();
  const urls = [];
  for (let date = first; date <= last; date = plusDays(date, 1)) {
    const parts = isoWeekParts(date);
    const key = String(parts.year) + '/' + String(parts.week);
    if (seen.has(key)) continue;
    seen.add(key);
    const url = new URL(FRANCE_LETROT_BULLETIN_ENDPOINT);
    url.searchParams.set('annee', String(parts.year));
    url.searchParams.set('semaine', String(parts.week));
    url.searchParams.set('type', 'BULLETIN');
    urls.push(url.toString());
  }
  return urls;
}
function precedingLetrotVenue(normalized, index) {
  const context = normalized.slice(Math.max(0, index - 9000), index);
  const pattern = /\b\d{1,3}\s+([a-z][a-z' -]{2,70})\s+\(([a-z][a-z' -]{2,70})\)\s+pole regional\b/gi;
  let match;
  let venue = null;
  while ((match = pattern.exec(context)) !== null) venue = match[1].trim();
  return venue;
}

export function parseLetrotNonRunningBulletin(text, options = {}) {
  const sourceUrl = options.sourceUrl;
  const startDate = options.startDate ?? null;
  const endDateExclusive = options.endDateExclusive ?? null;
  if (!sourceUrl) throw new Error('LeTROT bulletin sourceUrl is required');
  assertLetrotBulletinUrl(sourceUrl);
  if (typeof text !== 'string' || !text.trim()) throw new Error('LeTROT bulletin text must be non-empty');
  const normalized = normalizedText(text);
  if (!normalized.includes('bulletin de la setf') && !normalized.includes('bulletin de la secf')) {
    throw new Error('LeTROT/SETF bulletin fingerprint missing');
  }

  const pattern = new RegExp(
    "\\bla reunion annulee du\\s+(?:" + WEEKDAY_PATTERN + "\\s+)?(\\d{1,2})\\s+(" + MONTH_PATTERN + ")\\s+(20\\d{2})\\s+est reportee au\\s*:\\s*(?:" + WEEKDAY_PATTERN + "\\s+)?(\\d{1,2})\\s+(" + MONTH_PATTERN + ")\\s+(20\\d{2})",
    'gi',
  );
  const evidence = [];
  const skipped = [];
  for (const match of normalized.matchAll(pattern)) {
    const date = dateFromParts(match[1], match[2], match[3]);
    const replacementDate = dateFromParts(match[4], match[5], match[6]);
    if (!date || !replacementDate) { skipped.push({ reason: 'meeting_date_unresolved' }); continue; }
    if (!inWindow(date, startDate, endDateExclusive)) continue;
    const venueLabel = precedingLetrotVenue(normalized, match.index ?? 0);
    if (!venueLabel) { skipped.push({ date, replacement_date: replacementDate, reason: 'venue_unresolved' }); continue; }
    evidence.push({
      authority_id: 'letrot',
      racing_system_id: 'france-letrot-system',
      meeting_prefix: 'france-letrot',
      date,
      venue_label: venueLabel,
      racecourse_id: resolveFranceRacecourseId(venueLabel),
      replacement_date: replacementDate,
      source_id: FRANCE_LETROT_NON_RUNNING_SOURCE_ID,
      official_source_url: sourceUrl,
      evidence_phrase: 'La réunion annulée du ' + match[1] + ' ' + match[2] + ' ' + match[3]
        + ' est reportée au ' + match[4] + ' ' + match[5] + ' ' + match[6] + '.',
    });
  }
  return {
    evidence,
    diagnostics: {
      disposition: evidence.length ? 'accepted_whole_meeting_non_running' : 'no_supported_whole_meeting_record',
      skipped,
    },
  };
}

function dedupeEvidence(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.racing_system_id + '/' + item.date + '/' + item.racecourse_id;
    const previous = map.get(key);
    if (!previous || (!previous.replacement_date && item.replacement_date)) map.set(key, item);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
}
export function bindFranceNonRunningEvidence(options) {
  const evidence = options.evidence;
  const canonicalMeetings = options.canonicalMeetings;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  if (!Array.isArray(evidence)) throw new Error('France non-running evidence must be an array');
  if (!Array.isArray(canonicalMeetings)) throw new Error('France canonicalMeetings must be an array');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('France checkedAt must be an ISO date-time');

  const meetingPresenceRecords = [];
  const skipped = [];
  for (const item of dedupeEvidence(evidence)) {
    const matches = canonicalMeetings.filter((row) =>
      row?.country_id === 'france'
      && row?.authority_id === item.authority_id
      && row?.racing_system_id === item.racing_system_id
      && row?.racecourse_id === item.racecourse_id
      && row?.date === item.date);
    const unique = [...new Map(matches.map((row) => [row.meeting_id, row])).values()];
    if (unique.length !== 1) {
      skipped.push({
        racing_system_id: item.racing_system_id, date: item.date, racecourse_id: item.racecourse_id,
        reason: unique.length === 0 ? 'canonical_binding_missing' : 'canonical_binding_ambiguous',
        match_count: unique.length,
      });
      continue;
    }
    const meeting = unique[0];
    const expectedMeetingId = item.meeting_prefix + '-' + item.racecourse_id + '-' + item.date;
    if (meeting.meeting_id !== expectedMeetingId) {
      skipped.push({
        racing_system_id: item.racing_system_id, date: item.date, racecourse_id: item.racecourse_id,
        reason: 'canonical_meeting_id_mismatch', meeting_id: meeting.meeting_id, expected_meeting_id: expectedMeetingId,
      });
      continue;
    }
    meetingPresenceRecords.push({
      meeting_id: meeting.meeting_id,
      country_id: 'france',
      authority_id: item.authority_id,
      racecourse_id: item.racecourse_id,
      date: item.date,
      state: 'confirmed_non_running',
      scope: 'whole_meeting',
      evidence_type: 'official_explicit_non_running',
      source_id: item.source_id,
      official_source_url: item.official_source_url,
      checked_at: checked.toISOString(),
      evidence_phrase: item.evidence_phrase,
    });
  }
  return { meeting_presence_records: meetingPresenceRecords, diagnostics: { skipped } };
}
