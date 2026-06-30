import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const auditStatusIndex = auditTrackerLines[0].split('\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['77', 'kazakhstan', 'prototype_ready', 'remote_complete'],
  ['78', 'egypt', 'link_only', 'remote_partial'],
  ['79', 'algeria', 'link_only', 'remote_partial'],
  ['80', 'iran', 'link_only', 'remote_partial'],
  ['81', 'vietnam', 'manual_ready', 'remote_complete'],
  ['82', 'bolivia', 'blocked', 'remote_partial'],
  ['83', 'guatemala', 'link_only', 'remote_partial'],
  ['84', 'honduras', 'blocked', 'remote_partial']
];

const sourceSchema = readJson('data/static/source-test-v2.schema.json');
const authoritySchema = readJson('data/static/authority-source-inventory.schema.json');
const baseAuthority = readJson('data/static/authority-source-inventory.json');
const authorityOverlay = readJson('data/static/authority-source-inventory-77-84.json');
const baseRegistry = readJson('data/static/calendar-readiness-registry.json');
const readinessOverlay = readJson('data/static/calendar-readiness-registry-77-84.json');

if (baseAuthority.records.length !== 94) fail('base authority records must be 94');
if (authorityOverlay.records.length !== 8 || authorityOverlay.base_record_count !== 94 || authorityOverlay.effective_record_count !== 102) fail('authority overlay counts must be 94 + 8 = 102');
if (baseRegistry.records.length !== 94) fail('base readiness records must be 94');
if (readinessOverlay.records.length !== 8) fail('readiness overlay must contain 8 records');
if (readinessOverlay.programme_state.countries_with_closed_decision !== 84) fail('closed countries must be 84');
if (readinessOverlay.programme_state.readiness_records !== 102) fail('effective readiness records must be 102');
if (JSON.stringify(readinessOverlay.programme_state.next_backfill_work_ids) !== JSON.stringify(['WHR-ST2-85-92'])) fail('next source-test wave must be WHR-ST2-85-92');

const authorityRecords = [...baseAuthority.records, ...authorityOverlay.records];
const authorityKeys = new Set();
for (const record of authorityRecords) {
  for (const field of authoritySchema.required_record_fields) {
    if (!(field in record)) fail(`authority record missing ${field}`);
  }
  if (!authoritySchema.authority_type_enum.includes(record.authority_type)) fail(`${record.country_id}: invalid authority_type`);
  if (!authoritySchema.racecourse_scope_enum.includes(record.racecourse_scope)) fail(`${record.country_id}: invalid racecourse_scope`);
  if (!authoritySchema.source_kind_enum.includes(record.source_kind)) fail(`${record.country_id}: invalid source_kind`);
  if (!authoritySchema.source_status_enum.includes(record.source_status)) fail(`${record.country_id}: invalid authority source_status`);
  if (!authoritySchema.capability_rank_enum.includes(record.capability_rank)) fail(`${record.country_id}: invalid authority capability_rank`);
  if (!authoritySchema.adapter_candidate_status_enum.includes(record.adapter_candidate_status)) fail(`${record.country_id}: invalid adapter_candidate_status`);
  if (!record.official_source_url.startsWith('https://')) fail(`${record.country_id}: authority URL must use https`);
  const key = `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
  if (authorityKeys.has(key)) fail(`duplicate authority key ${key}`);
  authorityKeys.add(key);
}
if (authorityKeys.size !== 102) fail(`effective authority keys must be 102; found ${authorityKeys.size}`);

const registryRecords = [...baseRegistry.records, ...readinessOverlay.records];
const registryById = new Map();
for (const record of registryRecords) {
  if (registryById.has(record.readiness_id)) fail(`duplicate readiness id ${record.readiness_id}`);
  registryById.set(record.readiness_id, record);
}
if (registryById.size !== 102) fail(`effective readiness ids must be 102; found ${registryById.size}`);

function parseTsv(file) {
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => {
    const values = line.split('\t');
    if (values.length !== headers.length) fail(`${file}: invalid column count`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

const trackerRows = parseTsv('docs/country-pages/98-country-tracker.tsv');
const trackerByDelivery = new Map(trackerRows.map((row) => [row.delivery_no, row]));
for (const transitionFile of [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv'
]) {
  for (const change of parseTsv(transitionFile)) {
    const row = trackerByDelivery.get(change.delivery_no);
    if (!row) {
      fail(`${transitionFile}: unknown delivery ${change.delivery_no}`);
      continue;
    }
    for (const [field, value] of Object.entries(change)) {
      if (field !== 'delivery_no' && value !== '') row[field] = value;
    }
  }
}

const readinessCounts = {};
for (const [deliveryNo, slug, readiness, acquisition] of expected) {
  const file = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!fs.existsSync(file)) {
    fail(`missing ${file}`);
    continue;
  }
  const summary = readJson(file);
  for (const field of sourceSchema.required_summary_fields) {
    if (!(field in summary)) fail(`${slug}: missing summary field ${field}`);
  }
  const record = summary.records && summary.records[0];
  if (summary.schema_version !== 'source-test-v2-v1') fail(`${slug}: schema mismatch`);
  if (summary.delivery_no !== deliveryNo || summary.country_id !== slug) fail(`${slug}: identity mismatch`);
  if (summary.checked_date !== '2026-06-30' || summary.evidence_reviewed_at !== '2026-06-30') fail(`${slug}: review date mismatch`);
  if (!sourceSchema.country_completeness_enum.includes(summary.country_completeness)) fail(`${slug}: invalid country completeness`);
  if (summary.public_safe !== true || !record || summary.records.length !== 1) fail(`${slug}: one public-safe record required`);
  if (!record) continue;
  for (const field of sourceSchema.required_record_fields) {
    if (!(field in record)) fail(`${slug}: missing record field ${field}`);
  }
  readinessCounts[record.readiness] = (readinessCounts[record.readiness] || 0) + 1;
  if (record.readiness !== readiness) fail(`${slug}: readiness mismatch`);
  if (record.technical_rank !== 'C' || record.public_ceiling !== 'C') fail(`${slug}: rank and ceiling must remain C`);
  if (record.implementation_status !== 'not_started') fail(`${slug}: implementation must remain not_started`);
  if (!sourceSchema.coverage_scope_enum.includes(record.coverage_scope)) fail(`${slug}: invalid coverage_scope`);
  if (!sourceSchema.source_format_enum.includes(record.source_format)) fail(`${slug}: invalid source_format`);
  if (!sourceSchema.access_mode_enum.includes(record.access_mode)) fail(`${slug}: invalid access_mode`);
  if (!sourceSchema.automation_mode_enum.includes(record.automation_mode)) fail(`${slug}: invalid automation_mode`);
  if (!sourceSchema.readiness_enum.includes(record.readiness)) fail(`${slug}: invalid readiness`);
  if (!sourceSchema.fallback_enum.includes(record.fallback)) fail(`${slug}: invalid fallback`);
  if (!sourceSchema.source_status_enum.includes(record.source_status)) fail(`${slug}: invalid source_status`);
  if (!authorityKeys.has(record.authority_source_key)) fail(`${slug}: authority source is missing`);
  const registered = registryById.get(record.readiness_id);
  if (!registered || registered.country_id !== slug || registered.country_tracker_delivery_no !== deliveryNo || registered.source_test_ref !== file) fail(`${slug}: readiness registry mismatch`);
  const hasConfirmedField = Object.values(record.confirmed_fields || {}).some(Boolean);
  if (readiness === 'blocked' && (!record.blocked_reason || hasConfirmedField)) fail(`${slug}: blocked boundary mismatch`);
  if (readiness === 'link_only' && hasConfirmedField) fail(`${slug}: link-only fields must remain false`);
  if (['prototype_ready', 'manual_ready'].includes(readiness) && !hasConfirmedField) fail(`${slug}: ready state requires confirmed fields`);
  const row = trackerByDelivery.get(deliveryNo);
  if (!row || row.slug !== slug || row.programme_status !== 'source_tested') fail(`${slug}: effective tracker status mismatch`);
  if (row && row.acquisition_status !== acquisition) fail(`${slug}: acquisition status mismatch`);
  if (row && (row.source_last_checked !== '2026-06-30' || row.evidence_reviewed_at !== '2026-06-30')) fail(`${slug}: tracker date mismatch`);
}

const programmeCounts = {};
for (const row of trackerByDelivery.values()) programmeCounts[row.programme_status] = (programmeCounts[row.programme_status] || 0) + 1;
if (programmeCounts.published !== 76 || programmeCounts.source_tested !== 8 || programmeCounts.not_started !== 14) {
  fail(`effective programme counts mismatch: ${JSON.stringify(programmeCounts)}`);
}
if (readinessCounts.prototype_ready !== 1 || readinessCounts.manual_ready !== 1 || readinessCounts.link_only !== 4 || readinessCounts.blocked !== 2) fail(`unexpected readiness mix ${JSON.stringify(readinessCounts)}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log('SOURCE_TEST_V2_77_84_VALID countries=8 authority=102 readiness=102');
console.log('PROGRAMME_COUNTS published=76 source_tested=8 not_started=14');
console.log('READINESS_MIX prototype_ready=1 manual_ready=1 link_only=4 blocked=2');
