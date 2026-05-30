import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function includesRequired(text, phrase, label) {
  if (!text.includes(phrase)) fail(`${label} must include: ${phrase}`);
}

function section(text, heading) {
  const startMarker = `## ${heading}\n`;
  const start = text.indexOf(startMarker);
  if (start === -1) return '';
  const bodyStart = start + startMarker.length;
  const next = text.indexOf('\n## ', bodyStart);
  return text.slice(bodyStart, next === -1 ? text.length : next);
}

function walkFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];
  const files = [];
  for (const entry of readdirSync(absoluteDir)) {
    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(root, relativePath);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) files.push(...walkFiles(relativePath));
    else files.push(relativePath.replaceAll(path.sep, '/'));
  }
  return files;
}

const reportPath = 'docs/runbooks/japan-active-window-candidate-gap-report.md';
if (!existsSync(path.join(root, reportPath))) {
  fail(`${reportPath} must exist`);
}

const report = existsSync(path.join(root, reportPath)) ? read(reportPath) : '';
const pr = existsSync(path.join(root, 'docs/runbooks/pr-085.md')) ? read('docs/runbooks/pr-085.md') : '';
const packageJson = readJson('package.json');

for (const heading of ['JRA', 'NAR', 'Banei']) {
  if (!section(report, heading)) fail(`${reportPath} must include a ## ${heading} section`);
}

for (const phrase of [
  'start_date`: `2026-05-29`',
  'end_date_exclusive`: `2026-06-28`',
  'timezone`: `Asia/Tokyo`',
  'This PR does not fetch live source pages',
  'This PR does not add candidate records',
]) {
  includesRequired(report, phrase, 'Gap report');
}

const jraSection = section(report, 'JRA');
const narSection = section(report, 'NAR');
const baneiSection = section(report, 'Banei');

const jraRacecourses = ['Sapporo', 'Hakodate', 'Fukushima', 'Niigata', 'Tokyo', 'Nakayama', 'Chukyo', 'Kyoto', 'Hanshin', 'Kokura'];
for (const name of jraRacecourses) includesRequired(report, name, 'Gap report JRA inventory');

const narRacecourses = ['Obihiro', 'Monbetsu', 'Morioka', 'Mizusawa', 'Urawa', 'Funabashi', 'Ohi', 'Kawasaki', 'Kanazawa', 'Kasamatsu', 'Nagoya', 'Sonoda', 'Himeji', 'Kochi', 'Saga'];
for (const name of narRacecourses) includesRequired(report, name, 'Gap report NAR inventory');

includesRequired(baneiSection, 'Obihiro', 'Banei section');

for (const phrase of [
  '4 JRA candidate records only',
  '12 NAR candidate/generated meeting-date-level records',
  '3 Banei records for Obihiro',
  '2026-05-30',
  '2026-05-31',
  '2026-06-01',
  'NAR exact first race times are not stored',
  'JRA candidate records store exact `start_time_local` values, but those values require record-by-record official first-race-time verification before promotion',
  'Banei times must be rechecked',
]) {
  includesRequired(report, phrase, 'Gap report');
}

if (!report.includes('| System | Inventory scope | Current records | Exact time status | Active-window completeness status | Next required action |')) {
  fail('Gap report must contain the required summary table');
}

const forbiddenClaims = [
  /Japan\s+(?:is\s+)?complete/i,
  /JRA\s+(?:is\s+)?complete/i,
  /NAR\s+(?:is\s+)?covered/i,
  /Banei\s+(?:is\s+)?covered/i,
  /Japan timetable coverage is comprehensive/i,
];
for (const pattern of forbiddenClaims) {
  const matches = report.match(pattern) ?? [];
  for (const match of matches) {
    const offset = report.indexOf(match);
    const context = report.slice(Math.max(0, offset - 40), offset + match.length + 40).toLowerCase();
    if (!context.includes('does not claim') && !context.includes('not claim') && !context.includes('must not claim')) {
      fail(`Gap report must not make coverage claim: ${match}`);
    }
  }
}

const expectedCandidateCounts = new Map([
  ['data/candidates/japan-jra-candidates.json', 4],
  ['data/candidates/japan-nar-candidates.json', 12],
  ['data/candidates/japan-banei-candidates.json', 3],
  ['data/candidates/japan-active-window-approved-candidates.json', 19],
]);

for (const [relativePath, expectedCount] of expectedCandidateCounts) {
  const file = readJson(relativePath);
  const count = file.records?.length ?? 0;
  if (count !== expectedCount) {
    fail(`${relativePath} must retain ${expectedCount} records; found ${count}. PR-085 must not add candidate records.`);
  }
}

const generatedJapan = readJson('data/generated/japan-active-timetable-records.json');
if ((generatedJapan.records ?? []).length !== 15) {
  fail('data/generated/japan-active-timetable-records.json must retain 15 records; PR-085 must not modify generated timetable record count.');
}

const generatedNar = (generatedJapan.records ?? []).filter((record) => record.racing_type === 'NAR local meeting');
if (generatedNar.length !== 12) fail(`Expected 12 generated NAR records; found ${generatedNar.length}.`);
if (!generatedNar.every((record) => record.start_time_local === 'Meeting date verified on NAR; exact first start time not stored')) {
  fail('Generated NAR records must continue to state exact first start time not stored.');
}

const generatedBanei = (generatedJapan.records ?? []).filter((record) => record.racing_type === 'Banei meeting');
if (generatedBanei.length !== 3) fail(`Expected 3 generated Banei records; found ${generatedBanei.length}.`);

for (const relativePath of [
  'data/generated/japan-public-overlay.json',
  'data/generated/japan-timetable-overlay.json',
  'data/generated/japan-promoted-timetable-records.json',
]) {
  if (existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: PR-085 must not add a public overlay replacement.`);
  }
}

for (const relativePath of walkFiles('data/generated')) {
  if (!relativePath.endsWith('.json')) continue;
  const file = readJson(relativePath);
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'japan') {
    fail(`${relativePath}: PR-085 must not add a promoted Japan timetable overlay.`);
  }
}

const diff = spawnSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' });
if (diff.status === 0) {
  const changed = diff.stdout.trim().split('\n').filter(Boolean);
  for (const relativePath of changed) {
    if (relativePath.startsWith('data/candidates/')) fail(`${relativePath}: PR-085 must not change candidate data files.`);
    if (relativePath.startsWith('data/generated/')) fail(`${relativePath}: PR-085 must not change generated timetable files.`);
    if (relativePath === 'src/lib/data.ts') fail('src/lib/data.ts: PR-085 must not add public overlay replacement/runtime changes.');
  }
}

if (packageJson.scripts?.['validate:japan-active-window-candidate-gap-report'] !== 'node scripts/check-japan-active-window-candidate-gap-report.mjs') {
  fail('package.json must define validate:japan-active-window-candidate-gap-report');
}

const checkScript = packageJson.scripts?.check ?? '';
if (!checkScript.includes('validate:japan-official-timetable-source-evidence && npm run validate:japan-active-window-candidate-gap-report')) {
  fail('npm run check must include validate:japan-active-window-candidate-gap-report after validate:japan-official-timetable-source-evidence');
}

for (const phrase of [
  'Summary',
  'Files',
  'Active-window basis',
  'What the gap report found',
  'What this does not do',
  'Validation commands',
  'Next PR: PR-086 Japan JRA record-level source verification or next roadmap item',
]) {
  includesRequired(pr, phrase, 'PR-085 runbook');
}

if (failures.length) {
  console.error('Japan active-window candidate gap report validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Japan active-window candidate gap report validation passed.');
