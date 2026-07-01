import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const hash = (file) => createHash('sha256').update(read(file)).digest('hex');

const control = parse('data/static/local-racing-pilot-control.json');
const inventory = parse('data/static/authority-source-inventory.json');
const readiness = parse('data/static/calendar-readiness-registry.json');
const activePath = 'data/candidates/japan-nar-candidates.json';
const archivePath = 'data/archive/timetable/candidates/japan-nar-candidates.v0.json';
const protectedFiles = [
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/candidates/japan-jra-candidates.json',
  archivePath
];
const beforeHashes = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));

if (control.schema_version !== 'local-racing-pilot-control-v1') fail('control schema is incorrect.');
if (control.work_id !== 'WHR-CAL-JAPAN-NAR') fail('control Work ID is incorrect.');
if (control.mode !== 'link_only_review') fail('control mode must be link_only_review.');
if (control.source_key !== 'japan/nar-local-government-racing/nar-monthly-convene-info') fail('control source key is incorrect.');
if (control.system_id !== 'japan-nar-system') fail('control system ID is incorrect.');
if (JSON.stringify(control.allowed_hosts) !== JSON.stringify(['www.keiba.go.jp', 'keiba.go.jp'])) fail('allowed hosts are incorrect.');
if (control.expected_readiness !== 'link_only') fail('expected readiness must be link_only.');
if (control.expected_technical_rank !== 'C' || control.expected_public_ceiling !== 'C') fail('expected rank and ceiling must be C.');
for (const key of ['acquisition_mode','normalization_mode','candidate_mode','canonical_write_mode','public_write_mode','schedule_mode']) {
  if (control[key] !== 'disabled') fail(`${key} must remain disabled.`);
}

const inventoryMatches = inventory.records.filter((record) =>
  `${record.country_id}/${record.authority_id}/${record.official_source_id}` === control.source_key
);
const readinessMatches = readiness.records.filter((record) => record.authority_source_key === control.source_key);
if (inventoryMatches.length !== 1) fail('authority/source identity is not unique.');
if (readinessMatches.length !== 1) fail('Calendar Readiness identity is not unique.');
const inventoryRecord = inventoryMatches[0];
const readinessRecord = readinessMatches[0];
if (inventoryRecord) {
  if (inventoryRecord.capability_rank !== 'B') fail('inventory discovery rank changed unexpectedly.');
  if (inventoryRecord.source_status !== 'partial') fail('inventory source status changed unexpectedly.');
  if (!control.allowed_hosts.includes(new URL(inventoryRecord.official_source_url).hostname)) fail('inventory host is outside control.');
}
if (readinessRecord) {
  if (readinessRecord.readiness !== 'link_only') fail('readiness is not link_only.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('readiness rank/ceiling boundary changed.');
  if (readinessRecord.automation_mode !== 'link_only') fail('automation mode is not link_only.');
  if (readinessRecord.implementation_status !== 'not_started') fail('implementation status is not not_started.');
  if (readinessRecord.fallback !== 'official_link_only') fail('fallback is not official_link_only.');
  if (readinessRecord.confirmed_fields.meeting_date !== true || readinessRecord.confirmed_fields.racecourse !== true) fail('C-level confirmed fields are incomplete.');
  for (const key of ['first_race_time','last_race_time','per_race_post_times','race_name','distance','surface','course']) {
    if (readinessRecord.confirmed_fields[key] !== false) fail(`${key} must remain unconfirmed.`);
  }
  if (!readinessRecord.limitations.some((value) => value.includes('must not be flattened'))) fail('authority-specific isolation limitation is missing.');
}

if (existsSync(path.join(root, activePath))) fail('Active local-racing candidate file must not exist.');
if (!existsSync(path.join(root, archivePath))) fail('Legacy local-racing archive is missing.');
const archived = parse(archivePath);
if (archived.schema_version !== 'timetable-candidates-v0') fail('Legacy archive schema changed.');
if (archived.source_adapter_id !== 'japan-nar-dry-run-adapter') fail('Legacy archive adapter identity changed.');
if (archived.generated_at !== '2026-05-29T00:00:00Z') fail('Legacy archive timestamp changed.');
if (archived.review?.review_status !== 'needs_review') fail('Legacy archive review state changed.');
if ((archived.records ?? []).length !== 12) fail('Legacy archive must retain 12 records.');

const guardRun = spawnSync(process.execPath, ['scripts/generate-japan-nar-candidates.mjs','--check'], { cwd: root, encoding: 'utf8' });
if (guardRun.status !== 0) fail(`legacy quarantine guard failed: ${guardRun.stderr || guardRun.stdout}`);
const directRun = spawnSync(process.execPath, ['scripts/generate-japan-nar-candidates.mjs'], { cwd: root, encoding: 'utf8' });
if (directRun.status === 0) fail('Direct candidate generation must remain disabled.');

const temp = mkdtempSync(path.join(os.tmpdir(), 'whr-local-racing-pilot-'));
try {
  const outputA = path.join(temp, 'review-a.json');
  const outputB = path.join(temp, 'review-b.json');
  for (const output of [outputA, outputB]) {
    const result = spawnSync(process.execPath, ['scripts/timetable/build-local-racing-pilot-review.mjs','--output',output], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) fail(`review builder failed: ${result.stderr || result.stdout}`);
  }
  if (existsSync(outputA) && existsSync(outputB) && readFileSync(outputA, 'utf8') !== readFileSync(outputB, 'utf8')) fail('review builder is not deterministic.');
  if (existsSync(outputA)) {
    const review = JSON.parse(readFileSync(outputA, 'utf8'));
    if (review.schema_version !== 'local-racing-pilot-review-v1') fail('review schema is incorrect.');
    if (review.work_id !== 'WHR-CAL-JAPAN-NAR') fail('review Work ID is incorrect.');
    if (review.foundation.pass !== true || review.foundation.blockers.length !== 0) fail('current link-only foundation must pass.');
    if (review.activation.ready !== false) fail('activation must remain false.');
    for (const blocker of ['authority_specific_timetable_not_reviewed','stable_scheduled_time_source_not_confirmed','readiness_change_required_before_candidate']) {
      if (!review.activation.blockers.includes(blocker)) fail(`activation blocker ${blocker} is missing.`);
    }
    if (review.activation.candidate_generation_allowed !== false) fail('candidate generation must remain unavailable.');
    if (review.repository_state.active_candidate_absent !== true) fail('active candidate absence was not recorded.');
    if (review.repository_state.archived_candidate_present !== true) fail('archive presence was not recorded.');
    if (review.repository_state.archived_candidate_valid !== true) fail('archive validity was not recorded.');
    if (review.repository_state.archived_candidate_record_count !== 12) fail('archive record count is incorrect.');
    if (review.repository_state.public_projection_absent !== true) fail('public projection absence was not recorded.');
    if (review.repository_state.public_meeting_ids.length !== 0 || review.repository_state.public_detail_ids.length !== 0) fail('NAR public IDs must remain empty.');
    if (review.repository_state.jra_isolation_pass !== true) fail('JRA isolation check failed.');
    if (!/^[a-f0-9]{64}$/.test(review.input_digests.archived_candidate_sha256 ?? '')) fail('archive digest is missing.');
    for (const key of ['network_fetch_performed','normalized_data_created','candidate_created','canonical_written','public_projection_written','scheduled_operation_active']) {
      if (review.boundaries[key] !== false) fail(`boundary ${key} must be false.`);
    }
  }

  const dryRun = spawnSync(process.execPath, ['scripts/timetable/build-local-racing-pilot-review.mjs','--dry-run'], { cwd: root, encoding: 'utf8' });
  if (dryRun.status !== 0 || !dryRun.stdout.includes('authority_specific_timetable_not_reviewed')) fail('review builder dry-run failed.');
  if (!dryRun.stdout.includes('archived_candidate_valid')) fail('review builder dry-run omits archive state.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}

const afterHashes = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));
if (JSON.stringify(beforeHashes) !== JSON.stringify(afterHashes)) fail('validation changed archive, candidate, or public data.');

const builderSource = read('scripts/timetable/build-local-racing-pilot-review.mjs');
for (const forbidden of ['fetch(', 'axios', 'writeFileSync(path.join(root, activeCandidatePath)', 'canonical/meetings.json']) {
  if (builderSource.includes(forbidden)) fail(`builder contains forbidden marker ${forbidden}.`);
}

if (errors.length) {
  console.error(`LOCAL_RACING_PILOT_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('LOCAL_RACING_PILOT_FOUNDATION: pass');
console.log('FOUNDATION_PASS: true');
console.log('ACTIVATION_READY: false');
console.log('ACTIVE_CANDIDATE_PRESENT: false');
console.log('LEGACY_V0_ARCHIVE_RECORDS: 12');
console.log('NAR_PUBLIC_PROJECTION_PRESENT: false');
console.log('JRA_CAPABILITY_GENERALIZED: false');
