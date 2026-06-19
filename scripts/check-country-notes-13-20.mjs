import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['13', 'japan', 'published'],
  ['14', 'hong-kong', 'published'],
  ['15', 'new-zealand', 'published'],
  ['16', 'south-africa', 'published'],
  ['17', 'uruguay', 'published'],
  ['18', 'sweden', 'published'],
  ['19', 'denmark', 'published'],
  ['20', 'czech-republic', 'published']
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

if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);

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
  if (row.profile_status !== 'reviewed') fail(`${slug} profile_status must be reviewed`);
  if (row.qa_status !== 'passed' || row.page_published_at !== '2026-06-18') fail(`${slug} publication QA must be complete`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_NOTES_13_20_VALID');
console.log('REVIEWED_NOTES: 8');
console.log('PUBLIC_BOUNDARY: note files contain no prohibited public field tokens');
