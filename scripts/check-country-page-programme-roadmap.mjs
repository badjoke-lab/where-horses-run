import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roadmapPath = path.join(root, 'docs/country-pages/programme-roadmap.md');
const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const errors = [];
const fail = (message) => errors.push(message);

if (!fs.existsSync(roadmapPath)) fail('missing docs/country-pages/programme-roadmap.md');
if (!fs.existsSync(trackerPath)) fail('missing docs/country-pages/98-country-tracker.tsv');
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

const roadmap = fs.readFileSync(roadmapPath, 'utf8');
const trackerLines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const statusIndex = headers.indexOf('programme_status');
if (statusIndex < 0) fail('tracker is missing programme_status');

const rows = trackerLines.slice(1).map((line) => line.split('\t'));
if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);

const counts = rows.reduce((result, row) => {
  const status = row[statusIndex] ?? '';
  result[status] = (result[status] ?? 0) + 1;
  return result;
}, {});

const allCountLines = [
  ['published', counts.published ?? 0],
  ['profile_ready', counts.profile_ready ?? 0],
  ['note_reviewed', counts.note_reviewed ?? 0],
  ['source_tested', counts.source_tested ?? 0],
  ['not_started', counts.not_started ?? 0],
  ['total', rows.length]
];
const alwaysRequired = new Set(['published', 'profile_ready', 'not_started', 'total']);
const expectedCountLines = allCountLines.filter(([label, count]) => alwaysRequired.has(label) || count > 0);

for (const [label, count] of expectedCountLines) {
  const pattern = new RegExp(`^${label}:\\s+${count}$`, 'm');
  if (!pattern.test(roadmap)) fail(`roadmap count is missing or stale: ${label}=${count}`);
}

for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 340]) {
  if (!roadmap.includes(`#${pr}`)) fail(`roadmap is missing key PR #${pr}`);
}

const requiredPhrases = [
  'Current position',
  'Publication gate: PR #325',
  'Current Work ID: WHR-PUB-53-60',
  'Next working branch: country-publish-53-60',
  'Latest completed Source Test v2 change: PR #326',
  'Latest completed reviewed-note change: PR #327',
  'Latest completed Profile v2 change: PR #328',
  'Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98',
  'Local work is requested only when',
  'Standard four-PR wave',
  'Public display boundary',
  'Roadmap maintenance rules',
  'tracker rows exactly 98',
  'bilingual routes exactly 196'
];
for (const phrase of requiredPhrases) {
  if (!roadmap.includes(phrase)) fail(`roadmap is missing required phrase: ${phrase}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_PAGE_PROGRAMME_ROADMAP_VALID');
console.log(`TRACKER_COUNTS: ${allCountLines.map(([label, count]) => `${label}=${count}`).join(' ')}`);
console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,340');
console.log('CURRENT_WORK: entries 53-60 profile-ready; current Work ID WHR-PUB-53-60');
