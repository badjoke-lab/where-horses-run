import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['61', 'slovenia', 'Slovenia', 'link_only'],
  ['62', 'croatia', 'Croatia', 'manual_ready'],
  ['63', 'dominican-republic', 'Dominican Republic', 'prototype_ready'],
  ['64', 'tunisia', 'Tunisia', 'manual_ready'],
  ['65', 'lebanon', 'Lebanon', 'link_only'],
  ['66', 'libya', 'Libya', 'link_only'],
  ['67', 'mainland-china', 'Mainland China', 'blocked'],
  ['68', 'indonesia', 'Indonesia', 'manual_ready'],
];
const sections = [
  '## Metadata', '## Evidence labels', '## Page-ready verified facts', '## Racing structure',
  '## Governing and organising body', '## Racecourses observed', '## Programme format',
  '## Limitations and cautions', '## Claims not yet safe for publication',
  '## Fresh research required', '## Source-test references', '## Editorial handoff',
];
const prohibited = /(?:raw_html|raw_text|direct_stream_url|stream_url|full_racecard|horse_names|runner_names|jockey_names|trainer_names|odds_data|payout_data)/i;

for (const [deliveryNo, slug, country, readiness] of expected) {
  const relative = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) {
    fail(`missing ${relative}`);
    continue;
  }
  const note = fs.readFileSync(absolute, 'utf8');
  if (!note.startsWith(`# ${country}\n`)) fail(`${slug}: title mismatch`);
  if (!note.includes('| Note status | reviewed |')) fail(`${slug}: note status must be reviewed`);
  if (!note.includes('| Evidence cutoff | 2026-06-29 |')) fail(`${slug}: evidence cutoff mismatch`);
  if (!note.includes('| Public display ceiling | C |')) fail(`${slug}: public ceiling must be C`);
  if (!note.includes(`| Calendar readiness | ${readiness} |`)) fail(`${slug}: readiness metadata must be ${readiness}`);
  if (!note.includes('[VERIFIED]') || !note.includes('[NEEDS_RESEARCH]')) fail(`${slug}: evidence labels are incomplete`);
  for (const section of sections) if (!note.includes(section)) fail(`${slug}: missing ${section}`);
  const sourceTestRef = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!note.includes(sourceTestRef)) fail(`${slug}: Source Test v2 reference is missing`);
  if (prohibited.test(note)) fail(`${slug}: prohibited structural token found`);
  const sourceTest = JSON.parse(fs.readFileSync(path.join(root, sourceTestRef), 'utf8'));
  if (sourceTest.public_safe !== true || sourceTest.delivery_no !== deliveryNo || sourceTest.country_id !== slug) fail(`${slug}: Source Test v2 identity mismatch`);
  if (sourceTest.records?.length !== 1 || sourceTest.records[0].readiness !== readiness) fail(`${slug}: Source Test v2 readiness mismatch`);
  if (sourceTest.records?.[0]?.public_ceiling !== 'C') fail(`${slug}: Source Test v2 public ceiling must be C`);
}

const lines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const rows = lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(`tracker mismatch for ${deliveryNo}-${slug}`);
  else {
    if (!['note_reviewed', 'profile_ready', 'page_qa', 'published'].includes(row.programme_status)) fail(`${slug}: must retain at least note_reviewed state`);
    if (row.note_status !== 'reviewed') fail(`${slug}: note_status must be reviewed`);
    if (row.note_ref !== `docs/country-page-notes/${deliveryNo}-${slug}.md`) fail(`${slug}: note_ref mismatch`);
    if (row.evidence_reviewed_at !== '2026-06-29') fail(`${slug}: evidence date mismatch`);
    if (row.programme_status === 'note_reviewed') {
      if (row.profile_status !== 'not_started') fail(`${slug}: profile must remain not_started`);
      if (row.en_route_status !== 'missing' || row.ja_route_status !== 'missing') fail(`${slug}: routes must remain missing`);
      if (row.qa_status !== 'not_started' || row.page_published_at) fail(`${slug}: publication state must remain untouched`);
    }
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_NOTES_61_68_VALID reviewed=8 public_ceiling_C=8');
console.log('READINESS_MIX manual_ready=3 prototype_ready=1 link_only=3 blocked=1');
