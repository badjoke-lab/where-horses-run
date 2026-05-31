import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const forbiddenTerms = [
  'odds',
  'payout',
  'prediction',
  'tip',
  'betting advice',
  'live coverage'
];

function fail(message) {
  console.error(`[pr-125-refresh-output-safety] ${message}`);
  process.exit(1);
}

function run(script, env = {}) {
  const result = spawnSync('node', [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${script} failed.`);
  }
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath).toLowerCase();
  for (const term of forbiddenTerms) {
    if (text.includes(term)) fail(`${relativePath} contains forbidden term: ${term}`);
  }
}

run('scripts/timetable/live-source-snapshot.mjs', {
  WHR_LIVE_FETCH: '0',
  WHR_LIVE_FETCH_LIMIT: '5',
  WHR_LIVE_FETCH_TIMEOUT_MS: '12000'
});
run('scripts/timetable/apply-live-source-snapshot.mjs');
run('scripts/timetable/build-current-integrated.mjs');

const requiredFiles = [
  'data/generated/timetable/live-source-snapshot.json',
  'data/generated/timetable/source-health.json',
  'data/generated/timetable/update-report.json',
  'data/generated/timetable/current-integrated.json'
];

for (const file of requiredFiles) {
  assertNoForbiddenText(file);
}

const snapshot = readJson('data/generated/timetable/live-source-snapshot.json');
const health = readJson('data/generated/timetable/source-health.json');
const report = readJson('data/generated/timetable/update-report.json');
const current = readJson('data/generated/timetable/current-integrated.json');

if (snapshot.schema_version !== 'live-source-snapshot-v0') fail('snapshot schema mismatch.');
if (health.schema_version !== 'timetable-source-health-v1') fail('health schema mismatch.');
if (report.schema_version !== 'timetable-update-report-v1') fail('report schema mismatch.');
if (current.schema_version !== 'current-timetable-integrated-v0') fail('current schema mismatch.');

if (snapshot.source_count !== 5) fail('snapshot source count mismatch.');
if (health.source_count !== snapshot.source_count) fail('health source count mismatch.');
if (report.sources_checked !== snapshot.source_count) fail('report source count mismatch.');
if (!Array.isArray(current.records) || current.records.length < 9) fail('current records missing.');

for (const record of snapshot.records) {
  for (const key of ['country_id', 'group_id', 'source_kind', 'parser', 'target_level', 'source_url', 'checked_at', 'fetch_status']) {
    if (!record[key]) fail(`snapshot record missing ${key}.`);
  }
}

for (const source of health.sources) {
  if (!['reachable', 'not_checked', 'needs_review'].includes(source.health_status)) {
    fail(`unexpected health status: ${source.health_status}`);
  }
}

for (const sourceResult of report.source_results) {
  for (const key of ['country_id', 'group_id', 'source_kind', 'parser', 'target_level', 'fetch_status', 'checked_at']) {
    if (!sourceResult[key]) fail(`report source result missing ${key}.`);
  }
}

for (const record of current.records) {
  if (!record.source_trace?.last_checked) fail(`${record.record_id}: last_checked missing.`);
  if (!Array.isArray(record.all_race_times) || record.all_race_times.length === 0) fail(`${record.record_id}: all_race_times missing.`);
}

console.log('[pr-125-refresh-output-safety] PASS');
