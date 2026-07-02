import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const generatedPaths = [
  'data/generated/timetable/jra-race-time-snapshot.json',
  'data/generated/timetable/jra-normalized-timetable.json',
  'data/generated/timetable/jra-normalized-meeting-details.json',
  'data/generated/timetable/jra-refresh-report.json',
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/generated/timetable/public/japan-a-plus-overrides.json',
];

let rollbackGenerated = false;
process.on('exit', (code) => {
  if (code !== 0 && rollbackGenerated) {
    spawnSync('git', ['restore', '--staged', '--worktree', '--', ...generatedPaths], {
      cwd: root,
      stdio: 'ignore',
    });
  }
});

function fail(message) {
  console.error(`\n[JRA manual refresh] ERROR: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    cwd: root,
    stdio: 'ignore',
  });
  return result.status === 0;
}

function resolveMonth(argv) {
  const explicit = argv.find((value) => /^--month=\d{4}-\d{2}$/.test(value));
  const positional = argv.find((value) => /^\d{4}-\d{2}$/.test(value));
  const value = explicit?.split('=')[1] ?? positional;
  if (value) return value;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function monthRange(month) {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) fail(`Invalid month: ${month}. Use YYYY-MM.`);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) fail(`Invalid month: ${month}.`);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function isExpectedNonRacing403(entry) {
  if (entry?.status !== 'http_error' || entry?.http_status !== 403) return false;
  const date = new Date(`${entry.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function validateReport(report, range) {
  if (report.refresh_window?.from !== range.from || report.refresh_window?.to !== range.to) {
    fail('Refresh report date range does not match the requested month.');
  }
  if (!Number.isInteger(report.dates_checked) || report.dates_checked < 1) {
    fail('Refresh report has no checked dates.');
  }
  if (!Number.isInteger(report.meetings_extracted) || report.meetings_extracted < 1) {
    fail('No JRA meetings were extracted. Nothing will be pushed.');
  }
  if (!Number.isInteger(report.publishable_meetings) || report.publishable_meetings < 1) {
    fail('No publishable JRA meetings were produced. Nothing will be pushed.');
  }
  if (report.a_plus_meetings !== report.publishable_meetings || report.a_level_meetings !== 0) {
    fail(`Not every publishable meeting reached A+ (publishable=${report.publishable_meetings}, A+=${report.a_plus_meetings}, A=${report.a_level_meetings}).`);
  }

  const statuses = report.statuses ?? [];
  const expectedNonRacing403s = statuses.filter(isExpectedNonRacing403);
  if (expectedNonRacing403s.length) {
    console.log(`[JRA manual refresh] Treated ${expectedNonRacing403s.length} weekday 403 responses as non-racing dates.`);
  }

  const badStatuses = statuses.filter((entry) =>
    !['meetings_extracted', 'no_racing_page'].includes(entry.status) && !isExpectedNonRacing403(entry)
  );
  if (badStatuses.length) {
    fail(`Source failures were recorded: ${badStatuses.map((entry) => `${entry.date}:${entry.status}:${entry.http_status ?? entry.network_error ?? 'unknown'}`).join(', ')}`);
  }
}

function changedPaths() {
  return capture('git', ['status', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

for (const command of ['git', 'gh', 'npm']) {
  if (!commandExists(command)) fail(`Required command is not installed: ${command}`);
}

try {
  run('gh', ['auth', 'status']);
} catch {
  fail('GitHub CLI is not authenticated. Run `gh auth login` once, then retry.');
}

const initialChanges = changedPaths();
if (initialChanges.length) {
  fail(`Working tree is not clean. Commit or discard these changes first: ${initialChanges.join(', ')}`);
}

const month = resolveMonth(process.argv.slice(2));
const range = monthRange(month);
console.log(`\n[JRA manual refresh] Target month: ${month} (${range.from} to ${range.to})`);

run('git', ['fetch', 'origin']);
run('git', ['switch', 'main']);
run('git', ['pull', '--ff-only', 'origin', 'main']);

if (changedPaths().length) fail('Working tree changed while updating main. Aborting.');

rollbackGenerated = true;
run(process.execPath, [
  'scripts/timetable/refresh-jra.mjs',
  `--from=${range.from}`,
  `--to=${range.to}`,
]);

const report = readJson('data/generated/timetable/jra-refresh-report.json');
validateReport(report, range);

run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);
run(process.execPath, ['scripts/timetable/build-japan-a-plus-public-overrides.mjs']);
run(process.execPath, ['scripts/check-japan-a-plus-public-overrides.mjs']);
run('npm', ['install', '--package-lock=false', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

const allChanges = changedPaths();
const unexpected = allChanges.filter((file) => !generatedPaths.includes(file));
if (unexpected.length) {
  fail(`Unexpected files changed. Nothing was pushed: ${unexpected.join(', ')}`);
}

const generatedChanges = allChanges.filter((file) => generatedPaths.includes(file));
if (!generatedChanges.length) {
  rollbackGenerated = false;
  console.log(`\n[JRA manual refresh] No data changes for ${month}. No branch or PR was created.`);
  process.exit(0);
}

const branch = `automation/jra-manual-${month}`;
run('git', ['switch', '-C', branch]);
run('git', ['add', '--', ...generatedPaths]);

const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
if (staged.status === 0) {
  rollbackGenerated = false;
  console.log('\n[JRA manual refresh] No staged differences. Nothing to push.');
  process.exit(0);
}

run('git', ['commit', '-m', `Update JRA programme for ${month}`]);
rollbackGenerated = false;
run('git', ['push', '--force-with-lease', '--set-upstream', 'origin', branch]);

const title = `Update JRA ${month} programme`;
const body = [
  `Operator-triggered local refresh for ${month}.`,
  '',
  `- Source: official JRA Japanese calendar/programme pages`,
  `- Range: ${range.from} to ${range.to}`,
  `- Meetings: ${report.publishable_meetings}`,
  `- A+ meetings: ${report.a_plus_meetings}`,
  `- Publication remains review-controlled`,
].join('\n');

const existingPr = capture('gh', [
  'pr', 'list',
  '--head', branch,
  '--base', 'main',
  '--state', 'open',
  '--json', 'number',
  '--jq', '.[0].number // empty',
]);

if (existingPr) {
  run('gh', ['pr', 'edit', existingPr, '--title', title, '--body', body]);
} else {
  run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);
}

const prUrl = capture('gh', ['pr', 'view', branch, '--json', 'url', '--jq', '.url']);
console.log(`\n[JRA manual refresh] Review PR: ${prUrl}`);
console.log('[JRA manual refresh] The site is not updated until that PR is merged.');
