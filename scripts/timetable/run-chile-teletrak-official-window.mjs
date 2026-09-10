import fs from 'node:fs';
import path from 'node:path';
import {
  CHILE_TELETRAK_AUTHORITY_ID,
  CHILE_TELETRAK_SOURCE_ID,
  CHILE_TELETRAK_SYSTEM_ID,
  CHILE_TELETRAK_URL,
  CHILE_TIMEZONE,
  buildChileTeletrakCandidate,
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

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture ? fs.readFileSync(path.resolve(fixture), 'utf8') : await fetchOfficialHtml();
const { candidate, diagnostics } = buildChileTeletrakCandidate({ html, checkedAt: generatedAt, startDate, endDateExclusive });
if (diagnostics.unknown_venues.length > 0) throw new Error(`Chile Teletrak unknown domestic meeting card(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`Chile Teletrak parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);
const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const artifact = {
  schema_version: 'chile-teletrak-official-window-candidates-v1', generated_at: generatedAt, country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID,
  racing_system_id: CHILE_TELETRAK_SYSTEM_ID, timezone: CHILE_TIMEZONE, source_id: CHILE_TELETRAK_SOURCE_ID,
  collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: { method: 'official_teletrak_weekly_homepage', schedule_source_id: CHILE_TELETRAK_SOURCE_ID, schedule_source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, rank_counts: rankCounts },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'source_visible_partial', coverage_note: 'Teletrak exposes a rolling weekly domestic meeting view. Only source-visible meetings are emitted; absence beyond that visible horizon is not treated as proof of no meeting.' },
  records: candidate.records, diagnostics,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, rank_counts: rankCounts, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
