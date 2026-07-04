import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const candidatePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const reportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const allowedPaths = [candidatePath, reportPath];

function fail(message) {
  console.error(`\n[NAR monthly collection] ERROR: ${message}`);
  process.exit(1);
}
function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
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
function allowed(file) {
  return allowedPaths.includes(file);
}
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function parseArgs(argv) {
  const args = { month: '2026-07', throughDate: null };
  for (const value of argv) {
    if (/^\d{4}-\d{2}$/.test(value)) args.month = value;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) args.throughDate = value;
    else if (value.startsWith('--month=')) args.month = value.slice('--month='.length);
    else if (value.startsWith('--through-date=')) args.throughDate = value.slice('--through-date='.length);
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
for (const command of ['git', 'gh', 'npm']) if (!commandExists(command)) fail(`Required command is not installed: ${command}`);
try { run('gh', ['auth', 'status']); } catch { fail('GitHub CLI is not authenticated. Run `gh auth login` once, then retry.'); }
if (changedPaths().length) fail(`Temporary checkout is not clean: ${changedPaths().join(', ')}`);
run('git', ['fetch', 'origin']);
run('git', ['switch', 'main']);
run('git', ['pull', '--ff-only', 'origin', 'main']);
if (changedPaths().length) fail('Working tree changed while updating main.');

const collectorArgs = ['scripts/timetable/collect-nar-monthly-candidates.mjs', `--month=${args.month}`, '--allow-blockers'];
if (args.throughDate) collectorArgs.push(`--through-date=${args.throughDate}`);
run(process.execPath, collectorArgs);
run(process.execPath, ['scripts/check-calendar-nar-monthly-candidate-set.mjs']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);
run('npm', ['install', '--package-lock=false', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

const changes = changedPaths();
const unexpected = changes.filter((file) => !allowed(file));
if (unexpected.length) fail(`Unexpected files changed. Nothing was pushed: ${unexpected.join(', ')}`);
for (const file of allowedPaths) if (!changes.includes(file)) fail(`Expected changed file missing: ${file}`);

const report = readJson(reportPath);
const candidates = readJson(candidatePath);
if (report.racecourses_checked !== 14) fail(`Expected 14 racecourses, checked ${report.racecourses_checked}.`);
if (report.promotion_eligible_candidates !== 0 || report.publication_effect !== 'none') fail('Promotion/publication boundary differs.');
if (candidates.review?.promotion_eligible !== false || candidates.review?.canonical_write !== 'disabled' || candidates.review?.public_write !== 'disabled') fail('Candidate review boundary differs.');

const branch = `automation/nar-monthly-${args.month}`;
run('git', ['switch', '-C', branch]);
run('git', ['add', '--', candidatePath, reportPath]);
const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
if (staged.status === 0) {
  console.log('\n[NAR monthly collection] No staged differences. Nothing to push.');
  process.exit(0);
}
run('git', ['commit', '-m', `Add NAR monthly candidates for ${args.month}`]);
run('git', ['push', '--force-with-lease', '--set-upstream', 'origin', branch]);

const title = `Add NAR monthly candidates for ${args.month}`;
const body = [
  'Operator-triggered local NAR monthly collection.',
  '',
  `- Target month: ${args.month}`,
  `- Through date: ${report.through_date ?? 'full month'}`,
  '- Flat-racing racecourses classified: 14',
  `- Racecourses with meetings: ${report.racecourses_with_meetings}`,
  `- Racecourses without meetings: ${report.racecourses_without_meetings}`,
  `- Meetings discovered: ${report.meetings_discovered}`,
  `- Complete meeting candidates: ${report.complete_meeting_candidates}`,
  `- Blocked meetings: ${report.blocked_meetings}`,
  '- Every candidate remains needs_review and promotion_eligible=false',
  '- Canonical, public, raw-source, and scheduled writes are disabled',
].join('\n');
const existingPr = capture('gh', ['pr', 'list', '--head', branch, '--base', 'main', '--state', 'open', '--json', 'number', '--jq', '.[0].number // empty']);
if (existingPr) run('gh', ['pr', 'edit', existingPr, '--title', title, '--body', body]);
else run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);
const prUrl = capture('gh', ['pr', 'view', branch, '--json', 'url', '--jq', '.url']);
console.log(`\n[NAR monthly collection] Review PR: ${prUrl}`);
console.log('[NAR monthly collection] No NAR meeting is published until a later reviewed promotion PR.');
