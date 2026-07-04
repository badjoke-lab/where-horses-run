import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowEmpty = process.argv.includes('--allow-empty');
const candidatePath = path.join(root, 'data/candidates/nar-monthly-meeting-candidates.json');
const reportPath = path.join(root, 'data/generated/timetable/nar-monthly-collection-report.json');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json'), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if ((!fs.existsSync(candidatePath) || !fs.existsSync(reportPath)) && allowEmpty) {
  console.log('CALENDAR_NAR_MONTHLY_CANDIDATE_SET: empty-allowed');
  process.exit(0);
}
if (!fs.existsSync(candidatePath)) fail('monthly candidate file is missing.');
if (!fs.existsSync(reportPath)) fail('monthly report file is missing.');

const matrixByRacecourse = new Map(matrix.records.map((record) => [record.racecourse_id, record]));
const forbiddenFragments = ['horse', 'runner', 'jockey', 'trainer', 'odds', 'result', 'payout', 'prediction', 'raw_html', 'source_body', 'body_weight', 'draw', 'gate', 'stream'];
const rowKeys = new Set(['race_number', 'label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label', 'source_trace']);
const traceKeys = new Set(['list_url', 'detail_url', 'detail_http_status', 'detail_encoding', 'detail_parsed', 'course_metadata_source']);
const validMetadataSources = new Set(['deba_table', 'race_list_and_racecourse_matrix']);

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}
function inspectForbidden(value, location = 'root') {
  if (Array.isArray(value)) return value.forEach((item, index) => inspectForbidden(item, `${location}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const match = forbiddenFragments.find((fragment) => key.toLowerCase().includes(fragment));
    if (match) fail(`${location}.${key} contains forbidden key fragment ${match}.`);
    inspectForbidden(child, `${location}.${key}`);
  }
}
function continuousFromOne(values) {
  return values.length >= 2 && values.every((value, index) => value === index + 1);
}

const candidates = readJson(candidatePath);
const report = readJson(reportPath);
if (candidates && candidates.schema_version !== 'nar-monthly-meeting-candidates-v1') fail('candidate schema differs.');
if (report && report.schema_version !== 'nar-monthly-collection-report-v1') fail('report schema differs.');
if (candidates && report && candidates.generated_at !== report.generated_at) fail('candidate/report generated_at differs.');
if (candidates && report && candidates.target_month !== report.target_month) fail('candidate/report target month differs.');
if (candidates?.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS' || report?.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('Work ID differs.');
if (candidates?.review?.status !== 'needs_review' || candidates?.review?.promotion_eligible !== false) fail('monthly candidates must remain needs_review and not promotion eligible.');
if (candidates?.review?.canonical_write !== 'disabled' || candidates?.review?.public_write !== 'disabled') fail('monthly candidate canonical/public writes must be disabled.');
if (candidates?.review?.raw_source_storage !== 'disabled') fail('raw source storage must be disabled.');

const venueStatuses = candidates?.venue_statuses ?? [];
if (venueStatuses.length !== 14 || report?.racecourses_checked !== 14) fail('monthly set must classify all fourteen racecourses.');
const seen = new Set();
for (const status of venueStatuses) {
  if (seen.has(status.racecourse_id)) fail(`duplicate venue status ${status.racecourse_id}.`);
  seen.add(status.racecourse_id);
  const matrixRecord = matrixByRacecourse.get(status.racecourse_id);
  if (!matrixRecord) fail(`venue status outside matrix: ${status.racecourse_id}.`);
  if (matrixRecord && status.venue_code !== matrixRecord.venue_code) fail(`venue code differs for ${status.racecourse_id}.`);
  if (!['has_target_month_meetings', 'no_meeting_in_target_month'].includes(status.status)) fail(`invalid venue status for ${status.racecourse_id}.`);
  if (status.status === 'no_meeting_in_target_month' && status.meeting_count !== 0) fail(`no-meeting venue has meetings: ${status.racecourse_id}.`);
  if (status.status === 'has_target_month_meetings' && status.meeting_count < 1) fail(`active venue has no meetings: ${status.racecourse_id}.`);
}
for (const record of matrix.records) if (!seen.has(record.racecourse_id)) fail(`missing venue status for ${record.racecourse_id}.`);

const meetings = candidates?.meetings ?? [];
const blockers = candidates?.blockers ?? [];
if (report?.complete_meeting_candidates !== meetings.length) fail('report candidate count differs.');
if (report?.blocked_meetings !== blockers.length) fail('report blocker count differs.');
if (report?.promotion_eligible_candidates !== 0 || report?.publication_effect !== 'none') fail('report promotion/publication boundary differs.');

const meetingIds = new Set();
for (const meeting of meetings) {
  const prefix = `${meeting.candidate_id}:`;
  if (meetingIds.has(meeting.candidate_id)) fail(`${prefix} duplicate candidate id.`);
  meetingIds.add(meeting.candidate_id);
  if (meeting.schema_version !== 'nar-monthly-meeting-candidate-v1') fail(`${prefix} schema differs.`);
  if (meeting.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail(`${prefix} Work ID differs.`);
  if (meeting.country_id !== 'japan' || meeting.authority_id !== 'nar-local-government-racing' || meeting.racing_system_id !== 'japan-nar-system') fail(`${prefix} identity differs.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meeting.date ?? '')) fail(`${prefix} date differs.`);
  if (!meeting.date.startsWith(candidates.target_month)) fail(`${prefix} date is outside target month.`);
  const matrixRecord = matrixByRacecourse.get(meeting.racecourse_id);
  if (!matrixRecord) fail(`${prefix} racecourse is outside matrix.`);
  if (matrixRecord && meeting.venue_code !== matrixRecord.venue_code) fail(`${prefix} venue code differs.`);
  if (meeting.source?.storage_policy !== 'public_safe_extracted_fields_only_no_raw_html') fail(`${prefix} storage policy differs.`);
  if (meeting.source?.list_http_status !== 200) fail(`${prefix} RaceList status must be 200.`);
  if (meeting.review?.status !== 'needs_review' || meeting.review?.promotion_eligible !== false) fail(`${prefix} candidate must remain needs_review and not promotion eligible.`);

  const rows = meeting.timetable_rows ?? [];
  const expected = meeting.meeting_completeness?.expected_race_numbers ?? [];
  if (!continuousFromOne(expected)) fail(`${prefix} expected race numbers are not continuous from one.`);
  if (rows.length !== expected.length) fail(`${prefix} row count differs.`);
  if (meeting.meeting_completeness?.all_a_plus_fields_complete !== true) fail(`${prefix} A+ flag must be true.`);
  rows.forEach((row, index) => {
    const raceNumber = index + 1;
    if (row.race_number !== raceNumber || row.label !== `Race ${raceNumber}`) fail(`${prefix} row ${raceNumber} identity differs.`);
    for (const key of Object.keys(row)) if (!rowKeys.has(key)) fail(`${prefix} row ${raceNumber} unexpected key ${key}.`);
    for (const key of ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) if (row[key] === null || row[key] === '') fail(`${prefix} row ${raceNumber} missing ${key}.`);
    if (!/^\d{2}:\d{2}$/.test(String(row.post_time_local))) fail(`${prefix} row ${raceNumber} time differs.`);
    if (!Number.isInteger(row.distance_m) || row.distance_m < 600 || row.distance_m > 6000) fail(`${prefix} row ${raceNumber} distance differs.`);
    if (!['Dirt', 'Turf'].includes(row.surface)) fail(`${prefix} row ${raceNumber} surface differs.`);
    if (meeting.racecourse_id !== 'morioka-racecourse' && row.surface === 'Turf') fail(`${prefix} non-Morioka venue claims turf.`);
    if (!String(row.course_label).startsWith(`${row.surface} Course`)) fail(`${prefix} row ${raceNumber} course label differs.`);
    for (const key of Object.keys(row.source_trace ?? {})) if (!traceKeys.has(key)) fail(`${prefix} row ${raceNumber} trace unexpected key ${key}.`);
    if (!validMetadataSources.has(row.source_trace?.course_metadata_source)) fail(`${prefix} row ${raceNumber} metadata source differs.`);
  });
}
for (const blocker of blockers) {
  if (!matrixByRacecourse.has(blocker.racecourse_id)) fail(`blocker outside matrix: ${blocker.racecourse_id}.`);
  if (!['meeting_incomplete', 'source_unavailable', 'parser_failure', 'http_error'].includes(blocker.status)) fail(`invalid blocker status: ${blocker.status}.`);
}
if (candidates) inspectForbidden(candidates, 'candidates');
if (report) inspectForbidden(report, 'report');

if (errors.length) {
  console.error(`CALENDAR_NAR_MONTHLY_CANDIDATE_SET: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_MONTHLY_CANDIDATE_SET: pass');
console.log(`RACECOURSES_CLASSIFIED: ${venueStatuses.length}`);
console.log(`MEETING_CANDIDATES: ${meetings.length}`);
console.log(`BLOCKED_MEETINGS: ${blockers.length}`);
console.log('PROMOTION_ELIGIBLE: 0');
console.log('PUBLICATION_EFFECT: none');
