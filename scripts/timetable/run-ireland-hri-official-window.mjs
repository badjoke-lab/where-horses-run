import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  IRELAND_HRI_AUTHORITY_ID,
  IRELAND_HRI_PDF_URLS,
  IRELAND_HRI_RACECARD_BASE_URL,
  IRELAND_HRI_SOURCE_ID,
  IRELAND_HRI_SYSTEM_ID,
  IRELAND_TIMEZONE,
  buildIrelandHriCandidate,
  enrichIrelandHriRecordFromRacecard,
} from './ireland-hri-fixtures-core.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: IRELAND_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

async function fetchWithTimeout(url, accept) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 WhereHorsesRun/1.0',
        accept,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
}

async function fetchOfficialPdf() {
  let lastError = null;
  for (const url of IRELAND_HRI_PDF_URLS) {
    try {
      const response = await fetchWithTimeout(url, 'application/pdf,*/*;q=0.8');
      const contentType = response.headers.get('content-type') ?? '';
      if (!/pdf/i.test(contentType)) throw new Error(`HRI fixture source did not return PDF (${contentType || 'unknown content-type'})`);
      return { bytes: new Uint8Array(await response.arrayBuffer()), url };
    } catch (error) {
      lastError = new Error(`${url}: ${error.message}`);
    }
  }
  throw lastError ?? new Error('No HRI fixture PDF URL was available');
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

function racecardUrl(meetingCode) {
  return `${IRELAND_HRI_RACECARD_BASE_URL}?meeting=${encodeURIComponent(meetingCode)}`;
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
const racecardHtmlFixture = arg('racecard-html-fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
let text;
let sourceUrl;
if (fixture) {
  text = fs.readFileSync(path.resolve(fixture), 'utf8');
  sourceUrl = IRELAND_HRI_PDF_URLS[0];
} else {
  const fetched = await fetchOfficialPdf();
  text = await extractPdfText(fetched.bytes);
  sourceUrl = fetched.url;
}
const { candidate, diagnostics } = buildIrelandHriCandidate({ text, checkedAt: generatedAt, startDate, endDateExclusive, sourceUrl });
if (diagnostics.unknown_venues.length > 0) throw new Error(`HRI unknown racecourse label(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`HRI fixture parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);

const acquisition = {
  policy: 'retry_every_refresh_until_a_plus',
  lower_rank_is_terminal: false,
  eligible_lower_rank_meetings: candidate.records.filter((record) => record.capability_rank !== 'A+').length,
  detail_routes_published: 0,
  detail_routes_attempted: 0,
  detail_routes_succeeded: 0,
  detail_routes_failed: [],
  detail_routes_pending_publication: [],
};
const fixedRacecardHtml = racecardHtmlFixture ? fs.readFileSync(path.resolve(racecardHtmlFixture), 'utf8') : null;
const enrichedRecords = [];
for (const record of candidate.records) {
  if (record.capability_rank === 'A+') { enrichedRecords.push(record); continue; }
  const url = racecardUrl(record.hri_meeting_code);
  acquisition.detail_routes_attempted += 1;
  try {
    const html = fixedRacecardHtml ?? await (await fetchWithTimeout(url, 'text/html,application/xhtml+xml')).text();
    const enriched = enrichIrelandHriRecordFromRacecard(record, { html, racecardUrl: url });
    if (!enriched) {
      acquisition.detail_routes_pending_publication.push(record.meeting_id);
      enrichedRecords.push(record);
      continue;
    }
    acquisition.detail_routes_published += 1;
    acquisition.detail_routes_succeeded += 1;
    enrichedRecords.push(enriched);
  } catch (error) {
    acquisition.detail_routes_failed.push({ meeting_id: record.meeting_id, hri_meeting_code: record.hri_meeting_code, racecard_url: url, error: error.message });
    acquisition.detail_routes_pending_publication.push(record.meeting_id);
    enrichedRecords.push(record);
  }
}
candidate.records = enrichedRecords;

const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const artifact = {
  schema_version: 'ireland-hri-official-window-candidates-v1', generated_at: generatedAt, country_id: 'ireland', authority_id: IRELAND_HRI_AUTHORITY_ID, racing_system_id: IRELAND_HRI_SYSTEM_ID, timezone: IRELAND_TIMEZONE, source_id: IRELAND_HRI_SOURCE_ID, collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: { method: 'official_hri_annual_fixture_pdf_then_official_racecard_page', schedule_source_id: IRELAND_HRI_SOURCE_ID, schedule_source_url: sourceUrl, fixture_line_count: diagnostics.fixture_line_count, rank_counts: rankCounts },
  acquisition,
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'official_annual_fixture_list_window', coverage_note: 'HRI annual fixture identity is re-read every refresh. Every lower-rank meeting is then retried against its deterministic HRI racecard route; racecard absence or incompleteness is non-terminal and is retried on the next refresh.' },
  records: candidate.records,
  diagnostics: { ...diagnostics, ...acquisition },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: sourceUrl, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, rank_counts: rankCounts, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, detail_routes_attempted: acquisition.detail_routes_attempted, detail_routes_succeeded: acquisition.detail_routes_succeeded, detail_routes_pending_publication: acquisition.detail_routes_pending_publication.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
