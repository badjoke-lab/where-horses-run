import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);

const readText = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};

const readJson = (relativePath) => {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`${relativePath} must be valid JSON: ${error.message}`);
    return {};
  }
};

const readProtectedDiff = () => spawnSync(
  'git',
  ['diff', '--no-ext-diff', '--binary', '--', 'data/candidates', 'data/generated', 'src/lib/data.ts'],
  { cwd: root, encoding: 'utf8' },
);

const includesRequired = (text, phrase, context) => {
  if (!text.includes(phrase)) fail(`${context} must include ${phrase}`);
};

const countOccurrences = (text, phrase) => text.split(phrase).length - 1;

const walkFiles = (relativeDir) => {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];
  const entries = readdirSync(absoluteDir);
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(root, relativePath);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) files.push(...walkFiles(relativePath));
    else files.push(relativePath.replaceAll(path.sep, '/'));
  }
  return files;
};

const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const protectedDiffBefore = readProtectedDiff();
if (protectedDiffBefore.status !== 0) fail('Unable to capture protected repository diff before validation.');

const verificationPath = 'docs/runbooks/jra-record-level-source-verification.md';
const prPath = 'docs/runbooks/pr-086.md';
const verification = readText(verificationPath);
const pr = readText(prPath);
const packageJson = readJson('package.json');

const expectedRecords = [
  {
    candidate_id: 'japan-jra-2026-05-30-tokyo',
    racecourse_id: 'tokyo-racecourse',
    racecourse_name: 'Tokyo',
    date: '2026-05-30',
    start_time_local: '09:50',
    source_url: 'https://jra.jp/keiba/calendar2026/2026/5/0530.html',
    meeting_label: '2回東京11日',
    first_race_time_japanese: '9時50分',
  },
  {
    candidate_id: 'japan-jra-2026-05-30-kyoto',
    racecourse_id: 'kyoto-racecourse',
    racecourse_name: 'Kyoto',
    date: '2026-05-30',
    start_time_local: '10:05',
    source_url: 'https://jra.jp/keiba/calendar2026/2026/5/0530.html',
    meeting_label: '3回京都11日',
    first_race_time_japanese: '10時05分',
  },
  {
    candidate_id: 'japan-jra-2026-05-31-tokyo',
    racecourse_id: 'tokyo-racecourse',
    racecourse_name: 'Tokyo',
    date: '2026-05-31',
    start_time_local: '09:40',
    source_url: 'https://jra.jp/keiba/calendar2026/2026/5/0531.html',
    meeting_label: '2回東京12日',
    first_race_time_japanese: '9時40分',
  },
  {
    candidate_id: 'japan-jra-2026-05-31-kyoto',
    racecourse_id: 'kyoto-racecourse',
    racecourse_name: 'Kyoto',
    date: '2026-05-31',
    start_time_local: '09:55',
    source_url: 'https://jra.jp/keiba/calendar2026/2026/5/0531.html',
    meeting_label: '3回京都12日',
    first_race_time_japanese: '9時55分',
  },
];

if (!verification.includes('| candidate_id | Meeting date status | First race time status | Comparison result | Next action |')) {
  fail('Verification document must include the required summary table.');
}

for (const phrase of [
  'meeting_date_confirmed',
  'first_race_time_confirmed',
  'first_race_time_needs_manual_review',
  'source_unavailable',
  'source_conflicts_with_candidate',
  'match',
  'mismatch',
  'unresolved',
  'official meeting-date source URL',
  'official first-race-time source URL, if found',
]) includesRequired(verification, phrase, 'Verification document');

for (const record of expectedRecords) {
  for (const [field, value] of Object.entries(record)) includesRequired(verification, value, `${verificationPath} for ${record.candidate_id} (${field})`);
  const heading = `### \`${record.candidate_id}\``;
  includesRequired(verification, heading, 'Verification document record heading');
  const sectionStart = verification.indexOf(heading);
  const nextSectionStart = verification.indexOf('\n### `', sectionStart + heading.length);
  const sectionText = verification.slice(sectionStart, nextSectionStart === -1 ? undefined : nextSectionStart);
  for (const phrase of [
    '| candidate_id |',
    '| racecourse_id |',
    '| racecourse_name |',
    '| date |',
    '| current stored start_time_local |',
    '| official meeting-date source URL |',
    '| official first-race-time source URL, if found |',
    '| evidence status |',
    '| comparison result |',
    '| notes |',
    'meeting_date_confirmed',
    'first_race_time_confirmed',
    'match',
  ]) includesRequired(sectionText, phrase, `${verificationPath} section for ${record.candidate_id}`);
}

const allowedCandidateIds = new Set(expectedRecords.map((record) => record.candidate_id));
for (const candidateMatch of verification.matchAll(/japan-jra-\d{4}-\d{2}-\d{2}-[a-z-]+/g)) {
  if (!allowedCandidateIds.has(candidateMatch[0])) fail(`${verificationPath} must not document unexpected JRA candidate ${candidateMatch[0]}.`);
}

for (const otherSystemPhrase of ['japan-nar-', 'japan-banei-', 'hong-kong-', 'uae-']) {
  if (verification.includes(otherSystemPhrase)) fail(`${verificationPath} must not add or verify non-JRA candidate records (${otherSystemPhrase}).`);
}

const forbiddenCoverageClaims = [
  /Japan\s+(?:is\s+)?complete/i,
  /JRA\s+(?:is\s+)?complete/i,
  /Japan timetable coverage is comprehensive/i,
  /JRA coverage is comprehensive/i,
];
for (const pattern of forbiddenCoverageClaims) {
  const matches = verification.match(pattern) ?? [];
  for (const match of matches) {
    const offset = verification.indexOf(match);
    const context = verification.slice(Math.max(0, offset - 80), offset + match.length + 80).toLowerCase();
    if (!context.includes('does not claim') && !context.includes('does not make') && !context.includes('not claim')) {
      fail(`${verificationPath} must not make a coverage claim: ${match}`);
    }
  }
}

// The four May 2026 records above are the immutable PR-086 evidence set.
// Current operational candidates are validated through the synchronized JRA
// pilot review rather than forced back to the PR-086 count and schema.
const jraCandidates = readJson('data/candidates/japan-jra-candidates.json');
const jraPilot = readJson('data/generated/timetable/jra-pilot-review.json');
const candidateRecords = jraCandidates.records ?? [];
const candidateIds = sorted(candidateRecords.map((record) => record.meeting_id));
const pilotIds = sorted(jraPilot.normalized?.meeting_ids ?? []);
if (jraCandidates.schema_version !== 'timetable-candidate-v1' || jraCandidates.adapter_id !== 'jra-normalized-programme-candidate-v1') fail('Current JRA candidate envelope differs.');
if (candidateRecords.length !== 24 || jraPilot.normalized?.candidate_count !== 24) fail(`Current JRA candidate/pilot count must remain synchronized at 24; found ${candidateRecords.length}.`);
if (!exact(candidateIds, pilotIds)) fail('Current JRA candidate IDs differ from synchronized pilot review.');
if (jraCandidates.generated_at !== jraPilot.generated_at) fail('Current JRA candidate generated_at differs from pilot review.');
if (candidateRecords.some((record) => record.capability_rank !== 'A+' || record.review_status !== 'needs_review')) fail('Current JRA candidate rank/review boundary differs.');
if (jraPilot.boundaries?.candidate_approved !== false || jraPilot.boundaries?.canonical_written !== false || jraPilot.boundaries?.public_projection_written !== false) fail('Current JRA pilot no-write boundary differs.');

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
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'japan') fail(`${relativePath}: retired promoted Japan timetable overlay must remain absent.`);
}

const protectedDiffAfter = readProtectedDiff();
if (protectedDiffAfter.status !== 0) {
  fail('Unable to capture protected repository diff after validation.');
} else if (protectedDiffBefore.status === 0 && protectedDiffAfter.stdout !== protectedDiffBefore.stdout) {
  fail('Validator execution must not mutate candidate, generated timetable, or runtime data files.');
}

if (packageJson.scripts?.['validate:jra-record-level-source-verification'] !== 'node scripts/check-jra-record-level-source-verification.mjs') {
  fail('package.json must define validate:jra-record-level-source-verification.');
}

const checkScript = packageJson.scripts?.check ?? '';
if (!checkScript.includes('validate:japan-active-window-candidate-gap-report && npm run validate:jra-record-level-source-verification')) {
  fail('npm run check must include validate:jra-record-level-source-verification after validate:japan-active-window-candidate-gap-report.');
}

for (const phrase of [
  'Summary',
  'Files',
  'Records verified',
  'Official sources used',
  'Verification result',
  'Unresolved items',
  'What this does not do',
  'Validation commands',
  'Next PR: PR-087 JRA active-window source acquisition matrix',
]) includesRequired(pr, phrase, 'PR-086 runbook');

for (const record of expectedRecords) includesRequired(pr, record.candidate_id, 'PR-086 runbook');
for (const url of ['https://jra.jp/keiba/calendar2026/2026/5/0530.html', 'https://jra.jp/keiba/calendar2026/2026/5/0531.html']) {
  if (countOccurrences(verification, url) < 2) fail(`${verificationPath} must include official JRA source URL ${url}.`);
  includesRequired(pr, url, 'PR-086 runbook official sources');
}

if (failures.length) {
  console.error('JRA record-level source verification validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('JRA record-level source verification validation passed.');
console.log('PR_086_RECORD_VERIFICATION_STATE: historical');
console.log('CURRENT_JRA_CANDIDATES: synchronized_24');
console.log('LEGACY_NAR_CANDIDATES: archived_12');
