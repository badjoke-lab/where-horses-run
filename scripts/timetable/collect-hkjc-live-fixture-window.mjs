import fs from 'node:fs';
import path from 'node:path';
import { buildHkjcLiveFixtureBridgeV1 } from './hkjc-live-fixture-bridge.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const from = args.get('--from');
const toExclusive = args.get('--to-exclusive');
const campaignId = args.get('--campaign-id');
const jobId = args.get('--job-id');
const batchId = args.get('--batch-id');
const outputRoot = args.get('--output-root');
const writeArtifacts = args.has('--write-artifacts');
const timeoutMs = Number(args.get('--timeout-ms') ?? 15000);

for (const [name, value] of [['--from', from], ['--to-exclusive', toExclusive], ['--campaign-id', campaignId], ['--job-id', jobId], ['--batch-id', batchId]]) {
  if (!value) throw new Error(`${name} is required`);
}
if (writeArtifacts && !outputRoot) throw new Error('--output-root is required with --write-artifacts');
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error('--timeout-ms must be an integer from 1000 to 60000');

function realDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) throw new Error(`${label} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} must be a real date`);
}
realDate(from, '--from');
realDate(toExclusive, '--to-exclusive');
if (from >= toExclusive) throw new Error('--from must be before --to-exclusive');
for (const [label, value] of [['campaign ID', campaignId], ['job ID', jobId], ['batch ID', batchId]]) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`${label} must be lowercase kebab-case`);
}

function enumerateMonths(startDate, endDateExclusive) {
  const start = new Date(`${startDate.slice(0, 7)}-01T00:00:00Z`);
  const last = new Date(`${endDateExclusive}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() - 1);
  const end = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1));
  const months = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function fixtureUrl(month) {
  const [year, monthNumber] = month.split('-');
  return `https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=${monthNumber}&CalYear=${year}`;
}

function classifyResponseText(body) {
  const text = String(body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'unexpected_response';
  if (/access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text)) {
    return 'source_unavailable';
  }
  return 'success';
}

async function fetchFixturePage(month) {
  const sourceUrl = fixtureUrl(month);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const content = await response.text();
    if (response.status === 429) return { month, source_url: sourceUrl, status: 'rate_limited', content: null };
    if (!response.ok) return { month, source_url: sourceUrl, status: 'source_unavailable', content: null };
    const finalHost = new URL(response.url).hostname.toLowerCase();
    if (finalHost !== 'racing.hkjc.com') return { month, source_url: sourceUrl, status: 'unexpected_response', content: null };
    const status = classifyResponseText(content);
    return { month, source_url: sourceUrl, status, content: status === 'success' ? content : null };
  } catch {
    return { month, source_url: sourceUrl, status: 'source_unavailable', content: null };
  } finally {
    clearTimeout(timer);
  }
}

function assertArtifactOutputRoot(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) throw new Error('output root missing');
  const normalized = relativePath.replaceAll('\\', '/');
  if (normalized.includes('..')) throw new Error('output root must not traverse parent directories');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) throw new Error('output root must be repository-relative');
  const forbidden = [
    'data/generated/timetable/canonical',
    'data/generated/timetable/public',
  ];
  if (forbidden.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    throw new Error('HKJC artifact-only collector cannot write canonical or public timetable paths');
  }
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

const months = enumerateMonths(from, toExclusive);
const pageResults = [];
for (const month of months) pageResults.push(await fetchFixturePage(month));

const checkedAt = new Date().toISOString();
const bridge = buildHkjcLiveFixtureBridgeV1({
  schema_version: 'calendar-hkjc-live-fixture-bridge-input-v1',
  generated_at: checkedAt,
  campaign_id: campaignId,
  job_id: jobId,
  batch_id: batchId,
  runner_used: 'github_actions',
  requested_scope: {
    start_date: from,
    end_date_exclusive: toExclusive,
    timezone: 'Asia/Hong_Kong',
  },
  page_results: pageResults,
});

if (writeArtifacts) {
  assertArtifactOutputRoot(outputRoot);
  for (const [filename, value] of [
    ['candidate.json', bridge.candidate],
    ['coverage-observation.json', bridge.coverage_observation],
    ['result-manifest.json', bridge.result_manifest],
    ['review-queue.json', bridge.review_queue],
    ['collection-report.json', bridge.collection_report],
  ]) writeJson(path.join(outputRoot, filename), value);
}

console.log(JSON.stringify({
  system_id: bridge.system_id,
  adapter_id: bridge.adapter_id,
  requested_months: months,
  successful_month_count: bridge.collection_report.successful_month_count,
  records_discovered: bridge.coverage_observation.records_discovered,
  coverage_claim: bridge.coverage_observation.coverage_claim,
  source_error_count: bridge.coverage_observation.source_errors.length,
  review_state: bridge.review_queue.entries[0].review_state,
  promotion_state: bridge.review_queue.entries[0].promotion_state,
  artifact_write_performed: writeArtifacts,
  raw_source_body_persisted: false,
  canonical_write_performed: false,
  public_write_performed: false,
}));
