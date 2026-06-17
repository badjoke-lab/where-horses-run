import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['13', 'japan', 'profile_ready'],
  ['14', 'hong-kong', 'profile_ready'],
  ['15', 'new-zealand', 'note_reviewed'],
  ['16', 'south-africa', 'note_reviewed'],
  ['17', 'uruguay', 'note_reviewed'],
  ['18', 'sweden', 'note_reviewed'],
  ['19', 'denmark', 'note_reviewed'],
  ['20', 'czech-republic', 'note_reviewed']
];

const requiredSections = [
  '## Metadata',
  '## Evidence labels',
  '## Page-ready verified facts',
  '## Racing structure',
  '## Programme format',
  '## Limitations and cautions',
  '## Claims not yet safe for publication',
  '## Fresh research required',
  '## Source-test references',
  '## Editorial handoff'
];
const prohibited = /(?:raw_html|direct_stream_url|full_racecard|horse_names|jockeys|trainers|odds|results|payouts|predictions)/i;

for (const [deliveryNo, slug] of expected) {
  const notePath = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  const absolutePath = path.join(root, notePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${notePath}`);
    continue;
  }
  const note = fs.readFileSync(absolutePath, 'utf8');
  if (!note.includes('| Note status | reviewed |')) fail(`${slug} note status must be reviewed`);
  if (!note.includes('| Evidence cutoff | 2026-06-17 |')) fail(`${slug} evidence cutoff must be 2026-06-17`);
  if (!note.includes(`[VERIFIED]`)) fail(`${slug} requires VERIFIED evidence labels`);
  if (!note.includes(`[NEEDS_RESEARCH]`)) fail(`${slug} requires NEEDS_RESEARCH labels`);
  for (const section of requiredSections) {
    if (!note.includes(section)) fail(`${slug} is missing section: ${section}`);
  }
  if (!note.includes(`docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json`)) {
    fail(`${slug} must reference its final-summary.json`);
  }
  if (prohibited.test(note)) fail(`${slug} note contains a prohibited public field token`);
}

const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const rows = lines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
}).filter(Boolean);

for (const [deliveryNo, slug, programmeStatus] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row) {
    fail(`missing tracker delivery ${deliveryNo}`);
    continue;
  }
  const notePath = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  if (row.slug !== slug) fail(`delivery ${deliveryNo} slug must be ${slug}`);
  if (row.programme_status !== programmeStatus) fail(`${slug} programme_status must be ${programmeStatus}`);
  if (row.note_status !== 'reviewed') fail(`${slug} note_status must be reviewed`);
  if (row.note_ref !== notePath) fail(`${slug} note_ref must be ${notePath}`);
  if (row.evidence_reviewed_at !== '2026-06-17') fail(`${slug} evidence_reviewed_at must be 2026-06-17`);
}

const counts = rows.reduce((result, row) => {
  result[row.programme_status] = (result[row.programme_status] ?? 0) + 1;
  return result;
}, {});
if ((counts.published ?? 0) !== 12) fail('tracker must contain 12 published rows');
if ((counts.profile_ready ?? 0) !== 2) fail('tracker must contain 2 profile_ready rows');
if ((counts.note_reviewed ?? 0) !== 6) fail('tracker must contain 6 note_reviewed rows');
if ((counts.not_started ?? 0) !== 78) fail('tracker must contain 78 not_started rows');

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_NOTES_13_20_VALID');
console.log('REVIEWED_NOTES: 8');
console.log('TRACKER_COUNTS: published=12 profile_ready=2 note_reviewed=6 not_started=78');
console.log('PUBLIC_BOUNDARY: note files contain no prohibited public field tokens');
