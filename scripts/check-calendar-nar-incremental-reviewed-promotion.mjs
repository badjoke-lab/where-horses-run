import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const requirePromoted = process.argv.includes('--require-promoted');
const sourcePath = 'data/candidates/nar-incremental-meeting-candidates.json';
const reportPath = 'data/generated/timetable/nar-incremental-collection-report.json';
const coveragePath = 'data/generated/timetable/nar-coverage-observation.json';
const retryPath = 'data/generated/timetable/nar-retry-targets.json';
const reviewPath = 'data/reviews/nar-incremental-2026-07-05-through-2026-07-07-review.json';
const approvedPath = 'data/candidates/nar-incremental-2026-07-05-through-2026-07-07-approved.json';
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicMeetingsPath = 'data/generated/timetable/public/meeting-list.json';
const publicDetailsPath = 'data/generated/timetable/public/meeting-details.json';
const canonicalSourceId = 'nar-race-list-deba-table';
const errors = [];
const fail = (message) => errors.push(message);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function mapBy(records, key) {
  return new Map(records.map((record) => [record[key], record]));
}
function rowProjection(row) {
  return {
    label: row.label,
    post_time_local: row.post_time_local,
    race_name: row.race_name,
    distance_m: row.distance_m,
    surface: row.surface,
    course_label: row.course_label,
  };
}

const source = readJson(sourcePath);
const report = readJson(reportPath);
const coverage = readJson(coveragePath);
const retries = readJson(retryPath);
const review = readJson(reviewPath);
const approved = readJson(approvedPath);
const sourceBlobSha = execFileSync('git', ['hash-object', sourcePath], { cwd: root, encoding: 'utf8' }).trim();

if (source.schema_version !== 'nar-incremental-meeting-candidates-v1') fail('incremental source schema differs.');
if (report.schema_version !== 'nar-incremental-collection-report-v1') fail('incremental report schema differs.');
if (review.schema_version !== 'nar-incremental-review-decision-v1') fail('incremental review schema differs.');
if (review.source_candidate_blob_sha !== sourceBlobSha) fail(`review source blob SHA differs: expected ${review.source_candidate_blob_sha} actual ${sourceBlobSha}`);
if (review.source_generated_at !== source.generated_at || report.generated_at !== source.generated_at || coverage.checked_at !== source.generated_at || retries.generated_at !== source.generated_at) fail('source/report/coverage/retry/review time differs.');
if (!exact(review.requested_scope, source.requested_scope) || !exact(report.requested_scope, source.requested_scope) || !exact(coverage.requested_scope, source.requested_scope) || !exact(retries.requested_scope, source.requested_scope)) fail('incremental requested scope differs.');
if (review.review?.status !== 'approved' || review.review?.promotion_target !== 'canonical-timetable-v0') fail('review decision is not approved for canonical promotion.');
if ((source.blockers ?? []).length !== 0 || report.blocked_meetings !== 0) fail('reviewed incremental batch contains blockers.');
if ((coverage.unresolved_dates ?? []).length !== 0 || (coverage.unresolved_meeting_ids ?? []).length !== 0 || (coverage.source_errors ?? []).length !== 0) fail('reviewed incremental coverage contains unresolved state.');
if ((retries.date_targets ?? []).length !== 0 || (retries.meeting_targets ?? []).length !== 0) fail('reviewed incremental batch still has retry targets.');
if (report.meetings_discovered !== 10 || report.complete_meeting_candidates !== 10) fail('reviewed incremental source batch must contain exactly 10 discovered and complete meetings.');

const sourceIds = sorted((source.meetings ?? []).map((meeting) => meeting.candidate_id));
const reviewIds = sorted(review.approved_candidate_ids ?? []);
if (!exact(sourceIds, reviewIds)) fail('incremental review approval set differs from source complete meeting set.');

if (approved.schema_version !== 'timetable-candidate-v1') fail('approved candidate schema differs.');
if (approved.adapter_id !== 'nar-incremental-reviewed-promotion-candidate-v1') fail('approved candidate adapter differs.');
if (approved.country_id !== 'japan' || approved.authority_id !== 'nar-local-government-racing' || approved.source_id !== canonicalSourceId) fail('approved candidate envelope identity differs.');
if (approved.review?.status !== 'approved' || approved.review?.reviewer !== review.review.reviewer || approved.review?.reviewed_at !== review.review.reviewed_at) fail('approved candidate review metadata differs.');
if ((approved.records ?? []).length !== 10) fail('approved candidate record count must be 10.');
const approvedMeetingIds = sorted((approved.records ?? []).map((record) => record.meeting_id));
if (!exact(approvedMeetingIds, reviewIds)) fail('approved candidate meeting IDs differ from review set.');

for (const record of approved.records ?? []) {
  if (record.capability_rank !== 'A+' || record.review_status !== 'approved' || record.confidence !== 'high') fail(`${record.meeting_id} approved status/rank differs.`);
  if (record.source?.source_id !== canonicalSourceId || record.source?.extraction_method !== 'adapter_candidate') fail(`${record.meeting_id} source identity differs.`);
  if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length < 2) fail(`${record.meeting_id} timetable rows are incomplete.`);
  record.timetable_rows?.forEach((row, index) => {
    if (row.label !== `Race ${index + 1}`) fail(`${record.meeting_id} row ${index + 1} label differs.`);
    for (const field of ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      if (row[field] === null || row[field] === '') fail(`${record.meeting_id} row ${index + 1} missing ${field}.`);
    }
  });
  if (record.first_race_time_local !== record.timetable_rows[0].post_time_local) fail(`${record.meeting_id} first race time differs.`);
  if (record.last_race_time_local !== record.timetable_rows.at(-1).post_time_local) fail(`${record.meeting_id} last race time differs.`);
}

if (requirePromoted) {
  const canonicalMeetings = mapBy(readJson(canonicalMeetingsPath).meetings, 'meeting_id');
  const canonicalDetails = mapBy(readJson(canonicalDetailsPath).details, 'meeting_id');
  const publicMeetings = mapBy(readJson(publicMeetingsPath).meetings, 'meeting_id');
  const publicDetails = mapBy(readJson(publicDetailsPath).details, 'meeting_id');

  for (const record of approved.records) {
    const meeting = canonicalMeetings.get(record.meeting_id);
    const detail = canonicalDetails.get(record.meeting_id);
    const publicMeeting = publicMeetings.get(record.meeting_id);
    const publicDetail = publicDetails.get(record.meeting_id);
    if (!meeting || !detail || !publicMeeting || !publicDetail) {
      fail(`${record.meeting_id} is missing from canonical or public projection.`);
      continue;
    }
    if (meeting.capability_rank !== 'A+' || detail.capability_rank !== 'A+') fail(`${record.meeting_id} canonical rank differs.`);
    if (meeting.source_trace?.source_id !== canonicalSourceId || detail.source_trace?.source_id !== canonicalSourceId) fail(`${record.meeting_id} canonical source differs.`);
    if (publicMeeting.effective_public_rank !== 'A+' || publicMeeting.max_public_rank !== 'A+') fail(`${record.meeting_id} public meeting rank differs.`);
    if (publicDetail.effective_public_rank !== 'A+' || publicDetail.max_public_rank !== 'A+') fail(`${record.meeting_id} public detail rank differs.`);
    for (const field of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
      if (publicDetail[field] !== true) fail(`${record.meeting_id} public detail ${field} must be true.`);
    }
    const expectedRows = record.timetable_rows.map(rowProjection);
    const canonicalRows = detail.timetable_rows.map(rowProjection);
    const publicRows = publicDetail.timetable_rows.map(rowProjection);
    if (!exact(canonicalRows, expectedRows)) fail(`${record.meeting_id} canonical rows differ from approved candidate.`);
    if (!exact(publicRows, expectedRows)) fail(`${record.meeting_id} public rows differ from approved candidate.`);
  }
}

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_REVIEWED_PROMOTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_INCREMENTAL_REVIEWED_PROMOTION: pass');
console.log(`REVIEWED_MEETINGS: ${reviewIds.length}`);
console.log(`PROMOTED_PROJECTION_CHECKED: ${requirePromoted}`);
console.log('UNRESOLVED_DATES: 0');
console.log('UNRESOLVED_MEETING_IDS: 0');
console.log('RETRY_TARGETS: 0');
