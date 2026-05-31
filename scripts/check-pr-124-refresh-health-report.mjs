import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-124-refresh-health] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const workflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const bridge = read('scripts/timetable/apply-live-source-snapshot.mjs');

for (const text of [
  'node scripts/timetable/apply-live-source-snapshot.mjs',
  'node scripts/check-pr-124-refresh-health-report.mjs',
  'node scripts/timetable/live-source-snapshot.mjs'
]) {
  if (!workflow.includes(text)) fail(`Workflow missing ${text}.`);
}

for (const text of [
  'timetable-source-health-v1',
  'timetable-update-report-v1',
  'content_sha256',
  'sample_text',
  'reachable_sources',
  'review_sources'
]) {
  if (!bridge.includes(text)) fail(`Bridge missing ${text}.`);
}

const snapshot = spawnSync('node', ['scripts/timetable/live-source-snapshot.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, WHR_LIVE_FETCH: '0', WHR_LIVE_FETCH_LIMIT: '4' }
});
if (snapshot.status !== 0) {
  console.error(snapshot.stdout);
  console.error(snapshot.stderr);
  fail('Snapshot dry run failed.');
}

const apply = spawnSync('node', ['scripts/timetable/apply-live-source-snapshot.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (apply.status !== 0) {
  console.error(apply.stdout);
  console.error(apply.stderr);
  fail('Apply snapshot failed.');
}

const health = readJson('data/generated/timetable/source-health.json');
const report = readJson('data/generated/timetable/update-report.json');

if (health.schema_version !== 'timetable-source-health-v1') fail('source-health schema mismatch.');
if (report.schema_version !== 'timetable-update-report-v1') fail('update-report schema mismatch.');
if (health.source_count !== 4) fail('source-health source count mismatch.');
if (report.sources_checked !== 4) fail('update-report source count mismatch.');
if (!Array.isArray(health.sources) || health.sources.length !== 4) fail('source-health sources mismatch.');
if (!Array.isArray(report.source_results) || report.source_results.length !== 4) fail('update-report source results mismatch.');

for (const source of health.sources) {
  for (const key of ['country_id', 'group_id', 'source_kind', 'parser', 'target_level', 'source_url', 'health_status', 'fetch_status', 'checked_at']) {
    if (!source[key]) fail(`health source missing ${key}.`);
  }
}

for (const result of report.source_results) {
  for (const key of ['country_id', 'group_id', 'source_kind', 'parser', 'target_level', 'fetch_status', 'checked_at']) {
    if (!result[key]) fail(`report result missing ${key}.`);
  }
}

console.log('[pr-124-refresh-health] PASS');
