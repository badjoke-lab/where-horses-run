import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const approvedCandidatePath = 'data/candidates/nar-monthly-2026-07-through-2026-07-04-approved.json';
const operationsStatusPath = 'data/generated/timetable/operations-status.json';
const operationsReviewPackagePath = 'data/generated/timetable/operations-review-package.json';
const jraPilotReviewPath = 'data/generated/timetable/jra-pilot-review.json';
const generatedPaths = [
  approvedCandidatePath,
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/generated/timetable/public/japan-a-plus-overrides.json',
  operationsStatusPath,
  operationsReviewPackagePath,
  jraPilotReviewPath,
];

function fail(message) {
  console.error(`\n[NAR reviewed promotion] ERROR: ${message}`);
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
  return capture('git', ['status', '--porcelain', '--untracked-files=all'])
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function parseArgs(argv) {
  const args = { month: '2026-07', throughDate: '2026-07-04' };
  for (const value of argv) {
    if (/^\d{4}-\d{2}$/.test(value)) args.month = value;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) args.throughDate = value;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.month !== '2026-07' || args.throughDate !== '2026-07-04') {
  fail('This reviewed promotion operator is pinned to 2026-07 through 2026-07-04. A later cutoff requires a new collection and review decision.');
}
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

const operationsReferenceDate = readJson(operationsStatusPath).as_of_date;
if (!/^\d{4}-\d{2}-\d{2}$/.test(operationsReferenceDate ?? '')) {
  fail(`Operations status has invalid as_of_date: ${operationsReferenceDate}`);
}

run(process.execPath, ['scripts/check-calendar-nar-monthly-candidate-set.mjs']);
run(process.execPath, ['scripts/check-calendar-nar-reviewed-promotion.mjs', '--allow-missing-generated']);
run(process.execPath, ['scripts/timetable/build-reviewed-nar-monthly-promotion-candidate.mjs']);
run(process.execPath, ['scripts/timetable/build-reviewed-nar-monthly-promotion-candidate.mjs', '--check']);
run(process.execPath, ['scripts/check-calendar-nar-reviewed-promotion.mjs']);
run(process.execPath, ['scripts/timetable/promote-approved-candidate-v1.mjs', '--input', approvedCandidatePath]);
run(process.execPath, ['scripts/timetable/build-public-timetable-view.mjs']);
run(process.execPath, ['scripts/timetable/build-japan-a-plus-public-overrides.mjs']);
run(process.execPath, ['scripts/check-japan-a-plus-public-overrides.mjs']);
run(process.execPath, ['scripts/timetable/build-jra-pilot-review.mjs']);
run(process.execPath, ['scripts/check-jra-pilot-foundation.mjs']);
run(process.execPath, ['scripts/timetable/build-operations-status.mjs', '--reference-date', operationsReferenceDate]);
run(process.execPath, ['scripts/check-calendar-operations-status.mjs']);
run(process.execPath, ['scripts/timetable/build-operations-review-package.mjs']);
run(process.execPath, ['scripts/check-calendar-operations-review-package.mjs']);
run(process.execPath, ['scripts/check-calendar-nar-reviewed-promotion.mjs', '--require-promoted']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);
run('npm', ['install', '--package-lock=false', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

const changes = changedPaths();
const unexpected = changes.filter((file) => !generatedPaths.includes(file));
if (unexpected.length) fail(`Unexpected files changed. Nothing was pushed: ${unexpected.join(', ')}`);
for (const file of generatedPaths) {
  if (!changes.includes(file)) fail(`Expected changed file missing: ${file}`);
}

const approved = readJson(approvedCandidatePath);
if (approved.review?.status !== 'approved' || approved.records?.length !== 16) {
  fail('Approved candidate bundle must contain exactly 16 approved records.');
}
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');
const approvedIds = new Set(approved.records.map((record) => record.meeting_id));
const promotedDetails = publicDetails.details.filter((detail) => approvedIds.has(detail.meeting_id));
if (promotedDetails.length !== 16 || promotedDetails.some((detail) => detail.effective_public_rank !== 'A+')) {
  fail('All 16 reviewed meetings must be present in public details at A+.');
}

const branch = `automation/nar-promote-${args.month}-through-${args.throughDate}`;
run('git', ['switch', '-C', branch]);
run('git', ['add', '--', ...generatedPaths]);
const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
if (staged.status === 0) {
  console.log('\n[NAR reviewed promotion] No staged differences. Nothing to push.');
  process.exit(0);
}
run('git', ['commit', '-m', `Promote reviewed NAR meetings through ${args.throughDate}`]);
run('git', ['push', '--force-with-lease', '--set-upstream', 'origin', branch]);

const title = `Promote reviewed NAR meetings through ${args.throughDate}`;
const body = [
  'Operator-triggered reviewed NAR promotion.',
  '',
  `- Target month: ${args.month}`,
  `- Reviewed through date: ${args.throughDate}`,
  '- Reviewed meetings: 16',
  '- Canonical meetings promoted: 16',
  '- Canonical details promoted: 16',
  '- Public A+ meetings/details expected: 16',
  '- JRA pilot review plus operations status and review package synchronized to the promoted public projection',
  '- Source scope: nar-race-list-deba-table only',
  '- Legacy nar-monthly-convene-info source remains link_only',
  '- Banei remains outside this Work ID',
  '- Scheduler and unattended publication remain disabled',
].join('\n');
const existingPr = capture('gh', ['pr', 'list', '--head', branch, '--base', 'main', '--state', 'open', '--json', 'number', '--jq', '.[0].number // empty']);
if (existingPr) run('gh', ['pr', 'edit', existingPr, '--title', title, '--body', body]);
else run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);
const prUrl = capture('gh', ['pr', 'view', branch, '--json', 'url', '--jq', '.url']);
console.log(`\n[NAR reviewed promotion] Review PR: ${prUrl}`);
console.log('[NAR reviewed promotion] Production publication is not complete until this generated PR is reviewed, merged, and deployment validation passes.');
