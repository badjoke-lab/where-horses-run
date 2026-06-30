import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['77', 'kazakhstan', 'Kazakhstan', 'prototype_ready'],
  ['78', 'egypt', 'Egypt', 'link_only'],
  ['79', 'algeria', 'Algeria', 'link_only'],
  ['80', 'iran', 'Iran', 'link_only'],
  ['81', 'vietnam', 'Vietnam', 'manual_ready'],
  ['82', 'bolivia', 'Bolivia', 'blocked'],
  ['83', 'guatemala', 'Guatemala', 'link_only'],
  ['84', 'honduras', 'Honduras', 'blocked']
];
const sections = [
  '## Metadata', '## Evidence labels', '## Page-ready verified facts', '## Racing structure',
  '## Governing and organising body', '## Racecourses observed', '## Programme format',
  '## Limitations and cautions', '## Claims not yet safe for publication',
  '## Fresh research required', '## Source-test references', '## Editorial handoff'
];
const prohibited = /(?:raw_html|raw_text|direct_stream_url|stream_url|full_racecard|horse_names|runner_names|jockey_names|trainer_names|odds_data|payout_data)/i;

function parseTsv(file) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
}

const baseRows = parseTsv('docs/country-pages/98-country-tracker.tsv');
const trackerByDelivery = new Map(baseRows.map((row) => [row.delivery_no, row]));
for (const file of [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv',
  'docs/country-pages/98-country-note-transitions-77-84.tsv'
]) {
  for (const change of parseTsv(file)) {
    const row = trackerByDelivery.get(change.delivery_no);
    if (!row) {
      fail(`${file}: unknown delivery ${change.delivery_no}`);
      continue;
    }
    for (const [field, value] of Object.entries(change)) {
      if (field !== 'delivery_no' && value !== '') row[field] = value;
    }
  }
}

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
  if (!note.includes('| Evidence cutoff | 2026-06-30 |')) fail(`${slug}: evidence cutoff mismatch`);
  if (!note.includes('| Technical rank | C |') || !note.includes('| Public display ceiling | C |')) fail(`${slug}: rank and ceiling must remain C`);
  if (!note.includes(`| Calendar readiness | ${readiness} |`)) fail(`${slug}: readiness metadata mismatch`);
  if (!note.includes('[VERIFIED]') || !note.includes('[NEEDS_RESEARCH]')) fail(`${slug}: evidence labels incomplete`);
  for (const section of sections) if (!note.includes(section)) fail(`${slug}: missing ${section}`);
  const sourceTestRef = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!note.includes(sourceTestRef)) fail(`${slug}: Source Test v2 reference missing`);
  if (prohibited.test(note)) fail(`${slug}: prohibited structural token found`);
  const sourceTest = JSON.parse(fs.readFileSync(path.join(root, sourceTestRef), 'utf8'));
  if (sourceTest.public_safe !== true || sourceTest.delivery_no !== deliveryNo || sourceTest.country_id !== slug) fail(`${slug}: Source Test identity mismatch`);
  if (sourceTest.records?.length !== 1 || sourceTest.records[0].readiness !== readiness || sourceTest.records[0].public_ceiling !== 'C') fail(`${slug}: Source Test boundary mismatch`);

  const row = trackerByDelivery.get(deliveryNo);
  if (!row || row.slug !== slug || row.programme_status !== 'note_reviewed') fail(`${slug}: effective tracker status mismatch`);
  if (row && row.note_status !== 'reviewed') fail(`${slug}: note_status mismatch`);
  if (row && row.note_ref !== relative) fail(`${slug}: note_ref mismatch`);
  if (row && row.evidence_reviewed_at !== '2026-06-30') fail(`${slug}: evidence date mismatch`);
  if (row && (row.profile_status !== 'not_started' || row.en_route_status !== 'missing' || row.ja_route_status !== 'missing' || row.qa_status !== 'not_started' || row.page_published_at)) fail(`${slug}: profile or publication state advanced too early`);
}

const counts = {};
for (const row of trackerByDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 76 || counts.note_reviewed !== 8 || counts.not_started !== 14) fail(`effective programme counts mismatch ${JSON.stringify(counts)}`);

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_NOTES_77_84_VALID reviewed=8 public_ceiling_C=8');
console.log('PROGRAMME_COUNTS published=76 note_reviewed=8 not_started=14');
console.log('READINESS_MIX prototype_ready=1 manual_ready=1 link_only=4 blocked=2');
