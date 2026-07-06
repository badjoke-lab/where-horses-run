import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const candidatePath = 'data/candidates/banei-monthly-2026-07-full-month-candidates.json';
const reportPath = 'data/generated/timetable/banei-monthly-2026-07-full-month-collection-report.json';
const allowedPaths = [candidatePath, reportPath];

function fail(message) {
  console.error(`\n[Banei full month] ERROR: ${message}`);
  process.exit(1);
}
function run(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}
function capture(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}
function commandExists(command) {
  return spawnSync(command, ['--version'], { cwd: root, stdio: 'ignore' }).status === 0;
}
function changedPaths() {
  return capture('git', ['status', '--porcelain', '--untracked-files=all']).split('\n').filter(Boolean).map((line) => line.slice(3).trim());
}
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

if (process.argv.slice(2).some((value) => value.includes('through-date') || /^\d{4}-\d{2}-\d{2}$/.test(value))) fail('Full-month only. Partial cutoff runs are not completion evidence.');
for (const command of ['git', 'gh', 'npm']) if (!commandExists(command)) fail(`Required command is not installed: ${command}`);
try { run('gh', ['auth', 'status']); } catch { fail('GitHub CLI is not authenticated.'); }
if (changedPaths().length) fail(`Temporary checkout is not clean: ${changedPaths().join(', ')}`);
run('git', ['fetch', 'origin']);
run('git', ['switch', 'main']);
run('git', ['pull', '--ff-only', 'origin', 'main']);
if (changedPaths().length) fail('Working tree changed while updating main.');

run(process.execPath, ['scripts/timetable/collect-banei-full-month-calendar.mjs']);
run(process.execPath, ['scripts/check-calendar-banei-full-month-candidate-set.mjs']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);
run('npm', ['install', '--package-lock=false', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

const changes = changedPaths();
const unexpected = changes.filter((file) => !allowedPaths.includes(file));
if (unexpected.length) fail(`Unexpected files changed: ${unexpected.join(', ')}`);
for (const file of allowedPaths) if (!changes.includes(file)) fail(`Expected changed file missing: ${file}`);

const report = readJson(reportPath);
if (report.month_start !== '2026-07-01' || report.month_end !== '2026-07-31' || report.through_date !== null) fail('Full-month boundary differs.');
if (report.racecourse_id !== 'obihiro-racecourse' || report.meetings_scheduled !== 12 || report.schedule_scope_complete !== true) fail('Banei July schedule scope is incomplete.');
if (report.partial_cutoff_completion_allowed !== false || report.publication_effect !== 'none') fail('Banei boundary differs.');

const branch = 'automation/banei-full-month-2026-07';
run('git', ['switch', '-C', branch]);
run('git', ['add', '--', ...allowedPaths]);
const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
if (staged.status === 0) process.exit(0);
run('git', ['commit', '-m', '[CF-Pages-Skip] Add full-month Banei July candidates']);
run('git', ['push', '--force-with-lease', '--set-upstream', 'origin', branch]);

const title = 'Add full-month Banei July candidate set';
const body = [
  'Operator-triggered full-month Banei collection.',
  '',
  '- Work ID: WHR-CAL-JAPAN-BANEI-A-PLUS',
  '- Month boundary: 2026-07-01 through 2026-07-31',
  '- Partial cutoff completion: forbidden',
  '- Racecourse scope: Obihiro Racecourse only',
  `- Scheduled meetings: ${report.meetings_scheduled}`,
  `- First/last time summaries available: ${report.time_summary_available}`,
  `- Pending detail meetings: ${report.pending_detail_meetings}`,
  '- Publication remains review-only',
].join('\n');
const existing = capture('gh', ['pr', 'list', '--head', branch, '--base', 'main', '--state', 'open', '--json', 'number', '--jq', '.[0].number // empty']);
if (existing) run('gh', ['pr', 'edit', existing, '--title', title, '--body', body]);
else run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);
const url = capture('gh', ['pr', 'view', branch, '--json', 'url', '--jq', '.url']);
console.log(`\n[Banei full month] Review PR: ${url}`);
