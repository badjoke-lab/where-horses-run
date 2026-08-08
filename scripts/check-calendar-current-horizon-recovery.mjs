import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const max = (values) => values.filter(Boolean).sort().at(-1) ?? null;

const season = readJson('data/static/calendar-system-season-state-v1.json');
const audit = readJson('data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json');
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const executionPolicy = readJson('data/static/calendar-daily-acquisition-policy-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const jraApproved = readJson('data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16-approved.json');
const narApproved = readJson('data/candidates/nar-august-2026-horizon-recovery-c-approved.json');
const baneiApproved = readJson('data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17-approved.json');

const requiredSystems = [
  'japan-jra-system',
  'japan-nar-system',
  'japan-banei-system',
  'hong-kong-hkjc-system',
  'uae-national-racing-system',
];
const preRecoveryLatest = new Map([
  ['japan-jra-system', '2026-07-26'],
  ['japan-nar-system', '2026-07-31'],
  ['japan-banei-system', '2026-08-10'],
  ['hong-kong-hkjc-system', '2026-07-15'],
  ['uae-national-racing-system', '2026-04-11'],
]);
const julyRecoveryFloor = new Map([
  ['japan-jra-system', '2026-08-16'],
  ['japan-nar-system', '2026-08-17'],
  ['japan-banei-system', '2026-08-17'],
  ['hong-kong-hkjc-system', '2026-07-15'],
  ['uae-national-racing-system', '2026-04-11'],
]);

if (season.schema_version !== 'calendar-system-season-state-v1') fail('season-state schema differs');
if (!Array.isArray(season.records)) fail('season-state records missing');
const registryBySystem = new Map(registry.records.map((record) => [record.system_id, record]));
const recordsBySystem = new Map();
for (const record of season.records ?? []) {
  if (!registryBySystem.has(record.system_id)) fail(`season-state Registry profile missing: ${record.system_id}`);
  if (!['active', 'offseason', 'unknown'].includes(record.season_state)) fail(`season state invalid: ${record.system_id}`);
  if (record.effective_start_date >= record.effective_end_date_exclusive) fail(`season effective window invalid: ${record.system_id}`);
  if (typeof record.official_source_url !== 'string' || !record.official_source_url.startsWith('https://')) fail(`season source URL invalid: ${record.system_id}`);
  const list = recordsBySystem.get(record.system_id) ?? [];
  list.push(record);
  recordsBySystem.set(record.system_id, list);
}
for (const systemId of requiredSystems) {
  const records = [...(recordsBySystem.get(systemId) ?? [])].sort((a, b) => a.effective_start_date.localeCompare(b.effective_start_date));
  if (records.length === 0) fail(`season-state system missing: ${systemId}`);
  for (let index = 1; index < records.length; index += 1) {
    if (records[index - 1].effective_end_date_exclusive > records[index].effective_start_date) fail(`season-state windows overlap: ${systemId}`);
  }
}

if (audit.schema_version !== 'calendar-current-horizon-recovery-audit-v1') fail('recovery audit schema differs');
if (audit.work_id !== 'WHR-CAL-DAILY-ACQUISITION') fail('recovery audit Work ID differs');
if (audit.generated_at !== '2026-07-19T15:00:00Z') fail('recovery audit snapshot timestamp differs');
if (audit.window?.start_date !== '2026-07-19' || audit.window?.end_date_exclusive !== '2026-08-18') fail('historical recovery audit window differs');
if (!Array.isArray(audit.systems) || audit.systems.length !== requiredSystems.length) fail('historical recovery audit system count differs');
for (const key of ['canonical_written', 'public_projection_written', 'deployment_performed']) {
  if (audit.publication_boundary?.[key] !== false) fail(`historical recovery audit ${key} must be false`);
}
if (audit.publication_boundary?.human_review_required !== true) fail('historical recovery audit must require human review');

const auditBySystem = new Map((audit.systems ?? []).map((record) => [record.system_id, record]));
for (const systemId of requiredSystems) {
  const profile = registryBySystem.get(systemId);
  const audited = auditBySystem.get(systemId);
  if (!audited) {
    fail(`historical audit disposition missing: ${systemId}`);
    continue;
  }
  if (audited.latest_public_meeting_date !== preRecoveryLatest.get(systemId)) fail(`${systemId} historical pre-recovery date differs`);
  const latestPublic = max((publicMeetings.meetings ?? [])
    .filter((meeting) => meeting.authority_id === profile.authority_id)
    .map((meeting) => meeting.date));
  if (latestPublic === null || latestPublic < julyRecoveryFloor.get(systemId)) fail(`${systemId} regressed below July recovery floor: ${latestPublic}`);
  const historicalSeason = (recordsBySystem.get(systemId) ?? []).find((record) =>
    record.effective_start_date <= '2026-07-19' && '2026-07-19' < record.effective_end_date_exclusive);
  if (!historicalSeason || audited.season_state !== historicalSeason.season_state) fail(`${systemId} historical season disposition no longer resolves`);
  if (!Array.isArray(audited.official_source_urls) || audited.official_source_urls.length === 0) fail(`${systemId} historical official sources missing`);
}

const expectedJraDates = ['2026-08-01', '2026-08-02', '2026-08-08', '2026-08-09', '2026-08-15', '2026-08-16'];
const expectedBaneiDates = ['2026-08-15', '2026-08-16', '2026-08-17'];
if (!exact(auditBySystem.get('japan-jra-system')?.expected_meeting_dates, expectedJraDates)) fail('JRA historical recovery meeting dates differ');
if (!exact(auditBySystem.get('japan-banei-system')?.expected_meeting_dates, expectedBaneiDates)) fail('Banei historical recovery meeting dates differ');
if (auditBySystem.get('hong-kong-hkjc-system')?.disposition !== 'no_recovery_job') fail('historical HKJC disposition differs');
if (auditBySystem.get('uae-national-racing-system')?.disposition !== 'no_recovery_job') fail('historical UAE disposition differs');

for (const [label, candidate, expectedCount] of [
  ['JRA', jraApproved, 18],
  ['NAR', narApproved, 51],
  ['Banei', baneiApproved, 3],
]) {
  if (candidate.schema_version !== 'timetable-candidate-v1' || candidate.review?.status !== 'approved' || candidate.records?.length !== expectedCount) fail(`${label} historical approved recovery envelope differs`);
  for (const record of candidate.records ?? []) {
    if (record.capability_rank !== 'C' || record.first_race_time_local !== null || record.last_race_time_local !== null || record.timetable_rows?.length !== 0) fail(`${record.meeting_id} exceeds Rank C historical recovery boundary`);
  }
}

const baneiRule = duePolicy.system_rules.find((rule) => rule.system_id === 'japan-banei-system');
if (!baneiRule || baneiRule.regular_refresh.enabled || baneiRule.coverage_gap.enabled || baneiRule.source_revalidation.enabled) fail('Banei ordinary Due-job policy must remain disabled');
if (baneiRule?.rank_retry.enabled !== true) fail('Banei reviewed rank retry must remain enabled');
const baneiExecution = executionPolicy.execution.systems.find((record) => record.system_id === 'japan-banei-system');
if (!baneiExecution || !exact(baneiExecution.allowed_reasons, ['rank_upgrade_retry']) || !exact(baneiExecution.allowed_collection_modes, ['selected_meetings'])) fail('Banei daily execution boundary differs');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-historical-horizon-recovery-'));
const statePath = path.join(tempDir, 'state.json');
const stateRun = spawnSync(process.execPath, [
  'scripts/timetable/build-calendar-live-planner-state.mjs',
  '--as-of=2026-07-19T15:00:00Z',
  `--output=${statePath}`,
], { cwd: root, encoding: 'utf8' });
if (stateRun.status !== 0) fail(`historical live planner state failed: ${stateRun.stderr || stateRun.stdout}`);
else {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const states = new Map(state.system_states.map((record) => [record.system_id, record]));
  if (states.get('hong-kong-hkjc-system')?.season_state !== 'offseason') fail('historical HKJC offseason state differs');
  if ((states.get('hong-kong-hkjc-system')?.coverage_gaps ?? []).length !== 0) fail('historical HKJC must have no July-window wake-up gap');
}
fs.rmSync(tempDir, { recursive: true, force: true });

const serialized = JSON.stringify({ season, audit, jraApproved, narApproved, baneiApproved });
for (const prohibited of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'raw_html', 'credential', 'cookie', 'secret']) {
  if (serialized.toLowerCase().includes(prohibited)) fail(`public-safe recovery artifacts contain prohibited key fragment ${prohibited}`);
}

if (errors.length) {
  console.error(`CALENDAR_CURRENT_HORIZON_RECOVERY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_CURRENT_HORIZON_RECOVERY: pass');
console.log('HISTORICAL_WINDOW: 2026-07-19..2026-08-18');
console.log('HISTORICAL_RECOVERY: JRA=18,NAR=51,BANEI=3');
console.log('CURRENT_DATA_MAY_ADVANCE_BEYOND_HISTORICAL_FLOOR: true');
console.log('PUBLIC_RANK_C_ONLY: true');
