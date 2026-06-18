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

const expectedCountLines = [
  ['published', counts.published ?? 0],
  ['profile_ready', counts.profile_ready ?? 0],
  ['note_reviewed', counts.note_reviewed ?? 0],
  ['source_tested', counts.source_tested ?? 0],
  ['not_started', counts.not_started ?? 0],
  ['total', rows.length]
];

for (const [label, count] of expectedCountLines) {
  const pattern = new RegExp(`^${label}:\\s+${count}$`, 'm');
  if (!pattern.test(roadmap)) fail(`roadmap count is missing or stale: ${label}=${count}`);
}

for (let pr = 284; pr <= 337; pr += 1) {
  if (!roadmap.includes(`#${pr}`)) fail(`roadmap is missing PR #${pr}`);
}

const requiredPhrases = [
  'Current position',
  'Working PR: #296',
  'Next PR: #297',
  'Merged through: PR #295',
  'Final release gate: #337',
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
console.log(`TRACKER_COUNTS: ${expectedCountLines.map(([label, count]) => `${label}=${count}`).join(' ')}`);
console.log('PR_RANGE: 284-337');
