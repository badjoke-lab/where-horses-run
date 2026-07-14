import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  resolveAuthoritySourceInventory,
  resolveCalendarReadinessRegistry,
} from './timetable/pipeline-v1/registry-overrides.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/japan-a-plus-reconciliation-completion.json');
const baseReadiness = parse('data/static/calendar-readiness-registry.json');
const japanReadiness = parse('data/static/calendar-readiness-japan-v2.json');
const runtimeControl = parse('data/static/japan-a-plus-runtime-control.json');
const policy = parse('data/static/japan-a-plus-policy.json');
const baseAuthority = parse('data/static/authority-source-inventory.json');
const japanAuthority = parse('data/static/authority-source-inventory-japan-v2.json');
const profile = parse('data/static/country-profiles-v2-13-japan.json')[0];
const sourceSummary = parse('docs/timetable-source-tests/13-japan/final-summary.json');
const narControl = parse('data/static/local-racing-pilot-control-v2.json');
const baneiControl = parse('data/static/banei-pilot-control.json');
const baneiApprovedCandidate = parse('data/candidates/banei-current-window-a-plus-approved.json');
const canonicalDetails = parse('data/generated/timetable/canonical/meeting-details.json');
const publicMeetings = parse('data/generated/timetable/public/meeting-list.json');
const publicDetails = parse('data/generated/timetable/public/meeting-details.json');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const startHere = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');
const plan = read('docs/calendar/japan-a-plus-reconciliation-plan.md');
const note = read('docs/country-page-notes/13-japan.md');

const expectedSystems = [
  {
    system_id: 'japan-jra-system',
    key: 'japan/jra/jra-programme',
    activation: 'active',
  },
  {
    system_id: 'japan-nar-system',
    key: 'japan/nar-local-government-racing/nar-monthly-convene-info',
    activation: 'pending_pilot',
  },
  {
    system_id: 'japan-banei-system',
    key: 'japan/banei-tokachi/banei-official-schedule',
    activation: 'pending_pilot',
  },
];

if (audit.schema_version !== 'japan-a-plus-reconciliation-completion-v1') fail('completion audit schema is invalid.');
if (audit.work_id !== 'WHR-CAL-JAPAN-A-PLUS-RECONCILE' || audit.status !== 'complete') fail('reconciliation audit must be complete.');
if (audit.next_work_id !== 'WHR-CAL-JAPAN-JRA-A-PLUS') fail('completion audit next Work ID is incorrect.');
if (audit.following_work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('completion audit following Work ID is incorrect.');

const resolvedReadiness = resolveCalendarReadinessRegistry(baseReadiness, japanReadiness, runtimeControl);
const resolvedAuthority = resolveAuthoritySourceInventory(baseAuthority, japanAuthority);
const policyBySystem = new Map(policy.records.map((record) => [record.system_id, record]));
const readinessBySystem = new Map(resolvedReadiness.records.map((record) => [record.system_id, record]));
const runtimeBySystem = new Map(runtimeControl.records.map((record) => [record.system_id, record]));

if (japanReadiness.records.length !== 3) fail('Japan readiness overlay must contain three systems.');
if (japanAuthority.records.length !== 3) fail('Japan authority overlay must contain three systems.');
if (runtimeControl.records.length !== 3) fail('Japan runtime control must contain three systems.');
if (policy.records.length !== 3) fail('Japan A+ policy must contain three systems.');

for (const expected of expectedSystems) {
  const readiness = readinessBySystem.get(expected.system_id);
  const runtime = runtimeBySystem.get(expected.system_id);
  const policyRecord = policyBySystem.get(expected.system_id);
  const authority = resolvedAuthority.records.find((record) =>
    `${record.country_id}/${record.authority_id}/${record.official_source_id}` === expected.key
  );
  const auditRecord = audit.systems.find((record) => record.system_id === expected.system_id);

  if (!readiness) fail(`missing resolved readiness ${expected.system_id}.`);
  else {
    if (readiness.authority_source_key !== expected.key) fail(`${expected.system_id} readiness source key differs.`);
    if (readiness.technical_rank !== 'A+' || readiness.public_ceiling !== 'A+') fail(`${expected.system_id} must resolve to A+/A+.`);
    if (readiness.readiness !== 'prototype_ready') fail(`${expected.system_id} readiness must be prototype_ready.`);
    if (readiness.implementation_status !== 'prototype') fail(`${expected.system_id} implementation status must be prototype.`);
    if (readiness.fallback !== 'downgrade_to_C') fail(`${expected.system_id} fallback must be downgrade_to_C.`);
    if (readiness.public_projection_activation !== expected.activation) fail(`${expected.system_id} activation must be ${expected.activation}.`);
  }

  if (!runtime || runtime.public_projection_activation !== expected.activation) fail(`${expected.system_id} runtime activation differs.`);
  if (!policyRecord || policyRecord.technical_rank !== 'A+' || policyRecord.public_ceiling !== 'A+') fail(`${expected.system_id} policy must be A+/A+.`);
  if (!authority || authority.capability_rank !== 'A+') fail(`${expected.system_id} authority capability must be A+.`);
  if (!auditRecord || auditRecord.technical_rank !== 'A+' || auditRecord.public_ceiling !== 'A+' || auditRecord.public_projection_activation !== expected.activation) {
    fail(`${expected.system_id} completion-audit state differs.`);
  }
}

if (profile.country_id !== 'japan' || profile.public_display_ceiling !== 'A+') fail('Japan Profile v2 must use A+ public ceiling.');
if (!Array.isArray(profile.systems) || profile.systems.length !== 3) fail('Japan Profile v2 must contain three systems.');
for (const expected of expectedSystems) {
  if (!profile.systems.some((system) => system.id === expected.system_id)) fail(`Japan Profile v2 missing ${expected.system_id}.`);
}

if (sourceSummary.technical_rank !== 'A+' || sourceSummary.public_ceiling !== 'A+') fail('Japan Source Test summary must use A+/A+.');
if (!Array.isArray(sourceSummary.systems) || sourceSummary.systems.length !== 3) fail('Japan Source Test summary must retain three systems.');

if (narControl.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('NAR control Work ID is stale.');
if (narControl.expected_technical_rank !== 'A+' || narControl.expected_public_ceiling !== 'A+') fail('NAR control must expect A+/A+.');
if (narControl.schedule_mode !== 'disabled' || narControl.public_write_mode !== 'human_approval_only') fail('NAR control boundary changed.');

if (baneiControl.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('Banei control Work ID is stale.');
if (baneiControl.expected_technical_rank !== 'A+' || baneiControl.expected_public_ceiling !== 'A+') fail('Banei control must expect A+/A+.');
if (baneiControl.schedule_mode !== 'disabled' || baneiControl.public_write_mode !== 'human_approval_only') fail('Banei control boundary changed.');

const julyJraMeetings = publicMeetings.meetings.filter((meeting) =>
  meeting.country_id === 'japan' &&
  meeting.authority_id === 'jra' &&
  meeting.date?.startsWith('2026-07') &&
  meeting.effective_public_rank === 'A+'
);
const julyJraIds = new Set(julyJraMeetings.map((meeting) => meeting.meeting_id));
const julyJraDetails = publicDetails.details.filter((detail) => julyJraIds.has(detail.meeting_id));
const julyRows = julyJraDetails.reduce((sum, detail) => sum + detail.timetable_rows.length, 0);

if (julyJraMeetings.length < audit.jra_public_baseline.minimum_a_plus_meetings) fail('July JRA A+ meeting baseline is not met.');
if (julyJraDetails.length !== julyJraMeetings.length) fail('Every July JRA A+ meeting must have public detail.');
if (julyRows < audit.jra_public_baseline.minimum_timetable_rows) fail('July JRA timetable-row baseline is not met.');

for (const detail of julyJraDetails) {
  if (!detail.show_race_name || !detail.show_distance || !detail.show_surface || !detail.show_course) fail(`${detail.meeting_id} A+ display flags are incomplete.`);
  for (const row of detail.timetable_rows) {
    const keys = Object.keys(row).sort();
    const allowed = new Set(audit.jra_public_baseline.allowed_fields);
    for (const key of keys) if (!allowed.has(key)) fail(`${detail.meeting_id} exposes disallowed field ${key}.`);
    for (const key of audit.jra_public_baseline.allowed_fields) {
      if (!(key in row) || row[key] === null || row[key] === '') fail(`${detail.meeting_id} row is missing ${key}.`);
    }
  }
}

const canonicalDetailById = new Map(canonicalDetails.details.map((detail) => [detail.meeting_id, detail]));
for (const detail of publicDetails.details.filter((detail) => detail.country_id === 'japan' && detail.authority_id === 'nar-local-government-racing' && detail.effective_public_rank === 'A+')) {
  const canonical = canonicalDetailById.get(detail.meeting_id);
  if (canonical?.source_trace?.source_id !== 'nar-race-list-deba-table') {
    fail(`${detail.meeting_id} NAR A+ is not backed by the reviewed RaceList/DebaTable source.`);
  }
}

const approvedBaneiRecords = baneiApprovedCandidate.records ?? [];
const approvedBaneiIds = new Set(approvedBaneiRecords.map((record) => record.meeting_id));
const baneiPublicAPlusDetails = publicDetails.details.filter((detail) =>
  detail.country_id === 'japan' &&
  detail.authority_id === 'banei-tokachi' &&
  detail.effective_public_rank === 'A+'
);
if (
  baneiApprovedCandidate.schema_version !== 'timetable-candidate-v1' ||
  baneiApprovedCandidate.country_id !== 'japan' ||
  baneiApprovedCandidate.authority_id !== 'banei-tokachi' ||
  baneiApprovedCandidate.source_id !== 'nar-banei-race-list-deba-table' ||
  baneiApprovedCandidate.review?.status !== 'approved' ||
  baneiApprovedCandidate.review?.promotion_target !== 'canonical-timetable-v0' ||
  approvedBaneiRecords.length !== 1
) {
  fail('Banei reviewed A+ Candidate envelope differs.');
}
if (baneiPublicAPlusDetails.length !== approvedBaneiRecords.length) {
  fail('Banei public A+ set must exactly match the reviewed Candidate set.');
}
const baneiAllowedFields = new Set(['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']);
const baneiForbiddenFragments = ['horse', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction', 'raw_html', 'source_body', 'stream_url'];
for (const detail of baneiPublicAPlusDetails) {
  if (!approvedBaneiIds.has(detail.meeting_id)) fail(`${detail.meeting_id} is not in the reviewed Banei A+ Candidate.`);
  const candidate = approvedBaneiRecords.find((record) => record.meeting_id === detail.meeting_id);
  const canonical = canonicalDetailById.get(detail.meeting_id);
  if (canonical?.source_trace?.source_id !== 'nar-banei-race-list-deba-table') fail(`${detail.meeting_id} Banei A+ source differs.`);
  if (candidate?.capability_rank !== 'A+' || candidate?.review_status !== 'approved') fail(`${detail.meeting_id} Banei Candidate approval differs.`);
  if (detail.timetable_rows?.length !== 12 || candidate?.timetable_rows?.length !== 12) fail(`${detail.meeting_id} Banei A+ must retain exactly 12 reviewed rows.`);
  if (!detail.show_race_name || !detail.show_distance || !detail.show_surface || !detail.show_course) fail(`${detail.meeting_id} Banei A+ display flags are incomplete.`);
  for (const row of detail.timetable_rows ?? []) {
    for (const key of Object.keys(row)) {
      if (!baneiAllowedFields.has(key)) fail(`${detail.meeting_id} exposes disallowed Banei A+ field ${key}.`);
      if (baneiForbiddenFragments.some((fragment) => key.toLowerCase().includes(fragment))) fail(`${detail.meeting_id} exposes forbidden Banei field ${key}.`);
    }
    for (const key of baneiAllowedFields) {
      if (!(key in row) || row[key] === null || row[key] === '') fail(`${detail.meeting_id} Banei row is missing ${key}.`);
    }
  }
}

for (const stale of [
  'Public display ceiling | A |',
  'public display ceiling remains A',
  'remain capped at A',
  'at or below rank A',
]) {
  if (note.toLowerCase().includes(stale.toLowerCase())) fail(`Japan note retains stale assumption: ${stale}`);
}

for (const [file, text] of [
  ['START-HERE.md', startHere],
  ['docs/project-roadmap.md', roadmap],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap],
]) {
  if (!text.includes('WHR-CAL-JAPAN-JRA-A-PLUS')) fail(`${file} missing current JRA A+ Work ID.`);
  if (!text.includes('WHR-CAL-JAPAN-NAR-A-PLUS')) fail(`${file} missing next NAR A+ Work ID.`);
  if (!text.includes('WHR-CAL-JAPAN-A-PLUS-RECONCILE')) fail(`${file} missing completed reconciliation Work ID.`);
}
if (!plan.includes('Status: complete') || !plan.includes('Completed: 2026-07-03')) fail('reconciliation plan is not marked complete.');

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');
for (const value of Object.values(audit.boundaries)) {
  if (typeof value !== 'boolean') fail('completion audit boundaries must be boolean.');
}
if (audit.boundaries.scheduled_refresh_active !== false || audit.boundaries.unattended_public_write_active !== false) fail('completion audit publication boundaries changed.');

if (errors.length) {
  console.error(`JAPAN_A_PLUS_RECONCILIATION_COMPLETION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JAPAN_A_PLUS_RECONCILIATION_COMPLETION: pass');
console.log(`JULY_JRA_A_PLUS_MEETINGS: ${julyJraMeetings.length}`);
console.log(`JULY_JRA_TIMETABLE_ROWS: ${julyRows}`);
console.log(`REVIEWED_BANEI_A_PLUS_DETAILS: ${baneiPublicAPlusDetails.length}`);
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA-A-PLUS');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
