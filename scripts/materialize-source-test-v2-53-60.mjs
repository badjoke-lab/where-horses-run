import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);

const entries = [
  ['53', 'cyprus', 'remote_complete', 'Countrywide manual calendar decision at public ceiling C.'],
  ['54', 'panama', 'remote_complete', 'Single-racecourse date-route prototype at public ceiling C.'],
  ['55', 'kuwait', 'local_required', 'Official calendar capability is app-based and link-only.'],
  ['56', 'kenya', 'remote_complete', 'Ngong official dates support a manual-ready C-level decision.'],
  ['57', 'pakistan', 'remote_partial', 'Lahore official route is stale and remains link-only.'],
  ['58', 'ecuador', 'remote_partial', 'Single-racecourse JavaScript calendar is manual-ready at public ceiling C.'],
  ['59', 'venezuela', 'remote_partial', 'No stable public upcoming date-to-racecourse route was confirmed; decision remains blocked.'],
  ['60', 'belgium', 'remote_complete', 'Federation calendar has technical rank A behind public ceiling C.'],
];

const authorityPath = 'data/static/authority-source-inventory.json';
const authority = readJson(authorityPath);
const authorityAdditions = readJson('.tmp/authority-additions-53-60.json');
const keyOf = (record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
const authorityKeys = new Set(authority.records.map(keyOf));
for (const record of authorityAdditions) {
  const key = keyOf(record);
  if (!authorityKeys.has(key)) {
    authority.records.push(record);
    authorityKeys.add(key);
  }
}
if (authority.records.length !== 78) throw new Error(`Expected 78 authority records, found ${authority.records.length}`);
writeJson(authorityPath, authority);

const registryPath = 'data/static/calendar-readiness-registry.json';
const registry = readJson(registryPath);
const readinessIds = new Set(registry.records.map((record) => record.readiness_id));
for (const [deliveryNo, slug] of entries) {
  const sourceTestRef = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  const summary = readJson(sourceTestRef);
  if (summary.delivery_no !== deliveryNo || summary.country_id !== slug || summary.public_safe !== true) {
    throw new Error(`Invalid Source Test v2 identity: ${sourceTestRef}`);
  }
  if (!Array.isArray(summary.records) || summary.records.length !== 1) throw new Error(`${sourceTestRef} must contain one record`);
  const record = summary.records[0];
  if (!readinessIds.has(record.readiness_id)) {
    registry.records.push({
      readiness_id: record.readiness_id,
      country_id: slug,
      country_tracker_delivery_no: deliveryNo,
      system_id: record.system_id,
      system_name_en: record.system_name_en,
      authority_source_key: record.authority_source_key,
      racecourse_ids: record.racecourse_ids,
      coverage_scope: record.coverage_scope,
      technical_rank: record.technical_rank,
      public_ceiling: record.public_ceiling,
      confirmed_fields: record.confirmed_fields,
      source_format: record.source_format,
      access_mode: record.access_mode,
      automation_mode: record.automation_mode,
      refresh_classes: record.refresh_classes,
      readiness: record.readiness,
      implementation_status: record.implementation_status,
      fallback: record.fallback,
      source_status: record.source_status,
      checked_date: summary.checked_date,
      evidence_reviewed_at: summary.evidence_reviewed_at,
      revalidation_trigger: record.revalidation_trigger,
      blocked_reason: record.blocked_reason,
      source_test_ref: sourceTestRef,
      limitations: record.limitations,
      notes: record.notes,
    });
    readinessIds.add(record.readiness_id);
  }
}
registry.bootstrap_status = 'source_test_v2_active';
registry.programme_state = {
  country_target: 98,
  countries_with_closed_decision: 60,
  readiness_records: 78,
  next_backfill_work_ids: ['WHR-ST2-61-68'],
};
if (registry.records.length !== 78) throw new Error(`Expected 78 readiness records, found ${registry.records.length}`);
writeJson(registryPath, registry);

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(path.join(root, trackerPath), 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, acquisitionStatus, remark] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`Tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'source_tested';
  row[index.acquisition_status] = acquisitionStatus;
  row[index.source_last_checked] = '2026-06-29';
  row[index.evidence_reviewed_at] = '2026-06-29';
  row[index.remarks] = remark;
}
fs.writeFileSync(path.join(root, trackerPath), `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

console.log('MATERIALIZED_SOURCE_TEST_V2_53_60 authority=78 readiness=78 closed=60');
