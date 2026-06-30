import fs from 'node:fs';

const roadmap = fs.readFileSync('docs/country-pages/programme-roadmap.md', 'utf8');
const tracker = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const headers = tracker[0].split('\t');
const statusIndex = headers.indexOf('programme_status');
const rows = tracker.slice(1).map((line) => line.split('\t'));
const errors = [];
const counts = {};

if (rows.length !== 98) errors.push('tracker row count must be 98');
for (const row of rows) counts[row[statusIndex]] = (counts[row[statusIndex]] || 0) + 1;
for (const [status, count] of Object.entries(counts)) {
  if (!new RegExp('^' + status + ':\\s+' + count + '$', 'm').test(roadmap)) errors.push('stale roadmap count: ' + status);
}
for (const phrase of ['Current Work ID: WHR-NOTE-69-76', 'Next working branch: country-notes-69-76', 'Latest completed Source Test v2 change: PR #335', 'Publication gate: PR #333', 'Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98', 'tracker rows exactly 98', 'bilingual routes exactly 196']) {
  if (!roadmap.includes(phrase)) errors.push('missing roadmap phrase: ' + phrase);
}
for (const number of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 335, 340]) {
  if (!roadmap.includes('#' + number)) errors.push('missing PR #' + number);
}
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('COUNTRY_PAGE_PROGRAMME_ROADMAP_VALID');
console.log('CURRENT_WORK: entries 69-76 source-tested; current Work ID WHR-NOTE-69-76');
