import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-126-refresh-completion] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
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

const workflow = read('.github/workflows/timetable-scheduled-refresh.yml');

for (const text of [
  'workflow_dispatch:',
  'schedule:',
  'WHR_LIVE_FETCH',
  'node scripts/timetable/live-source-snapshot.mjs',
  'node scripts/timetable/apply-live-source-snapshot.mjs',
  'node scripts/timetable/build-current-integrated.mjs',
  'node scripts/check-pr-123-scheduled-refresh-foundation.mjs',
  'node scripts/check-pr-124-refresh-health-report.mjs',
  'peter-evans/create-pull-request@v6',
  'generated/timetable-refresh'
]) {
  if (!workflow.includes(text)) fail(`Workflow missing ${text}.`);
}

for (const file of [
  'scripts/timetable/live-source-snapshot.mjs',
  'scripts/timetable/apply-live-source-snapshot.mjs',
  'scripts/check-pr-123-scheduled-refresh-foundation.mjs',
  'scripts/check-pr-124-refresh-health-report.mjs',
  'scripts/check-pr-125-refresh-output-safety-gate.mjs'
]) {
  read(file);
}

run('scripts/check-pr-123-scheduled-refresh-foundation.mjs');
run('scripts/check-pr-124-refresh-health-report.mjs');
run('scripts/check-pr-125-refresh-output-safety-gate.mjs');

for (const file of [
  'data/generated/timetable/live-source-snapshot.json',
  'data/generated/timetable/source-health.json',
  'data/generated/timetable/update-report.json',
  'data/generated/timetable/current-integrated.json'
]) {
  read(file);
}

console.log('[pr-126-refresh-completion] PASS');
