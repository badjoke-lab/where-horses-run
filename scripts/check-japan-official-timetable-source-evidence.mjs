import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`${relativePath} is missing`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function readJson(relativePath) {
  const text = readRequired(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must be valid JSON: ${error.message}`);
    return null;
  }
}

function walkFiles(relativeDir) {
  const fullDir = path.join(root, relativeDir);
  if (!existsSync(fullDir)) return [];

  const files = [];
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(relativePath));
    else files.push(relativePath);
  }
  return files;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHeading(text, heading) {
  return new RegExp(`^#{2,4}\\s+${escapeRegex(heading)}\\s*$`, 'm').test(text);
}

function sectionBetween(text, heading) {
  const startPattern = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*$`, 'm');
  const startMatch = startPattern.exec(text);
  if (!startMatch) return '';
  const start = startMatch.index;
  const rest = text.slice(start + startMatch[0].length);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function includesRequired(text, needle, label) {
  if (!text.includes(needle)) fail(`${label} must include: ${needle}`);
}

function assertSectionIncludes(section, system, phrases) {
  for (const phrase of phrases) {
    if (!section.toLowerCase().includes(phrase.toLowerCase())) {
      fail(`${system} section must include ${phrase}`);
    }
  }
}

function assertNoPositiveClaim(text, pattern, label) {
  const lines = text.split('\n');
  for (const line of lines) {
    if (!pattern.test(line)) continue;
    const normalized = line.toLowerCase();
    const allowedNegative = [
      'does not claim',
      'do not claim',
      'must not claim',
      'not claim',
      'not complete',
      'not confirmed',
      'cannot be called',
      'no complete',
      'no public',
      'coverage is not complete',
      'not timetable coverage',
      'not a confirmed stable',
      'is not verified',
      'before any future',
    ].some((phrase) => normalized.includes(phrase));
    if (!allowedNegative) fail(`${label} appears to make a prohibited positive coverage claim: ${line.trim()}`);
  }
}

const evidence = readRequired('docs/runbooks/japan-official-timetable-source-evidence.md');
const pr = readRequired('docs/runbooks/pr-084.md');
const packageJson = readJson('package.json');

includesRequired(evidence, 'Japan official timetable source evidence', 'Evidence document');
includesRequired(evidence, 'Comparison table', 'Evidence document');
includesRequired(evidence, 'No new Japan candidate timetable records', 'Evidence document');
includesRequired(evidence, 'No public overlay replacement', 'Evidence document');
includesRequired(evidence, 'Asia/Tokyo', 'Evidence document');

for (const system of ['JRA', 'NAR', 'Banei']) {
  if (!hasHeading(evidence, system)) fail(`Evidence document must include a ${system} section`);
  const section = sectionBetween(evidence, system);
  if (!section) continue;

  assertSectionIncludes(section, system, [
    'Racecourse inventory source',
    'Fixture/calendar source',
    'Meeting date source',
    'First race time source',
    'Timezone assumption',
    'Current repo candidate/bundle status',
    'Gaps before promotion',
  ]);

  if (!/https?:\/\//.test(section)) fail(`${system} section must include official source URLs`);
}

for (const phrase of [
  'Official JRA racecourse',
  'Sapporo',
  'Hakodate',
  'Fukushima',
  'Niigata',
  'Tokyo',
  'Nakayama',
  'Chukyo',
  'Kyoto',
  'Hanshin',
  'Kokura',
  'source_needs_manual_review',
  'First-race-time extraction is therefore not verified',
  'source_found_date_specific_only',
  'not verify a stable, single all-racecourse annual/monthly calendar source',
  'Obihiro is the Banei venue',
  'meeting dates and first race times',
]) {
  includesRequired(evidence, phrase, 'Evidence document');
}

for (const column of [
  '| System | Official source URL | Evidence status | What it proves | Current repo status | Remaining gap | Next action |',
  '| JRA |',
  '| NAR |',
  '| Banei |',
]) {
  includesRequired(evidence, column, 'Comparison table');
}

assertNoPositiveClaim(evidence, /\bJapan\s+(?:is\s+)?complete\b/i, 'Evidence document');
assertNoPositiveClaim(evidence, /\bJRA\s+(?:is\s+)?complete\b/i, 'Evidence document');
assertNoPositiveClaim(evidence, /\bNAR\s+covered\b/i, 'Evidence document');
assertNoPositiveClaim(evidence, /\bBanei\s+covered\b/i, 'Evidence document');
assertNoPositiveClaim(evidence, /\bcomplete coverage\b/i, 'Evidence document');
assertNoPositiveClaim(evidence, /\bpublic overlay replacement\b/i, 'Evidence document');

for (const phrase of [
  'Summary',
  'Files',
  'Official evidence used',
  'What was verified',
  'What remains unresolved',
  'What this does not do',
  'Validation commands',
  'Next PR: PR-085 Japan active-window candidate gap report',
]) {
  includesRequired(pr, phrase, 'PR-084 runbook');
}

const expectedCandidateCounts = new Map([
  ['data/candidates/japan-jra-candidates.json', 4],
  ['data/candidates/japan-nar-candidates.json', 12],
  ['data/candidates/japan-banei-candidates.json', 3],
  ['data/candidates/japan-active-window-approved-candidates.json', 19],
]);

for (const [relativePath, expectedCount] of expectedCandidateCounts) {
  const file = readJson(relativePath);
  if (!file) continue;
  const records = file.records ?? [];
  if (records.length !== expectedCount) {
    fail(`${relativePath} must retain ${expectedCount} records; found ${records.length}. PR-084 must not add new candidate timetable records.`);
  }
}

const generatedJapan = readJson('data/generated/japan-active-timetable-records.json');
if (generatedJapan && (generatedJapan.records ?? []).length !== 15) {
  fail('data/generated/japan-active-timetable-records.json must retain 15 records; PR-084 must not add generated Japan timetable records');
}

for (const relativePath of [
  'data/generated/japan-public-overlay.json',
  'data/generated/japan-timetable-overlay.json',
  'data/generated/japan-promoted-timetable-records.json',
]) {
  if (existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: PR-084 must not add a public overlay replacement`);
  }
}

for (const relativePath of walkFiles('data/generated')) {
  if (!relativePath.endsWith('.json')) continue;
  const file = readJson(relativePath);
  if (!file) continue;
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'japan') {
    fail(`${relativePath}: PR-084 must not add a promoted Japan timetable overlay`);
  }
}

if (packageJson?.scripts?.['validate:japan-official-timetable-source-evidence'] !== 'node scripts/check-japan-official-timetable-source-evidence.mjs') {
  fail('package.json must define validate:japan-official-timetable-source-evidence');
}

const checkScript = packageJson?.scripts?.check ?? '';
if (!checkScript.includes('validate:uae-official-racecourse-inventory && npm run validate:japan-official-timetable-source-evidence')) {
  fail('npm run check must include validate:japan-official-timetable-source-evidence after validate:uae-official-racecourse-inventory');
}

if (failures.length) {
  console.error('Japan official timetable source evidence validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Japan official timetable source evidence validation passed.');
