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
  ['53', 'cyprus', 'Cyprus', 'manual_ready'],
  ['54', 'panama', 'Panama', 'prototype_ready'],
  ['55', 'kuwait', 'Kuwait', 'link_only'],
  ['56', 'kenya', 'Kenya', 'manual_ready'],
  ['57', 'pakistan', 'Pakistan', 'link_only'],
  ['58', 'ecuador', 'Ecuador', 'manual_ready'],
  ['59', 'venezuela', 'Venezuela', 'blocked'],
  ['60', 'belgium', 'Belgium', 'prototype_ready'],
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
  '## Editorial handoff',
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
  if (!note.startsWith(`# ${country}\n`)) fail(`${slug}: title must be ${country}`);
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
  if (sourceTest.public_safe !== true || sourceTest.delivery_no !== deliveryNo || sourceTest.country_id !== slug) fail(`${slug}: invalid Source Test v2 identity`);
  if (sourceTest.evidence_reviewed_at !== '2026-06-29') fail(`${slug}: Source Test v2 review date mismatch`);
  if (sourceTest.records?.length !== 1 || sourceTest.records[0].readiness !== readiness) fail(`${slug}: Source Test v2 readiness mismatch`);
  if (sourceTest.records?.[0]?.public_ceiling !== 'C') fail(`${slug}: Source Test v2 public ceiling must be C`);
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
  if (!['note_reviewed', 'profile_ready', 'page_qa', 'published'].includes(row.programme_status)) fail(`${slug}: must retain at least note_reviewed state`);
  if (row.note_status !== 'reviewed') fail(`${slug}: note_status must be reviewed`);
  if (row.note_ref !== `docs/country-page-notes/${deliveryNo}-${slug}.md`) fail(`${slug}: note_ref is incorrect`);
  if (row.evidence_reviewed_at !== '2026-06-29') fail(`${slug}: evidence review date mismatch`);
  if (row.programme_status === 'note_reviewed') {
    if (row.profile_status !== 'not_started') fail(`${slug}: profile must remain not_started`);
    if (row.en_route_status !== 'missing' || row.ja_route_status !== 'missing') fail(`${slug}: routes must remain missing`);
    if (row.qa_status !== 'not_started' || row.page_published_at) fail(`${slug}: publication state must remain untouched`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_NOTES_53_60_VALID');
console.log('REVIEWED_NOTES: 8');
console.log('PUBLIC_CEILINGS: C=8');
console.log('READINESS_MIX: prototype_ready=2 manual_ready=3 link_only=2 blocked=1');
