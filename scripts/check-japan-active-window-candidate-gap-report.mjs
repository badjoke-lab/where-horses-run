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

function readProtectedDiff() {
  return spawnSync(
    'git',
    ['diff', '--no-ext-diff', '--binary', '--', 'data/candidates', 'data/generated', 'src/lib/data.ts'],
    { cwd: root, encoding: 'utf8' },
  );
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const protectedDiffBefore = readProtectedDiff();
if (protectedDiffBefore.status !== 0) fail('Unable to capture protected repository diff before validation.');

const reportPath = 'docs/runbooks/japan-active-window-candidate-gap-report.md';
if (!existsSync(path.join(root, reportPath))) fail(`${reportPath} must exist`);

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
]) includesRequired(report, phrase, 'Gap report');

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
]) includesRequired(report, phrase, 'Gap report');

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

// PR-085 is a historical no-write gap report. Validate its historical inputs
// separately from the later current operating candidates.
const jraCandidate = readJson('data/candidates/japan-jra-candidates.json');
const jraPilot = readJson('data/generated/timetable/jra-pilot-review.json');
const jraIds = sorted((jraCandidate.records ?? []).map((record) => record.meeting_id));
const pilotIds = sorted(jraPilot.normalized?.meeting_ids ?? []);
if (jraCandidate.schema_version !== 'timetable-candidate-v1' || jraCandidate.adapter_id !== 'jra-normalized-programme-candidate-v1') fail('Current JRA candidate envelope differs.');
if ((jraCandidate.records ?? []).length !== 24 || jraPilot.normalized?.candidate_count !== 24) fail('Current JRA candidate/pilot count must remain synchronized at 24.');
if (!exact(jraIds, pilotIds)) fail('Current JRA candidate IDs differ from JRA pilot review.');
if (jraCandidate.generated_at !== jraPilot.generated_at) fail('Current JRA candidate generated_at differs from JRA pilot review.');
if ((jraCandidate.records ?? []).some((record) => record.capability_rank !== 'A+' || record.review_status !== 'needs_review')) fail('Current JRA candidate rank/review state differs.');

const narActivePath = 'data/candidates/japan-nar-candidates.json';
if (existsSync(path.join(root, narActivePath))) fail('Legacy NAR candidate must remain absent from active candidate data.');
const narArchive = readJson('data/archive/timetable/candidates/japan-nar-candidates.v0.json');
if (narArchive.schema_version !== 'timetable-candidates-v0' || narArchive.source_adapter_id !== 'japan-nar-dry-run-adapter') fail('Historical NAR archive identity differs.');
if ((narArchive.records ?? []).length !== 12) fail('Historical NAR archive must retain 12 records.');

for (const [relativePath, expectedCount] of [
  ['data/candidates/japan-banei-candidates.json', 3],
  ['data/candidates/japan-active-window-approved-candidates.json', 19],
]) {
  const file = readJson(relativePath);
  const count = file.records?.length ?? 0;
  if (count !== expectedCount) fail(`${relativePath} must retain ${expectedCount} reviewed records; found ${count}.`);
}

const generatedJapan = readJson('data/generated/japan-active-timetable-records.json');
if ((generatedJapan.records ?? []).length !== 15) fail('Historical Japan active-window generated set must retain 15 records.');

const generatedNar = (generatedJapan.records ?? []).filter((record) => record.racing_type === 'NAR local meeting');
if (generatedNar.length !== 12) fail(`Historical generated NAR set must retain 12 records; found ${generatedNar.length}.`);
if (!generatedNar.every((record) => record.start_time_local === 'Meeting date verified on NAR; exact first start time not stored')) {
  fail('Historical generated NAR records must retain the exact-time-not-stored statement.');
}

const generatedBanei = (generatedJapan.records ?? []).filter((record) => record.racing_type === 'Banei meeting');
if (generatedBanei.length !== 3) fail(`Historical generated Banei set must retain 3 records; found ${generatedBanei.length}.`);

for (const relativePath of [
  'data/generated/japan-public-overlay.json',
  'data/generated/japan-timetable-overlay.json',
  'data/generated/japan-promoted-timetable-records.json',
]) {
  if (existsSync(path.join(root, relativePath))) fail(`${relativePath}: retired public overlay replacement must remain absent.`);
}

for (const relativePath of walkFiles('data/generated')) {
  if (!relativePath.endsWith('.json')) continue;
  const file = readJson(relativePath);
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'japan') {
    fail(`${relativePath}: retired promoted Japan timetable overlay must remain absent.`);
  }
}

const protectedDiffAfter = readProtectedDiff();
if (protectedDiffAfter.status !== 0) {
  fail('Unable to capture protected repository diff after validation.');
} else if (protectedDiffBefore.status === 0 && protectedDiffAfter.stdout !== protectedDiffBefore.stdout) {
  fail('Validator execution must not mutate candidate, generated timetable, or runtime data files.');
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
]) includesRequired(pr, phrase, 'PR-085 runbook');

if (failures.length) {
  console.error('Japan active-window candidate gap report validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Japan active-window candidate gap report validation passed.');
console.log('PR_085_GAP_REPORT_STATE: historical');
console.log('CURRENT_JRA_CANDIDATES: synchronized_24');
console.log('LEGACY_NAR_CANDIDATES: archived_12');
