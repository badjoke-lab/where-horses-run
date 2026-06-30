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
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['93','nicaragua','remote_partial','hide_from_current_calendar'],
  ['94','el-salvador','remote_partial','hide_from_current_calendar'],
  ['95','tanzania','remote_partial','hide_from_current_calendar'],
  ['96','singapore','remote_complete','archive_last_verified'],
  ['97','macau','remote_complete','archive_last_verified'],
  ['98','greece','remote_complete','archive_last_verified']
];

const schema = parse('data/static/source-test-v2.schema.json');
const authority = parse('data/static/authority-source-inventory-93-98.json');
const readiness = parse('data/static/calendar-readiness-registry-93-98.json');
if (authority.record_count !== 6 || authority.effective_record_count !== 116) fail('authority overlay must contain 6 records and resolve to 116');
if (readiness.record_count !== 6 || readiness.effective_record_count !== 116) fail('readiness overlay must contain 6 records and resolve to 116');
if (readiness.countries_with_closed_decision !== 98 || readiness.next_work_id !== 'WHR-NOTE-93-98') fail('readiness programme state mismatch');

const authorityByCountry = new Map(authority.records.map((record) => [record.country_id, record]));
const readinessByCountry = new Map(readiness.records.map((record) => [record.country_id, record]));
if (authorityByCountry.size !== 6 || readinessByCountry.size !== 6) fail('overlay country IDs must be unique');

function parseTsv(file) {
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
}

const trackerRows = parseTsv('docs/country-pages/98-country-tracker.tsv');
const trackerByDelivery = new Map(trackerRows.map((row) => [row.delivery_no, row]));
for (const file of [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv',
  'docs/country-pages/98-country-note-transitions-77-84.tsv',
  'docs/country-pages/98-country-profile-transitions-77-84.tsv',
  'docs/country-pages/98-country-publication-transitions-77-84.tsv',
  'docs/country-pages/98-country-source-test-transitions-85-92.tsv',
  'docs/country-pages/98-country-note-transitions-85-92.tsv',
  'docs/country-pages/98-country-profile-transitions-85-92.tsv',
  'docs/country-pages/98-country-publication-transitions-85-92.tsv',
  'docs/country-pages/98-country-source-test-transitions-93-98.tsv'
]) {
  for (const change of parseTsv(file)) {
    const row = trackerByDelivery.get(change.delivery_no);
    if (!row) { fail(`${file}: unknown delivery ${change.delivery_no}`); continue; }
    for (const [field, value] of Object.entries(change)) if (field !== 'delivery_no' && value !== '') row[field] = value;
  }
}

for (const [deliveryNo, slug, acquisition, fallback] of expected) {
  const file = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!fs.existsSync(path.join(root, file))) { fail(`missing ${file}`); continue; }
  const summary = parse(file);
  for (const field of schema.required_summary_fields) if (!(field in summary)) fail(`${slug}: missing summary field ${field}`);
  if (summary.delivery_no !== deliveryNo || summary.country_id !== slug || summary.public_safe !== true) fail(`${slug}: summary identity mismatch`);
  if (summary.checked_date !== '2026-06-30' || summary.evidence_reviewed_at !== '2026-06-30') fail(`${slug}: review date mismatch`);
  if (!Array.isArray(summary.records) || summary.records.length !== 1) { fail(`${slug}: exactly one readiness record required`); continue; }
  const record = summary.records[0];
  for (const field of schema.required_record_fields) if (!(field in record)) fail(`${slug}: missing record field ${field}`);
  if (record.readiness !== 'blocked' || record.automation_mode !== 'blocked') fail(`${slug}: current calendar must remain blocked`);
  if (record.technical_rank !== 'C' || record.public_ceiling !== 'C') fail(`${slug}: rank and ceiling must remain C`);
  if (record.implementation_status !== 'not_started') fail(`${slug}: implementation must remain not_started`);
  if (record.coverage_scope !== 'archive_or_explanatory') fail(`${slug}: coverage scope mismatch`);
  if (record.fallback !== fallback) fail(`${slug}: fallback mismatch`);
  if (!record.blocked_reason) fail(`${slug}: blocked_reason required`);
  if (Object.values(record.confirmed_fields || {}).some(Boolean)) fail(`${slug}: no current meeting fields may be approved`);

  const authorityRef = authorityByCountry.get(slug);
  if (!authorityRef || authorityRef.authority_source_key !== record.authority_source_key || authorityRef.source_test_ref !== file || authorityRef.capability_rank !== 'C' || !authorityRef.official_source_url.startsWith('https://')) fail(`${slug}: authority reference mismatch`);
  const readinessRef = readinessByCountry.get(slug);
  if (!readinessRef || readinessRef.delivery_no !== deliveryNo || readinessRef.readiness_id !== record.readiness_id || readinessRef.readiness !== 'blocked' || readinessRef.implementation_status !== 'not_started' || readinessRef.source_test_ref !== file) fail(`${slug}: readiness reference mismatch`);

  const row = trackerByDelivery.get(deliveryNo);
  if (!row || row.slug !== slug || row.programme_status !== 'source_tested' || row.acquisition_status !== acquisition) fail(`${slug}: effective tracker status mismatch`);
  if (row && (row.source_last_checked !== '2026-06-30' || row.evidence_reviewed_at !== '2026-06-30')) fail(`${slug}: tracker date mismatch`);
}

const counts = {};
for (const row of trackerByDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 92 || counts.source_tested !== 6) fail(`programme counts mismatch ${JSON.stringify(counts)}`);

if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('SOURCE_TEST_V2_93_98_VALID countries=6 authority=116 readiness=116');
console.log('PROGRAMME_COUNTS published=92 source_tested=6');
console.log('READINESS_MIX blocked=6');
