import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const candidatePath = 'data/candidates/nar-monthly-2026-07-full-month-candidates.json';
const reportPath = 'data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json';
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json'), 'utf8'));
const candidates = JSON.parse(fs.readFileSync(path.join(root, candidatePath), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, reportPath), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (candidates.schema_version !== 'nar-full-month-candidate-set-v1') fail('candidate schema differs.');
if (report.schema_version !== 'nar-full-month-collection-report-v1') fail('report schema differs.');
if (candidates.generated_at !== report.generated_at) fail('candidate/report generated_at differs.');
for (const value of [candidates, report]) {
  if (value.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('Work ID differs.');
  if (value.target_month !== '2026-07') fail('target month differs.');
  if (value.month_start !== '2026-07-01' || value.month_end !== '2026-07-31') fail('full-month boundary differs.');
  if (value.through_date !== null) fail('full-month output must not contain a partial through_date.');
}
if (report.schedule_scope_complete !== true || report.partial_cutoff_completion_allowed !== false) fail('full-month completion boundary differs.');
if (report.racecourses_checked !== 14 || candidates.venue_statuses?.length !== 14) fail('all fourteen NAR flat racecourses must be classified.');
if (candidates.review?.status !== 'needs_review' || candidates.review?.promotion_eligible !== false) fail('full-month candidates must remain review-only.');
if (candidates.review?.canonical_write !== 'disabled' || candidates.review?.public_write !== 'disabled') fail('canonical/public writes must remain disabled.');

const matrixIds = new Set(matrix.records.map((record) => record.racecourse_id));
const schedule = candidates.schedule_meetings ?? [];
const aPlus = candidates.a_plus_meetings ?? [];
const pending = candidates.pending_details ?? [];
const blockers = candidates.blockers ?? [];
if (report.meetings_scheduled !== schedule.length) fail('scheduled meeting count differs.');
if (report.complete_a_plus_candidates !== aPlus.length) fail('A+ candidate count differs.');
if (report.pending_detail_meetings !== pending.length) fail('pending detail count differs.');
if (report.blocked_meetings !== blockers.length) fail('blocker count differs.');
if (schedule.length !== aPlus.length + pending.length + blockers.length) fail('every scheduled meeting must resolve to A+, pending detail, or blocker.');

const scheduleIds = new Set();
for (const meeting of schedule) {
  if (scheduleIds.has(meeting.meeting_id)) fail(`duplicate schedule meeting ${meeting.meeting_id}.`);
  scheduleIds.add(meeting.meeting_id);
  if (!matrixIds.has(meeting.racecourse_id)) fail(`${meeting.meeting_id} racecourse is outside NAR flat scope.`);
  if (!meeting.date?.startsWith('2026-07-')) fail(`${meeting.meeting_id} date is outside July.`);
  if (meeting.schedule_status !== 'scheduled') fail(`${meeting.meeting_id} schedule status differs.`);
  if (!String(meeting.official_race_list_url ?? '').startsWith('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList')) fail(`${meeting.meeting_id} RaceList URL differs.`);
}

const stateIds = new Set();
for (const meeting of aPlus) {
  if (!scheduleIds.has(meeting.candidate_id)) fail(`${meeting.candidate_id} A+ candidate is outside schedule.`);
  if (stateIds.has(meeting.candidate_id)) fail(`${meeting.candidate_id} has duplicate detail state.`);
  stateIds.add(meeting.candidate_id);
  if (meeting.meeting_completeness?.all_a_plus_fields_complete !== true) fail(`${meeting.candidate_id} is not A+ complete.`);
}
for (const meeting of pending) {
  const id = `nar-${meeting.racecourse_id}-${meeting.date}`;
  if (!scheduleIds.has(id)) fail(`${id} pending detail is outside schedule.`);
  if (stateIds.has(id)) fail(`${id} has duplicate detail state.`);
  stateIds.add(id);
  if (meeting.status !== 'scheduled_pending_details') fail(`${id} pending status differs.`);
  if (meeting.date <= report.as_of_date) fail(`${id} past/current meeting cannot be pending detail.`);
}
for (const meeting of blockers) {
  const id = `nar-${meeting.racecourse_id}-${meeting.date}`;
  if (!scheduleIds.has(id)) fail(`${id} blocker is outside schedule.`);
  if (stateIds.has(id)) fail(`${id} has duplicate detail state.`);
  stateIds.add(id);
  if (meeting.date > report.as_of_date) fail(`${id} future detail unavailability must be pending, not blocked.`);
}
if (stateIds.size !== scheduleIds.size) fail('scheduled meeting detail-state coverage is incomplete.');

const forbiddenFragments = ['horse', 'runner', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'tips', 'raw_html', 'source_body', 'stream_url'];
function inspect(value, location = 'root') {
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${location}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenFragments.some((fragment) => key.toLowerCase().includes(fragment))) fail(`${location}.${key} is outside public-safe boundary.`);
    inspect(child, `${location}.${key}`);
  }
}
inspect(candidates, 'candidates');
inspect(report, 'report');

if (errors.length) {
  console.error(`CALENDAR_NAR_FULL_MONTH_CANDIDATE_SET: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_FULL_MONTH_CANDIDATE_SET: pass');
console.log(`SCHEDULED_MEETINGS: ${schedule.length}`);
console.log(`A_PLUS_COMPLETE: ${aPlus.length}`);
console.log(`PENDING_DETAILS: ${pending.length}`);
console.log(`BLOCKERS: ${blockers.length}`);
console.log('MONTH_BOUNDARY: 2026-07-01..2026-07-31');
console.log('PARTIAL_CUTOFF_COMPLETION_ALLOWED: false');
