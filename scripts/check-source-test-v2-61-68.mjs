import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const sourceTestOrLater = new Set(['source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published']);
const expected = [
  ['61', 'slovenia', 'link_only', 'C', 'C'],
  ['62', 'croatia', 'manual_ready', 'C', 'C'],
  ['63', 'dominican-republic', 'prototype_ready', 'C', 'C'],
  ['64', 'tunisia', 'manual_ready', 'C', 'C'],
  ['65', 'lebanon', 'link_only', 'C', 'C'],
  ['66', 'libya', 'link_only', 'C', 'C'],
  ['67', 'mainland-china', 'blocked', 'C', 'C'],
  ['68', 'indonesia', 'manual_ready', 'C', 'C'],
];

const authority = readJson('data/static/authority-source-inventory.json');
const registry = readJson('data/static/calendar-readiness-registry.json');
if (authority.records?.length !== 86) fail(`authority records must be 86; found ${authority.records?.length}`);
if (registry.records?.length !== 86) fail(`readiness records must be 86; found ${registry.records?.length}`);
if (registry.bootstrap_status !== 'source_test_v2_active') fail('bootstrap_status must remain source_test_v2_active');
if (registry.programme_state?.countries_with_closed_decision !== 68) fail('closed decision count must be 68');
if (registry.programme_state?.readiness_records !== 86) fail('programme readiness count must be 86');
if (JSON.stringify(registry.programme_state?.next_backfill_work_ids) !== JSON.stringify(['WHR-ST2-69-76'])) fail('next backfill must be WHR-ST2-69-76');

const authorityKeys = new Set((authority.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
if (authorityKeys.size !== authority.records?.length) fail('authority compound keys must be unique');
const registryById = new Map((registry.records ?? []).map((record) => [record.readiness_id, record]));
const readinessCounts = {};

for (const [deliveryNo, slug, readiness, technicalRank, publicCeiling] of expected) {
  const file = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!fs.existsSync(path.join(root, file))) {
    fail(`missing ${file}`);
    continue;
  }
  const summary = readJson(file);
  if (summary.schema_version !== 'source-test-v2-v1') fail(`${slug}: schema version mismatch`);
  if (summary.delivery_no !== deliveryNo || summary.country_id !== slug) fail(`${slug}: identity mismatch`);
  if (summary.checked_date !== '2026-06-29' || summary.evidence_reviewed_at !== '2026-06-29') fail(`${slug}: review date mismatch`);
  if (summary.public_safe !== true) fail(`${slug}: public_safe must be true`);
  if (!Array.isArray(summary.records) || summary.records.length !== 1) {
    fail(`${slug}: exactly one record is required`);
    continue;
  }
  const record = summary.records[0];
  readinessCounts[record.readiness] = (readinessCounts[record.readiness] ?? 0) + 1;
  if (record.readiness !== readiness) fail(`${slug}: readiness must be ${readiness}`);
  if (record.technical_rank !== technicalRank || record.public_ceiling !== publicCeiling) fail(`${slug}: rank or public ceiling mismatch`);
  if (record.implementation_status !== 'not_started') fail(`${slug}: implementation must remain not_started`);
  if ((record.racecourse_ids ?? []).length !== 0) fail(`${slug}: racecourse IDs must remain empty until inventory migration`);
  if (!authorityKeys.has(record.authority_source_key)) fail(`${slug}: missing authority source key`);
  const registryRecord = registryById.get(record.readiness_id);
  if (!registryRecord) fail(`${slug}: registry record missing`);
  else {
    if (registryRecord.country_id !== slug || registryRecord.country_tracker_delivery_no !== deliveryNo) fail(`${slug}: registry identity mismatch`);
    if (registryRecord.source_test_ref !== file) fail(`${slug}: source_test_ref mismatch`);
    if (registryRecord.implementation_status !== 'not_started') fail(`${slug}: registry implementation must remain not_started`);
  }
  if (readiness === 'blocked') {
    if (!record.blocked_reason) fail(`${slug}: blocked reason required`);
    if (Object.values(record.confirmed_fields ?? {}).some(Boolean)) fail(`${slug}: blocked record fields must remain false`);
  } else if (record.blocked_reason !== null) {
    fail(`${slug}: non-blocked record must use null blocked_reason`);
  }
}

if (readinessCounts.manual_ready !== 3 || readinessCounts.prototype_ready !== 1 || readinessCounts.link_only !== 3 || readinessCounts.blocked !== 1) {
  fail(`unexpected readiness mix: ${JSON.stringify(readinessCounts)}`);
}

const trackerLines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) fail(`tracker missing ${deliveryNo}-${slug}`);
  else {
    if (!sourceTestOrLater.has(row[index.programme_status])) fail(`${slug}: tracker must retain Source Test completion or a later programme state`);
    if (row[index.source_last_checked] !== '2026-06-29' || row[index.evidence_reviewed_at] !== '2026-06-29') fail(`${slug}: tracker dates mismatch`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('SOURCE_TEST_V2_61_68_VALID countries=8 authority=86 readiness=86');
console.log('READINESS_MIX manual_ready=3 prototype_ready=1 link_only=3 blocked=1');
