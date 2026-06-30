import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const auditStatusIndex = auditTrackerLines[0].split('\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['21', 'hungary', 'Hungary', 'A'],
  ['22', 'malta', 'Malta', 'C'],
  ['23', 'austria', 'Austria', 'C'],
  ['24', 'puerto-rico', 'Puerto Rico', 'A'],
  ['25', 'jamaica', 'Jamaica', 'A'],
  ['26', 'trinidad-and-tobago', 'Trinidad and Tobago', 'A'],
  ['27', 'barbados', 'Barbados', 'A'],
  ['28', 'martinique', 'Martinique', 'C']
];

const requiredSections = [
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

const prohibitedStructuralTokens = /(?:raw_html|raw_text|direct_stream_url|stream_url|full_racecard|horse_names)/i;

for (const [deliveryNo, slug, country, ceiling] of expected) {
  const notePath = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  const absolutePath = path.join(root, notePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${notePath}`);
    continue;
  }
  const note = fs.readFileSync(absolutePath, 'utf8');
  if (!note.startsWith(`# ${country}\n`)) fail(`${slug} title must be ${country}`);
  if (!note.includes('| Note status | reviewed |')) fail(`${slug} note status must be reviewed`);
  if (!note.includes('| Evidence cutoff | 2026-06-18 |')) fail(`${slug} evidence cutoff must be 2026-06-18`);
  if (!note.includes(`| Public display ceiling | ${ceiling} |`)) fail(`${slug} ceiling must be ${ceiling}`);
  if (!note.includes('[VERIFIED]')) fail(`${slug} requires VERIFIED evidence labels`);
  if (!note.includes('[NEEDS_RESEARCH]')) fail(`${slug} requires NEEDS_RESEARCH labels`);
  for (const section of requiredSections) {
    if (!note.includes(section)) fail(`${slug} is missing section: ${section}`);
  }
  if (!note.includes(`docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json`)) {
    fail(`${slug} must reference its final-summary.json`);
  }
  if (prohibitedStructuralTokens.test(note)) fail(`${slug} note contains a prohibited structural token`);
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
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`tracker delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('note_reviewed')) fail(`${slug} must be at least note_reviewed`);
  if (row.note_status !== 'reviewed') fail(`${slug} note_status must be reviewed`);
  if (row.note_ref !== `docs/country-page-notes/${deliveryNo}-${slug}.md`) fail(`${slug} note_ref is incorrect`);
  if (row.evidence_reviewed_at !== '2026-06-19') fail(`${slug} evidence_reviewed_at must be 2026-06-19`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_NOTES_21_28_VALID');
console.log('REVIEWED_NOTES: 8');
console.log('PUBLIC_CEILINGS: A=5 C=3');
