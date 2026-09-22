import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  CHILE_TELETRAK_AUTHORITY_ID,
  CHILE_TELETRAK_SOURCE_ID,
  CHILE_TELETRAK_SYSTEM_ID,
  CHILE_TELETRAK_URL,
  CHILE_TIMEZONE,
  buildChileTeletrakCandidate,
  enrichChileTeletrakCandidateWithProgrammeResults,
  extractClubHipicoSantiagoOfficialPdfHref,
  parseChileTeletrakProgrammeText,
  resolveClubHipicoSantiagoProgrammePdfCandidate,
} from './chile-teletrak-weekly-core.mjs';
import {
  CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
  CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
  bindChileClubHipicoNonRunningEvidence,
  discoverChileClubHipicoNonRunningArticles,
  parseChileClubHipicoNonRunningArticle,
} from './chile-clubhipico-non-running-evidence.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: CHILE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));
}

function htmlToText(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

async function fetchOfficialHtml() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(CHILE_TELETRAK_URL, {
      headers: { 'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)', accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Teletrak Chile weekly homepage returned HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timer); }
}

async function fetchNonRunningHtml(url, label) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'es-CL,es;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return await response.text();
}

function canonicalMeetings(file) {
  if (!fs.existsSync(file)) return [];
  const dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(dataset?.meetings) ? dataset.meetings : [];
}

async function extractPdfText(bytes) {
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const value = item.str.replace(/\s+/g, ' ').trim();
      if (value) line += `${line ? ' ' : ''}${value}`;
      if (item.hasEOL && line) { lines.push(line); line = ''; }
    }
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

async function fetchProgrammeDocument(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'application/pdf,text/html,application/xhtml+xml,*/*;q=0.8',
      'accept-language': 'es-CL,es;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Chile programme returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (/pdf/i.test(contentType) || /\.pdf(?:\?|$)/i.test(response.url)) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { text: await extractPdfText(bytes), final_url: response.url, content_type: contentType, document_kind: 'pdf' };
  }
  if (/html/i.test(contentType) || !contentType) {
    const html = await response.text();
    return { text: htmlToText(html), raw_html: html, final_url: response.url, content_type: contentType, document_kind: 'html' };
  }
  throw new Error(`Chile programme returned unsupported content type ${contentType}`);
}

async function fetchProgrammeText(url, { racecourseId } = {}) {
  const primary = await fetchProgrammeDocument(url);
  if (primary.document_kind !== 'html' || racecourseId !== 'club-hipico-de-santiago-racecourse') return primary;

  const explicitPdfUrl = extractClubHipicoSantiagoOfficialPdfHref(primary.raw_html, { baseUrl: primary.final_url });
  const candidatePdfUrl = explicitPdfUrl ?? resolveClubHipicoSantiagoProgrammePdfCandidate(primary.final_url, { racecourseId });
  if (!candidatePdfUrl || candidatePdfUrl === primary.final_url) return primary;

  try {
    const resolved = await fetchProgrammeDocument(candidatePdfUrl);
    if (resolved.document_kind !== 'pdf') {
      return {
        ...primary,
        resolution_attempted_url: candidatePdfUrl,
        resolution_error: 'resolved_official_programme_not_pdf',
      };
    }
    return {
      ...resolved,
      resolved_from_url: primary.final_url,
      resolution_method: explicitPdfUrl ? 'club_hipico_viewer_pdf_href' : 'club_hipico_viewer_date_pdf_candidate',
    };
  } catch (error) {
    return {
      ...primary,
      resolution_attempted_url: candidatePdfUrl,
      resolution_error: String(error?.message ?? error),
    };
  }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture ? fs.readFileSync(path.resolve(fixture), 'utf8') : await fetchOfficialHtml();
const { candidate: scheduleCandidate, diagnostics } = buildChileTeletrakCandidate({ html, checkedAt: generatedAt, startDate, endDateExclusive });
if (diagnostics.unknown_venues.length > 0) throw new Error(`Chile Teletrak unknown domestic meeting card(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`Chile Teletrak parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);

const programmeResults = {};
const detailDiagnostics = [];
for (const record of scheduleCandidate.records) {
  if (!record.programme_url) {
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'not_published', programme_url: null });
    continue;
  }
  const key = `${record.date}/${record.racecourse_id}`;
  try {
    const fetched = await fetchProgrammeText(record.programme_url, { racecourseId: record.racecourse_id });
    const parsed = parseChileTeletrakProgrammeText(fetched.text, { racecourseId: record.racecourse_id });
    if (parsed.status !== 'available') {
      programmeResults[key] = { status: 'source_error', error_code: 'programme_parse_failed' };
      detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'source_error', error_code: 'programme_parse_failed', programme_url: record.programme_url, final_url: fetched.final_url, document_kind: fetched.document_kind, programme_format: parsed.format, resolved_from_url: fetched.resolved_from_url ?? null, resolution_method: fetched.resolution_method ?? null, resolution_attempted_url: fetched.resolution_attempted_url ?? null, resolution_error: fetched.resolution_error ?? null });
      continue;
    }
    programmeResults[key] = parsed;
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'available', programme_url: record.programme_url, final_url: fetched.final_url, document_kind: fetched.document_kind, programme_format: parsed.format, race_count: parsed.timetable_rows.length, resolved_from_url: fetched.resolved_from_url ?? null, resolution_method: fetched.resolution_method ?? null });
  } catch (error) {
    programmeResults[key] = { status: 'source_error', error_code: 'programme_fetch_failed' };
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'source_error', error_code: 'programme_fetch_failed', programme_url: record.programme_url, error: String(error?.message ?? error) });
  }
}

const candidate = enrichChileTeletrakCandidateWithProgrammeResults(scheduleCandidate, { resultsByMeeting: programmeResults, checkedAt: generatedAt });

let meetingPresenceRecords = [];
let nonRunningDiagnostics = {
  status: 'not_checked',
  source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
  source_url: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
  confirmed_non_running_count: 0,
};
try {
  const archiveHtml = await fetchNonRunningHtml(
    CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
    'Club Hipico Corporativo archive',
  );
  const discovery = discoverChileClubHipicoNonRunningArticles(archiveHtml, {
    sourceUrl: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
  });
  const evidence = [];
  const articleResults = [];
  for (const sourceUrl of discovery.article_urls) {
    try {
      const articleHtml = await fetchNonRunningHtml(sourceUrl, 'Club Hipico non-running article');
      const parsed = parseChileClubHipicoNonRunningArticle(articleHtml, {
        sourceUrl,
        startDate,
        endDateExclusive,
      });
      evidence.push(...parsed.evidence);
      articleResults.push({
        source_url: sourceUrl,
        status: 'success',
        ...parsed.diagnostics,
      });
    } catch (error) {
      articleResults.push({
        source_url: sourceUrl,
        status: 'source_error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const bound = bindChileClubHipicoNonRunningEvidence({
    evidence,
    canonicalMeetings: canonicalMeetings(canonicalPath),
    checkedAt: generatedAt,
  });
  meetingPresenceRecords = bound.meeting_presence_records;
  nonRunningDiagnostics = {
    status: articleResults.some((row) => row.status === 'source_error') ? 'partial_success' : 'success',
    source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
    source_url: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
    candidate_article_count: discovery.article_urls.length,
    accepted_evidence_count: evidence.length,
    confirmed_non_running_count: meetingPresenceRecords.length,
    article_results: articleResults,
    binding_skipped: bound.diagnostics.skipped,
  };
} catch (error) {
  nonRunningDiagnostics = {
    status: 'source_error',
    source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
    source_url: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
    confirmed_non_running_count: 0,
    error: error instanceof Error ? error.message : String(error),
  };
}

const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const detailStatusCounts = Object.fromEntries(['available', 'not_published', 'source_error'].map((status) => [status, candidate.records.filter((record) => record.detail_observation?.status === status).length]));
const artifact = {
  schema_version: 'chile-teletrak-official-window-candidates-v2', generated_at: generatedAt, country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID,
  racing_system_id: CHILE_TELETRAK_SYSTEM_ID, timezone: CHILE_TIMEZONE, source_id: CHILE_TELETRAK_SOURCE_ID,
  collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: {
    method: 'official_teletrak_weekly_homepage_plus_linked_programmes',
    schedule_source_id: CHILE_TELETRAK_SOURCE_ID,
    schedule_source_url: CHILE_TELETRAK_URL,
    detail_source_id: CHILE_TELETRAK_SOURCE_ID,
    source_card_count: diagnostics.source_card_count,
    rank_counts: rankCounts,
    detail_status_counts: detailStatusCounts,
    non_running_source_id: CHILE_CLUB_HIPICO_NON_RUNNING_SOURCE_ID,
    non_running_source_url: CHILE_CLUB_HIPICO_CORPORATE_NEWS_URL,
    non_running_source_status: nonRunningDiagnostics.status,
  },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'source_visible_partial', coverage_note: 'Teletrak remains positive schedule evidence. Club Hipico de Santiago Corporativo news contributes only bounded explicit whole-meeting suspension/postponement evidence for the Santiago venue. Archive omission, article fetch failure, other Chile venues, and partial-race stoppages never become whole-meeting cancellation evidence.' },
  records: candidate.records,
  meeting_presence_records: meetingPresenceRecords,
  diagnostics: { ...diagnostics, programme_detail: detailDiagnostics, non_running: nonRunningDiagnostics },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, confirmed_non_running_count: meetingPresenceRecords.length, non_running_source_status: nonRunningDiagnostics.status, rank_counts: rankCounts, detail_status_counts: detailStatusCounts, programme_detail: detailDiagnostics, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
