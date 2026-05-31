import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-123-scheduled-refresh] ${message}`);
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
const script = read('scripts/timetable/live-source-snapshot.mjs');

for (const text of [
  'schedule:',
  'workflow_dispatch:',
  'WHR_LIVE_FETCH',
  'WHR_LIVE_FETCH_LIMIT',
  'node scripts/timetable/live-source-snapshot.mjs',
  'node scripts/timetable/build-current-integrated.mjs',
  'peter-evans/create-pull-request@v6'
]) {
  if (!workflow.includes(text)) fail(`Workflow missing ${text}.`);
}

for (const text of [
  'live-source-snapshot-v0',
  'dry_run_no_network',
  'live_fetch',
  'content_sha256',
  'source_count',
  'WHR_LIVE_FETCH'
]) {
  if (!script.includes(text)) fail(`Snapshot script missing ${text}.`);
}

const dryRun = spawnSync('node', ['scripts/timetable/live-source-snapshot.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, WHR_LIVE_FETCH: '0', WHR_LIVE_FETCH_LIMIT: '3' }
});

if (dryRun.status !== 0) {
  console.error(dryRun.stdout);
  console.error(dryRun.stderr);
  fail('Dry-run snapshot failed.');
}

const snapshot = readJson('data/generated/timetable/live-source-snapshot.json');
if (snapshot.schema_version !== 'live-source-snapshot-v0') fail('Unexpected snapshot schema.');
if (snapshot.mode !== 'dry_run_no_network') fail('Dry-run snapshot must not fetch network.');
if (snapshot.source_count !== 3) fail('Dry-run source limit not respected.');
if (!Array.isArray(snapshot.records) || snapshot.records.length !== 3) fail('Snapshot records mismatch.');

for (const record of snapshot.records) {
  for (const key of ['country_id', 'group_id', 'source_kind', 'parser', 'target_level', 'source_url', 'checked_at', 'fetch_status']) {
    if (!record[key]) fail(`Snapshot record missing ${key}.`);
  }
  if (record.fetch_status !== 'not_run') fail('Dry-run records must use not_run status.');
}

console.log('[pr-123-scheduled-refresh] PASS');
