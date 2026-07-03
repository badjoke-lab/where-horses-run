import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const fixture = json('data/fixtures/timetable/nar/route-probe-v1.json');
const candidates = json('data/candidates/nar-route-probe-candidates.json');
const audit = json('data/audits/nar-candidate-adapter-v1.json');
const canonical = json('data/generated/timetable/canonical/meetings.json');
const publicList = json('data/generated/timetable/public/meeting-list.json');
const publicDetails = json('data/generated/timetable/public/meeting-details.json');
const runtimeControl = json('data/static/japan-a-plus-runtime-control.json');
const adapter = read('scripts/timetable/build-nar-route-probe-candidates.mjs');
const doc = read('docs/calendar/nar-candidate-adapter.md');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (candidates.schema_version !== 'nar-route-probe-candidates-v1') fail('unexpected candidate schema.');
if (candidates.generated_from !== 'data/fixtures/timetable/nar/route-probe-v1.json') fail('candidate source fixture differs.');
if (candidates.adapter_id !== 'nar-route-probe-candidate-adapter-v1') fail('candidate adapter ID differs.');
if (candidates.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('candidate Work ID differs.');
if (candidates.review?.status !== 'needs_review') fail('candidate envelope must require review.');
if (candidates.review?.promotion_eligible !== false) fail('candidate envelope must be non-promotable.');
if (!candidates.review?.reason?.includes('complete meeting coverage')) fail('candidate envelope lacks completeness reason.');
if (!Array.isArray(candidates.records) || candidates.records.length !== 2) fail('candidate output must contain two records.');
if (candidates.records.length !== fixture.observations.length) fail('candidate and fixture counts differ.');

const allowedFields = new Set(['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']);
const fixtureByProbe = new Map(fixture.observations.map((row) => [row.probe_id, row]));
const ids = new Set();
for (const record of candidates.records ?? []) {
  if (ids.has(record.candidate_id)) fail(`duplicate candidate ID ${record.candidate_id}.`);
  ids.add(record.candidate_id);
  const source = fixtureByProbe.get(record.probe_id);
  if (!source) {
    fail(`${record.candidate_id} has no fixture source.`);
    continue;
  }
  if (record.country_id !== 'japan') fail(`${record.candidate_id} country differs.`);
  if (record.authority_id !== 'nar-local-government-racing') fail(`${record.candidate_id} authority differs.`);
  if (record.racing_system_id !== 'japan-nar-system') fail(`${record.candidate_id} system differs.`);
  if (record.racecourse_id !== source.racecourse_id || record.venue_code !== source.venue_code || record.date !== source.date) fail(`${record.candidate_id} identity differs from fixture.`);
  if (record.timezone !== 'Asia/Tokyo') fail(`${record.candidate_id} timezone differs.`);
  if (record.evidence_scope !== 'single_race_route_probe') fail(`${record.candidate_id} evidence scope differs.`);
  if (record.capability_observed !== 'A+_field_shape') fail(`${record.candidate_id} observed capability differs.`);
  if (record.meeting_completeness !== 'not_established') fail(`${record.candidate_id} completeness must remain unestablished.`);
  if (record.promotion_eligible !== false || record.review_status !== 'needs_review') fail(`${record.candidate_id} promotion boundary differs.`);
  if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length !== 1) fail(`${record.candidate_id} must remain a single-race probe.`);
  const row = record.timetable_rows?.[0] ?? {};
  for (const key of Object.keys(row)) if (!allowedFields.has(key)) fail(`${record.candidate_id} exposes unexpected field ${key}.`);
  for (const key of allowedFields) if (!(key in row) || row[key] === null || row[key] === '') fail(`${record.candidate_id} missing ${key}.`);
  if (JSON.stringify(row) !== JSON.stringify(source.public_safe_fields)) fail(`${record.candidate_id} row differs from fixture.`);
  if (record.source?.fixture_path !== candidates.generated_from) fail(`${record.candidate_id} fixture trace differs.`);
  if (record.source?.source_status !== 'verified') fail(`${record.candidate_id} source must be verified.`);
}

if (audit.schema_version !== 'nar-candidate-adapter-audit-v1') fail('unexpected adapter audit schema.');
if (audit.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('adapter audit Work ID differs.');
if (audit.phase !== 'candidate_only_adapter' || audit.status !== 'complete') fail('adapter audit is incomplete.');
if (audit.candidate_count !== 2 || audit.promotion_eligible_count !== 0) fail('adapter audit counts differ.');
if (audit.review_status !== 'needs_review') fail('adapter audit review status differs.');
if (audit.canonical_write !== 'disabled' || audit.public_write !== 'disabled' || audit.schedule_mode !== 'disabled') fail('adapter audit write boundary differs.');
if (audit.next_phase !== 'complete_meeting_fixture') fail('adapter audit next phase differs.');

for (const marker of [
  "inputPath = 'data/fixtures/timetable/nar/route-probe-v1.json'",
  "outputPath = 'data/candidates/nar-route-probe-candidates.json'",
  "promotion_eligible: false",
  "review_status: 'needs_review'",
  "meeting_completeness: 'not_established'",
]) {
  if (!adapter.includes(marker)) fail(`adapter missing marker: ${marker}`);
}
for (const forbidden of ['canonical/meetings.json', 'public/meeting-list.json', 'build-public-timetable-view']) {
  if (adapter.includes(forbidden)) fail(`adapter must not reference ${forbidden}.`);
}

const probeIds = new Set(candidates.records.map((record) => record.probe_id));
for (const meeting of canonical.meetings ?? []) if (probeIds.has(meeting.meeting_id)) fail(`${meeting.meeting_id} leaked into canonical meetings.`);
for (const meeting of publicList.meetings ?? []) if (probeIds.has(meeting.meeting_id)) fail(`${meeting.meeting_id} leaked into public meeting list.`);
for (const detail of publicDetails.details ?? []) if (probeIds.has(detail.meeting_id)) fail(`${detail.meeting_id} leaked into public meeting details.`);

const runtime = runtimeControl.records?.find((record) => record.system_id === 'japan-nar-system');
if (!runtime || runtime.public_projection_activation !== 'pending_pilot') fail('NAR runtime projection must remain pending_pilot.');
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

for (const phrase of [
  'Status: complete',
  'promotion_eligible: false',
  'meeting_completeness: not_established',
  'does not write canonical meetings',
  'complete meeting fixture',
]) {
  if (!doc.includes(phrase)) fail(`adapter document missing: ${phrase}`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_CANDIDATE_ADAPTER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_CANDIDATE_ADAPTER: pass');
console.log(`CANDIDATES: ${candidates.records.length}`);
console.log('PROMOTION_ELIGIBLE: 0');
console.log('NEXT_PHASE: complete_meeting_fixture');
