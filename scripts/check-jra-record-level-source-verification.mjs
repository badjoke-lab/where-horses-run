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
]) {
  includesRequired(verification, phrase, 'Verification document');
}

for (const record of expectedRecords) {
  for (const [field, value] of Object.entries(record)) {
    includesRequired(verification, value, `${verificationPath} for ${record.candidate_id} (${field})`);
  }

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
  ]) {
    includesRequired(sectionText, phrase, `${verificationPath} section for ${record.candidate_id}`);
  }
}

const allowedCandidateIds = new Set(expectedRecords.map((record) => record.candidate_id));
for (const candidateMatch of verification.matchAll(/japan-jra-\d{4}-\d{2}-\d{2}-[a-z-]+/g)) {
  if (!allowedCandidateIds.has(candidateMatch[0])) {
    fail(`${verificationPath} must not document unexpected JRA candidate ${candidateMatch[0]}.`);
  }
}

for (const otherSystemPhrase of ['japan-nar-', 'japan-banei-', 'hong-kong-', 'uae-']) {
  if (verification.includes(otherSystemPhrase)) {
    fail(`${verificationPath} must not add or verify non-JRA candidate records (${otherSystemPhrase}).`);
  }
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

const jraCandidates = readJson('data/candidates/japan-jra-candidates.json');
const candidateRecords = jraCandidates.records ?? [];
if (candidateRecords.length !== expectedRecords.length) {
  fail(`data/candidates/japan-jra-candidates.json must retain exactly ${expectedRecords.length} records; found ${candidateRecords.length}.`);
}
for (const expected of expectedRecords) {
  const actual = candidateRecords.find((record) => record.candidate_id === expected.candidate_id);
  if (!actual) {
    fail(`data/candidates/japan-jra-candidates.json is missing ${expected.candidate_id}.`);
    continue;
  }
  for (const field of ['racecourse_id', 'racecourse_name', 'date', 'start_time_local']) {
    if (actual[field] !== expected[field]) {
      fail(`${expected.candidate_id} ${field} must remain ${expected[field]}; found ${actual[field]}.`);
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
    fail(`${relativePath} must retain ${expectedCount} records; found ${count}. PR-086 must not add candidate records.`);
  }
}

const generatedJapan = readJson('data/generated/japan-active-timetable-records.json');
if ((generatedJapan.records ?? []).length !== 15) {
  fail('data/generated/japan-active-timetable-records.json must retain 15 records; PR-086 must not modify generated timetable records.');
}

for (const relativePath of [
  'data/generated/japan-public-overlay.json',
  'data/generated/japan-timetable-overlay.json',
  'data/generated/japan-promoted-timetable-records.json',
]) {
  if (existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: PR-086 must not add a public overlay replacement.`);
  }
}

for (const relativePath of walkFiles('data/generated')) {
  if (!relativePath.endsWith('.json')) continue;
  const file = readJson(relativePath);
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'japan') {
    fail(`${relativePath}: PR-086 must not add a promoted Japan timetable overlay.`);
  }
}

const changedResult = spawnSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' });
if (changedResult.status === 0) {
  const changedFiles = changedResult.stdout.trim().split('\n').filter(Boolean);
  for (const relativePath of changedFiles) {
    if (relativePath.startsWith('data/candidates/')) fail(`${relativePath}: PR-086 must not change candidate data files.`);
    if (relativePath.startsWith('data/generated/')) fail(`${relativePath}: PR-086 must not change generated timetable files.`);
    if (relativePath === 'src/lib/data.ts') fail('src/lib/data.ts: PR-086 must not add public overlay replacement/runtime changes.');
  }
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
]) {
  includesRequired(pr, phrase, 'PR-086 runbook');
}

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
