import fs from 'node:fs';

const roadmap = fs.readFileSync('docs/country-pages/programme-roadmap.md', 'utf8');
const tracker = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const headers = tracker[0].split('\t');
const statusIndex = headers.indexOf('programme_status');
const rows = tracker.slice(1).map((line) => line.split('\t'));
const errors = [];
if (rows.length !== 98) errors.push('tracker row count must be 98');
if (rows.some((row) => row[statusIndex] !== 'published')) errors.push('all tracker rows must be published');
for (const phrase of ['Status: complete canonical roadmap', 'Completed Work ID: WHR-AUDIT-COUNTRY-CALENDAR-98', 'published:       98', 'bilingual routes exactly 196', 'PR #356']) {
  if (!roadmap.includes(phrase)) errors.push('missing roadmap phrase: ' + phrase);
}
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('COUNTRY_PAGE_PROGRAMME_ROADMAP_VALID');
console.log('COUNTRY_PAGE_PROGRAMME_COMPLETE: 98 countries / 196 routes');
