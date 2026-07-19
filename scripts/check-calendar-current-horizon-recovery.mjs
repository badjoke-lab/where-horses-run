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
const recoveredLatest = new Map([
  ['japan-jra-system', '2026-08-16'],
  ['japan-nar-system', '2026-08-17'],
  ['japan-banei-system', '2026-08-17'],
  ['hong-kong-hkjc-system', '2026-07-15'],
  ['uae-national-racing-system', '2026-04-11'],
]);

if (season.schema_version !== 'calendar-system-season-state-v1') fail('season-state schema differs');
if (season.window?.start_date !== '2026-07-19' || season.window?.end_date_exclusive !== '2026-08-18') fail('season-state window differs');
if (!Array.isArray(season.records) || season.records.length !== requiredSystems.length) fail('season-state record count differs');
if (!exact((season.records ?? []).map((record) => record.system_id).sort(), [...requiredSystems].sort())) fail('season-state system set differs');

const registryBySystem = new Map(registry.records.map((record) => [record.system_id, record]));
for (const record of season.records ?? []) {
  if (!registryBySystem.has(record.system_id)) fail(`season-state Registry profile missing: ${record.system_id}`);
  if (!['active', 'offseason', 'unknown'].includes(record.season_state)) fail(`season state invalid: ${record.system_id}`);
  if (record.effective_start_date >= record.effective_end_date_exclusive) fail(`season effective window invalid: ${record.system_id}`);
  if (!record.official_source_url.startsWith('https://')) fail(`season source URL invalid: ${record.system_id}`);
  if (record.source_checked_date !== '2026-07-19') fail(`season checked date differs: ${record.system_id}`);
}

if (audit.schema_version !== 'calendar-current-horizon-recovery-audit-v1') fail('recovery audit schema differs');
if (audit.work_id !== 'WHR-CAL-DAILY-ACQUISITION') fail('recovery audit Work ID differs');
if (audit.generated_at !== '2026-07-19T15:00:00Z') fail('recovery audit snapshot timestamp differs');
if (audit.window?.start_date !== '2026-07-19' || audit.window?.end_date_exclusive !== '2026-08-18') fail('recovery audit window differs');
if (!Array.isArray(audit.systems) || audit.systems.length !== requiredSystems.length) fail('recovery audit system count differs');
for (const key of ['canonical_written', 'public_projection_written', 'deployment_performed']) {
  if (audit.publication_boundary?.[key] !== false) fail(`recovery audit ${key} must be false`);
}
if (audit.publication_boundary?.human_review_required !== true) fail('recovery audit must require human review');

const auditBySystem = new Map((audit.systems ?? []).map((record) => [record.system_id, record]));
const seasonBySystem = new Map((season.records ?? []).map((record) => [record.system_id, record]));
for (const systemId of requiredSystems) {
  const profile = registryBySystem.get(systemId);
  const audited = auditBySystem.get(systemId);
  const reviewedSeason = seasonBySystem.get(systemId);
  if (!audited) {
    fail(`audit disposition missing: ${systemId}`);
    continue;
  }
  if (audited.latest_public_meeting_date !== preRecoveryLatest.get(systemId)) fail(`${systemId} pre-recovery audit date differs`);
  const latestPublic = max((publicMeetings.meetings ?? [])
    .filter((meeting) => meeting.authority_id === profile.authority_id)
    .map((meeting) => meeting.date));
  if (latestPublic !== recoveredLatest.get(systemId)) fail(`${systemId} recovered public date differs: ${latestPublic}`);
  if (audited.season_state !== reviewedSeason?.season_state) fail(`${systemId} season state differs between audit and reviewed state`);
  if (!Array.isArray(audited.official_source_urls) || audited.official_source_urls.length === 0) fail(`${systemId} official sources missing`);
  if ((audited.official_source_urls ?? []).some((url) => typeof url !== 'string' || !url.startsWith('https://'))) fail(`${systemId} official source URL invalid`);
}

const expectedJraDates = ['2026-08-01', '2026-08-02', '2026-08-08', '2026-08-09', '2026-08-15', '2026-08-16'];
const expectedBaneiDates = ['2026-08-15', '2026-08-16', '2026-08-17'];
if (!exact(auditBySystem.get('japan-jra-system')?.expected_meeting_dates, expectedJraDates)) fail('JRA recovery meeting dates differ');
if (!exact(auditBySystem.get('japan-banei-system')?.expected_meeting_dates, expectedBaneiDates)) fail('Banei recovery meeting dates differ');
if (auditBySystem.get('hong-kong-hkjc-system')?.disposition !== 'no_recovery_job') fail('HKJC must be season-suppressed');
if (auditBySystem.get('uae-national-racing-system')?.disposition !== 'no_recovery_job') fail('UAE must be season-suppressed');

for (const [label, candidate, expectedCount] of [
  ['JRA', jraApproved, 18],
  ['NAR', narApproved, 51],
  ['Banei', baneiApproved, 3],
]) {
  if (candidate.schema_version !== 'timetable-candidate-v1' || candidate.review?.status !== 'approved' || candidate.records?.length !== expectedCount) fail(`${label} approved recovery envelope differs`);
  for (const record of candidate.records ?? []) {
    if (record.capability_rank !== 'C' || record.first_race_time_local !== null || record.last_race_time_local !== null || record.timetable_rows?.length !== 0) fail(`${record.meeting_id} exceeds Rank C recovery boundary`);
  }
}

const baneiRule = duePolicy.system_rules.find((rule) => rule.system_id === 'japan-banei-system');
if (!baneiRule || baneiRule.regular_refresh.enabled || baneiRule.coverage_gap.enabled || baneiRule.source_revalidation.enabled) fail('Banei ordinary Due-job policy must remain disabled');
if (baneiRule?.rank_retry.enabled !== true) fail('Banei reviewed rank retry must remain enabled');
const baneiExecution = executionPolicy.execution.systems.find((record) => record.system_id === 'japan-banei-system');
if (!baneiExecution || !exact(baneiExecution.allowed_reasons, ['rank_upgrade_retry']) || !exact(baneiExecution.allowed_collection_modes, ['selected_meetings'])) fail('Banei daily execution boundary differs');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-horizon-recovery-'));
const statePath = path.join(tempDir, 'state.json');
const planPath = path.join(tempDir, 'plan.json');
const stateRun = spawnSync(process.execPath, [
  'scripts/timetable/build-calendar-live-planner-state.mjs',
  '--as-of=2026-07-19T15:00:00Z',
  `--output=${statePath}`,
], { cwd: root, encoding: 'utf8' });
if (stateRun.status !== 0) fail(`live planner state failed: ${stateRun.stderr || stateRun.stdout}`);
else {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const states = new Map(state.system_states.map((record) => [record.system_id, record]));
  const jra = states.get('japan-jra-system');
  const nar = states.get('japan-nar-system');
  const banei = states.get('japan-banei-system');
  const hkjc = states.get('hong-kong-hkjc-system');
  if (jra?.season_state !== 'active' || jra.coverage_gaps?.[0]?.start_date !== '2026-08-17') fail('JRA post-recovery tail observation differs');
  if (nar?.season_state !== 'active' || nar.coverage_gaps?.length !== 0) fail('NAR recovered horizon must have no coverage gap');
  if (banei?.season_state !== 'active' || banei.coverage_gaps?.length !== 0) fail('Banei recovered horizon must have no coverage gap');
  if (hkjc?.season_state !== 'offseason' || hkjc.coverage_gaps?.length !== 0) fail('HKJC offseason suppression differs');

  const planRun = spawnSync(process.execPath, [
    'scripts/timetable/plan-calendar-due-jobs.mjs',
    `--state=${statePath}`,
    `--output=${planPath}`,
  ], { cwd: root, encoding: 'utf8' });
  if (planRun.status !== 0) fail(`Due-job planning failed: ${planRun.stderr || planRun.stdout}`);
  else {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const jobs = plan.collection_plan.jobs;
    if (!jobs.some((job) => job.system_id === 'japan-jra-system')) fail('JRA bounded local follow-up work missing');
    if (jobs.some((job) => job.system_id === 'japan-nar-system' && job.reason === 'coverage_gap')) fail('NAR recovered horizon must not create coverage-gap work');
    if (jobs.some((job) => job.system_id === 'hong-kong-hkjc-system')) fail('HKJC offseason Job must be suppressed');
    if (jobs.some((job) => job.system_id === 'japan-banei-system' && job.reason !== 'rank_upgrade_retry')) fail('Banei ordinary recovery Job must remain disabled');
  }
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
console.log('WINDOW: 2026-07-19..2026-08-18');
console.log('RECOVERED: JRA=18,NAR=51,BANEI=3');
console.log('SEASON_SUPPRESSED: HKJC,UAE');
console.log('PUBLIC_RANK_C_ONLY: true');
