import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePrefix = 'data/fixtures/timetable/nar/complete-meetings/';
const reportPath = 'data/generated/timetable/nar-complete-fixture-report.json';
const allowedPaths = [reportPath];
let rollback = false;

function fail(message) {
  console.error(`\n[NAR fixture collection] ERROR: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
}

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function commandExists(command) {
  return spawnSync(command, ['--version'], { cwd: root, stdio: 'ignore' }).status === 0;
}

function changedPaths() {
  return capture('git', ['status', '--porcelain', '--untracked-files=all'])
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

function allowed(file) {
  return allowedPaths.includes(file) || file.startsWith(fixturePrefix);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function rollbackGenerated() {
  const changed = changedPaths().filter(allowed);
  const tracked = changed.filter((file) => fs.existsSync(path.join(root, file)) && spawnSync('git', ['ls-files', '--error-unmatch', '--', file], { cwd: root, stdio: 'ignore' }).status === 0);
  const untracked = changed.filter((file) => !tracked.includes(file));
  if (tracked.length) spawnSync('git', ['restore', '--staged', '--worktree', '--', ...tracked], { cwd: root, stdio: 'ignore' });
  for (const file of untracked) fs.rmSync(path.join(root, file), { force: true, recursive: true });
}

process.on('exit', (code) => {
  if (code !== 0 && rollback) rollbackGenerated();
});

for (const command of ['git', 'gh', 'npm']) {
  if (!commandExists(command)) fail(`Required command is not installed: ${command}`);
}
try {
  run('gh', ['auth', 'status']);
} catch {
  fail('GitHub CLI is not authenticated. Run `gh auth login` once, then retry.');
}

if (changedPaths().length) fail(`Temporary checkout is not clean: ${changedPaths().join(', ')}`);
run('git', ['fetch', 'origin']);
run('git', ['switch', 'main']);
run('git', ['pull', '--ff-only', 'origin', 'main']);
if (changedPaths().length) fail('Working tree changed while updating main.');

rollback = true;
run(process.execPath, ['scripts/timetable/collect-nar-complete-fixtures-v2.mjs', '--all']);

const report = readJson(reportPath);
if (report.schema_version !== 'nar-complete-fixture-report-v2') fail('Unexpected NAR fixture report schema.');
if (report.mode !== 'all_14' || report.dry_run !== false) fail('NAR fixture report was not produced in all-14 write mode.');
if (report.racecourses_checked !== 14) fail(`Expected 14 racecourses, checked ${report.racecourses_checked}.`);
if (report.complete_meetings !== 14 || report.failed_meetings !== 0) {
  const failures = (report.statuses ?? []).filter((row) => row.status !== 'meeting_complete');
  fail(`Not every racecourse produced a complete fixture: ${failures.map((row) => `${row.racecourse_id}:${row.status}`).join(', ')}`);
}

run(process.execPath, ['scripts/check-calendar-nar-complete-fixture-set.mjs']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);
run('npm', ['install', '--package-lock=false', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

const changes = changedPaths();
const unexpected = changes.filter((file) => !allowed(file));
if (unexpected.length) fail(`Unexpected files changed. Nothing was pushed: ${unexpected.join(', ')}`);
const fixtureFiles = changes.filter((file) => file.startsWith(fixturePrefix) && file.endsWith('.json'));
if (fixtureFiles.length !== 14) fail(`Expected 14 changed fixture files, found ${fixtureFiles.length}.`);
if (!changes.includes(reportPath)) fail('Fixture report did not change.');

const branch = 'automation/nar-complete-fixtures-14';
run('git', ['switch', '-C', branch]);
run('git', ['add', '--', reportPath, fixturePrefix]);
const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
if (staged.status === 0) {
  rollback = false;
  console.log('\n[NAR fixture collection] No staged differences. Nothing to push.');
  process.exit(0);
}

run('git', ['commit', '-m', 'Add complete NAR fixtures for 14 racecourses']);
rollback = false;
run('git', ['push', '--force-with-lease', '--set-upstream', 'origin', branch]);

const totalRows = fixtureFiles.reduce((sum, file) => {
  const fixture = readJson(file);
  return sum + (fixture.timetable_rows?.length ?? 0);
}, 0);
const title = 'Add complete NAR fixtures for 14 racecourses';
const body = [
  'Operator-triggered local NAR fixture collection.',
  '',
  '- Flat-racing racecourses checked: 14',
  '- Complete meeting fixtures: 14',
  `- Total timetable rows: ${totalRows}`,
  '- Every fixture remains needs_review and promotion_eligible=false',
  '- Candidate, canonical, and public data are unchanged',
  '- Scheduling and unattended publication remain disabled',
].join('\n');

const existingPr = capture('gh', [
  'pr', 'list', '--head', branch, '--base', 'main', '--state', 'open',
  '--json', 'number', '--jq', '.[0].number // empty',
]);
if (existingPr) run('gh', ['pr', 'edit', existingPr, '--title', title, '--body', body]);
else run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);

const prUrl = capture('gh', ['pr', 'view', branch, '--json', 'url', '--jq', '.url']);
console.log(`\n[NAR fixture collection] Review PR: ${prUrl}`);
console.log('[NAR fixture collection] No NAR meeting is published until a later reviewed promotion PR.');
