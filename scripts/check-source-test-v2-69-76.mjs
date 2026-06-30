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
  ['69', 'russia', 'link_only', 'remote_partial'],
  ['70', 'namibia', 'link_only', 'remote_partial'],
  ['71', 'nigeria', 'link_only', 'remote_partial'],
  ['72', 'belize', 'prototype_ready', 'remote_complete'],
  ['73', 'colombia', 'blocked', 'remote_partial'],
  ['74', 'lithuania', 'prototype_ready', 'remote_complete'],
  ['75', 'estonia', 'prototype_ready', 'remote_complete'],
  ['76', 'guyana', 'blocked', 'remote_partial']
];

const authority = readJson('data/static/authority-source-inventory.json');
const registry = readJson('data/static/calendar-readiness-registry.json');
if (authority.records.length !== 94) fail('authority records must be 94');
if (registry.records.length !== 94) fail('readiness records must be 94');
if (registry.programme_state.countries_with_closed_decision !== 76) fail('closed countries must be 76');
if (registry.programme_state.readiness_records !== 94) fail('programme readiness count must be 94');
if (JSON.stringify(registry.programme_state.next_backfill_work_ids) !== JSON.stringify(['WHR-ST2-77-84'])) fail('next work must be WHR-ST2-77-84');

const authorityKeys = new Set(authority.records.map((record) => record.country_id + '/' + record.authority_id + '/' + record.official_source_id));
const registryById = new Map(registry.records.map((record) => [record.readiness_id, record]));
if (authorityKeys.size !== authority.records.length) fail('authority keys must be unique');

const trackerLines = fs.readFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
const readinessCounts = {};

for (const [deliveryNo, slug, readiness, acquisition] of expected) {
  const file = 'docs/timetable-source-tests/' + deliveryNo + '-' + slug + '/source-test-v2.json';
  if (!fs.existsSync(file)) {
    fail('missing ' + file);
    continue;
  }
  const summary = readJson(file);
  const record = summary.records && summary.records[0];
  if (summary.schema_version !== 'source-test-v2-v1') fail(slug + ': schema mismatch');
  if (summary.delivery_no !== deliveryNo || summary.country_id !== slug) fail(slug + ': identity mismatch');
  if (summary.checked_date !== '2026-06-29' || summary.evidence_reviewed_at !== '2026-06-29') fail(slug + ': review date mismatch');
  if (summary.public_safe !== true || !record || summary.records.length !== 1) fail(slug + ': one public-safe record required');
  if (!record) continue;
  readinessCounts[record.readiness] = (readinessCounts[record.readiness] || 0) + 1;
  if (record.readiness !== readiness) fail(slug + ': readiness mismatch');
  if (record.technical_rank !== 'C' || record.public_ceiling !== 'C') fail(slug + ': rank and ceiling must remain C');
  if (record.implementation_status !== 'not_started') fail(slug + ': implementation must remain not_started');
  if (!authorityKeys.has(record.authority_source_key)) fail(slug + ': authority source is missing');
  const registered = registryById.get(record.readiness_id);
  if (!registered || registered.country_id !== slug || registered.country_tracker_delivery_no !== deliveryNo || registered.source_test_ref !== file) fail(slug + ': readiness registry mismatch');
  const hasConfirmedField = Object.values(record.confirmed_fields || {}).some(Boolean);
  if (readiness === 'blocked' && (!record.blocked_reason || hasConfirmedField)) fail(slug + ': blocked boundary mismatch');
  if (readiness === 'link_only' && hasConfirmedField) fail(slug + ': link-only fields must remain false');
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug || !['source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'].includes(row[index.programme_status])) fail(slug + ': tracker status mismatch');
  if (row && row[index.acquisition_status] !== acquisition) fail(slug + ': acquisition status mismatch');
  if (row && (row[index.source_last_checked] !== '2026-06-29' || row[index.evidence_reviewed_at] !== '2026-06-29')) fail(slug + ': tracker date mismatch');
}

if (readinessCounts.prototype_ready !== 3 || readinessCounts.link_only !== 3 || readinessCounts.blocked !== 2) fail('unexpected readiness mix');
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('SOURCE_TEST_V2_69_76_VALID countries=8 authority=94 readiness=94');
console.log('READINESS_MIX prototype_ready=3 link_only=3 blocked=2');
