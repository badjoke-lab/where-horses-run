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
  enrichChileRecordWithProgramme,
} from './chile-teletrak-weekly-core.mjs';

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

async function fetchWithTimeout(url, accept) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)', accept },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
}

async function fetchOfficialHtml() {
  const response = await fetchWithTimeout(CHILE_TELETRAK_URL, 'text/html,application/xhtml+xml');
  return await response.text();
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

async function fetchProgrammeText(url) {
  const response = await fetchWithTimeout(url, 'application/pdf,text/plain,text/html,*/*;q=0.8');
  const contentType = response.headers.get('content-type') ?? '';
  if (/pdf/i.test(contentType) || /\.pdf(?:$|[?#])/i.test(response.url || url)) {
    return { text: await extractPdfText(new Uint8Array(await response.arrayBuffer())), finalUrl: response.url || url };
  }
  return { text: await response.text(), finalUrl: response.url || url };
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
const programmeTextFixture = arg('programme-text-fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture ? fs.readFileSync(path.resolve(fixture), 'utf8') : await fetchOfficialHtml();
const { candidate, diagnostics } = buildChileTeletrakCandidate({ html, checkedAt: generatedAt, startDate, endDateExclusive });
if (diagnostics.unknown_venues.length > 0) throw new Error(`Chile Teletrak unknown domestic meeting card(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`Chile Teletrak parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);

const detailDiagnostics = {
  eligible_lower_rank_meetings: candidate.records.filter((record) => record.capability_rank !== 'A+').length,
  detail_routes_published: 0,
  detail_routes_attempted: 0,
  detail_routes_succeeded: 0,
  detail_routes_failed: [],
  detail_routes_pending_publication: [],
};
const fixtureProgrammeText = programmeTextFixture ? fs.readFileSync(path.resolve(programmeTextFixture), 'utf8') : null;
const enrichedRecords = [];
for (const record of candidate.records) {
  if (record.capability_rank === 'A+') { enrichedRecords.push(record); continue; }
  if (!record.programme_url) {
    detailDiagnostics.detail_routes_pending_publication.push(record.meeting_id);
    enrichedRecords.push(record);
    continue;
  }
  detailDiagnostics.detail_routes_published += 1;
  detailDiagnostics.detail_routes_attempted += 1;
  try {
    const programme = fixtureProgrammeText
      ? { text: fixtureProgrammeText, finalUrl: record.programme_url }
      : await fetchProgrammeText(record.programme_url);
    const enriched = enrichChileRecordWithProgramme(record, { text: programme.text, programmeUrl: programme.finalUrl });
    if (!enriched) throw new Error('programme detail contained no complete normalized race rows');
    enrichedRecords.push(enriched);
    detailDiagnostics.detail_routes_succeeded += 1;
  } catch (error) {
    detailDiagnostics.detail_routes_failed.push({ meeting_id: record.meeting_id, programme_url: record.programme_url, error: error.message });
    enrichedRecords.push(record);
  }
}
candidate.records = enrichedRecords;

const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const artifact = {
  schema_version: 'chile-teletrak-official-window-candidates-v1', generated_at: generatedAt, country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID,
  racing_system_id: CHILE_TELETRAK_SYSTEM_ID, timezone: CHILE_TIMEZONE, source_id: CHILE_TELETRAK_SOURCE_ID,
  collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: { method: 'official_teletrak_weekly_homepage_then_linked_programme', schedule_source_id: CHILE_TELETRAK_SOURCE_ID, schedule_source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, rank_counts: rankCounts },
  acquisition: {
    policy: 'retry_every_refresh_until_a_plus',
    lower_rank_is_terminal: false,
    ...detailDiagnostics,
  },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'source_visible_partial', coverage_note: 'Teletrak exposes a rolling weekly domestic meeting view. Every refresh re-runs discovery and follows any programme link that is currently published; a lower rank never suppresses a later retry.' },
  records: candidate.records, diagnostics: { ...diagnostics, ...detailDiagnostics },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, rank_counts: rankCounts, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, detail_routes_published: detailDiagnostics.detail_routes_published, detail_routes_attempted: detailDiagnostics.detail_routes_attempted, detail_routes_succeeded: detailDiagnostics.detail_routes_succeeded, detail_routes_pending_publication: detailDiagnostics.detail_routes_pending_publication.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
