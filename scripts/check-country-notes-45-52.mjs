import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['45', 'norway', 'Norway'],
  ['46', 'finland', 'Finland'],
  ['47', 'netherlands', 'Netherlands'],
  ['48', 'switzerland', 'Switzerland'],
  ['49', 'poland', 'Poland'],
  ['50', 'romania', 'Romania'],
  ['51', 'serbia', 'Serbia'],
  ['52', 'slovakia', 'Slovakia']
];
const sections = [
  '## Metadata',
  '## Evidence labels',
  '## Page-ready verified facts',
  '## Racing structure',
  '## Governing and organising body',
  '## Racecourses observed',
  '## Programme format',
  '## Limitations and cautions',
  '## Claims not yet safe for publication',
  '## Fresh research required',
  '## Source-test references',
  '## Editorial handoff'
];
const prohibited = /(?:raw_html|raw_text|direct_stream_url|stream_url|full_racecard|horse_names)/i;

for (const [deliveryNo, slug, country] of expected) {
  const relative = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) {
    fail(`missing ${relative}`);
    continue;
  }
  const note = fs.readFileSync(absolute, 'utf8');
  if (!note.startsWith(`# ${country}\n`)) fail(`${slug} title must be ${country}`);
  if (!note.includes('| Note status | reviewed |')) fail(`${slug} note status must be reviewed`);
  if (!note.includes('| Evidence cutoff | 2026-06-20 |')) fail(`${slug} evidence cutoff mismatch`);
  if (!note.includes('| Public display ceiling | C |')) fail(`${slug} ceiling must be C`);
  if (!note.includes('[VERIFIED]') || !note.includes('[NEEDS_RESEARCH]')) fail(`${slug} evidence labels are incomplete`);
  for (const section of sections) if (!note.includes(section)) fail(`${slug} is missing ${section}`);
  if (!note.includes(`docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json`)) fail(`${slug} source-test reference is missing`);
  if (prohibited.test(note)) fail(`${slug} contains a prohibited structural token`);
}

const lines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
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

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`tracker delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (!['note_reviewed', 'profile_ready', 'page_qa', 'published'].includes(row.programme_status)) {
    fail(`${slug} must retain at least note_reviewed state`);
  }
  if (row.note_status !== 'reviewed') fail(`${slug} note_status must be reviewed`);
  if (row.note_ref !== `docs/country-page-notes/${deliveryNo}-${slug}.md`) fail(`${slug} note_ref is incorrect`);
  if (row.evidence_reviewed_at !== '2026-06-20') fail(`${slug} evidence review date mismatch`);

  if (row.programme_status === 'note_reviewed') {
    if (row.profile_status !== 'not_started') fail(`${slug} note-reviewed profile must remain not_started`);
    if (row.en_route_status !== 'missing' || row.ja_route_status !== 'missing') fail(`${slug} note-reviewed routes must remain missing`);
  } else {
    if (!['reviewed', 'reviewed_seed'].includes(row.profile_status)) fail(`${slug} later state must retain a reviewed profile`);
    if (!['complete', 'published'].includes(row.en_route_status) || !['complete', 'published'].includes(row.ja_route_status)) {
      fail(`${slug} later state must retain complete bilingual routes`);
    }
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_NOTES_45_52_VALID');
console.log('REVIEWED_NOTES: 8');
console.log('PUBLIC_CEILINGS: C=8');
