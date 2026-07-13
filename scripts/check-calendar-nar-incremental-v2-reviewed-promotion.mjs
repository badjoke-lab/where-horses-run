import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const requirePromoted = process.argv.includes('--require-promoted');
const sourcePath = 'data/candidates/nar-incremental-batches/july-2026-08-through-31-run-001/batch.json';
const reportPath = 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json';
const coveragePath = 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/coverage-observation.json';
const retryPath = 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/retry-targets.json';
const reviewPath = 'data/reviews/nar-incremental-v2-july-remainder-review.json';
const detailApprovedPath = 'data/candidates/nar-incremental-v2-july-remainder-a-plus-approved.json';
const scheduleApprovedPath = 'data/candidates/nar-incremental-v2-july-remainder-c-approved.json';
const currentWindowApprovedPath = 'data/candidates/nar-current-window-a-plus-approved.json';
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicMeetingsPath = 'data/generated/timetable/public/meeting-list.json';
const publicDetailsPath = 'data/generated/timetable/public/meeting-details.json';
const detailSourceId = 'nar-race-list-deba-table';
const scheduleSourceId = 'nar-monthly-schedule-grid';
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
function oneBy(records, predicate, label) {
  const matches = records.filter(predicate);
  if (matches.length !== 1) {
    fail(`${label} must resolve exactly once; found ${matches.length}.`);
    return null;
  }
  return matches[0];
}

const source = readJson(sourcePath);
const report = readJson(reportPath);
const coverage = readJson(coveragePath);
const retries = readJson(retryPath);
const review = readJson(reviewPath);
const detailApproved = readJson(detailApprovedPath);
const scheduleApproved = readJson(scheduleApprovedPath);
const currentWindowApproved = fs.existsSync(path.join(root, currentWindowApprovedPath)) ? readJson(currentWindowApprovedPath) : null;
const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = loadCalendarReadinessV1(root);
const sourceBlobSha = execFileSync('git', ['hash-object', sourcePath], { cwd: root, encoding: 'utf8' }).trim();

if (source.schema_version !== 'nar-incremental-batch-v2') fail('source batch schema differs.');
if (report.schema_version !== 'nar-incremental-collection-report-v2') fail('collection report schema differs.');
if (coverage.schema_version !== 'calendar-coverage-observation-v1') fail('Coverage Observation schema differs.');
if (retries.schema_version !== 'nar-incremental-retry-targets-v2') fail('retry artifact schema differs.');
if (review.schema_version !== 'nar-incremental-v2-review-decision-v1') fail('review decision schema differs.');
if (review.source_batch_blob_sha !== sourceBlobSha) fail(`review source blob SHA differs: expected ${review.source_batch_blob_sha} actual ${sourceBlobSha}`);
if (review.source_batch_path !== sourcePath) fail('review source path differs.');
if (review.source_generated_at !== source.generated_at || report.generated_at !== source.generated_at || coverage.checked_at !== source.generated_at || retries.generated_at !== source.generated_at) fail('source/report/coverage/retry/review timestamp differs.');
if (review.batch_id !== source.batch_id || report.batch_id !== source.batch_id || coverage.run_id !== source.batch_id || retries.batch_id !== source.batch_id) fail('batch identity differs.');
if (!exact(review.requested_scope, source.requested_scope) || !exact(report.requested_scope, source.requested_scope) || !exact(coverage.requested_scope, source.requested_scope) || !exact(retries.requested_scope, source.requested_scope)) fail('requested scope differs across batch artifacts.');
if (review.review?.status !== 'approved' || review.review?.promotion_target !== 'canonical-timetable-v0') fail('review decision is not approved for canonical promotion.');
if (review.approval_scope !== 'entire_pinned_batch') fail('review does not approve the entire pinned batch.');
if (coverage.coverage_claim !== 'source_window_complete') fail('Schedule Layer coverage must be source_window_complete.');
if ((coverage.source_errors ?? []).length !== 0 || report.schedule_errors !== 0 || (source.schedule_errors ?? []).length !== 0) fail('reviewed batch contains schedule/source errors.');
if (report.scheduled_meetings !== 82 || report.complete_detail_candidates !== 11 || report.schedule_only_candidates !== 71 || report.detail_blockers !== 71) fail('reviewed batch counts must be 82 total / 11 A+ / 71 C / 71 blockers.');
if (review.approved_rank_counts?.C !== 71 || review.approved_rank_counts?.['A+'] !== 11) fail('review rank counts differ.');

const scheduledIds = sorted((source.scheduled_meetings ?? []).map((record) => record.meeting_id));
const detailSourceIds = sorted((source.detail_candidates ?? []).map((record) => record.candidate_id));
const scheduleSourceIds = sorted((source.schedule_candidates ?? []).map((record) => record.meeting_id));
const detailApprovedIds = sorted((detailApproved.records ?? []).map((record) => record.meeting_id));
const scheduleApprovedIds = sorted((scheduleApproved.records ?? []).map((record) => record.meeting_id));
if (scheduledIds.length !== 82 || new Set(scheduledIds).size !== 82) fail('scheduled meeting identity set must contain 82 unique IDs.');
if (detailSourceIds.length !== 11 || new Set(detailSourceIds).size !== 11) fail('detail source set must contain 11 unique IDs.');
if (scheduleSourceIds.length !== 71 || new Set(scheduleSourceIds).size !== 71) fail('schedule source set must contain 71 unique IDs.');
if (detailSourceIds.some((id) => scheduleSourceIds.includes(id))) fail('detail and schedule source sets overlap.');
if (!exact(scheduledIds, sorted([...detailSourceIds, ...scheduleSourceIds]))) fail('detail and schedule source union differs from the 82 scheduled meetings.');
if (!exact(scheduleSourceIds, sorted(coverage.unresolved_meeting_ids ?? []))) fail('C schedule source set differs from Coverage Observation unresolved meeting IDs.');
if (!exact(scheduleSourceIds, sorted(retries.meeting_targets ?? []))) fail('C schedule source set differs from retry meeting targets.');
if (!exact(detailApprovedIds, detailSourceIds)) fail('A+ approved IDs differ from source detail candidate IDs.');
if (!exact(scheduleApprovedIds, scheduleSourceIds)) fail('C approved IDs differ from source schedule candidate IDs.');

for (const [approved, expectedAdapter, expectedSource, expectedCount] of [
  [detailApproved, 'nar-incremental-v2-reviewed-detail-promotion-v1', detailSourceId, 11],
  [scheduleApproved, 'nar-incremental-v2-reviewed-schedule-promotion-v1', scheduleSourceId, 71],
]) {
  if (approved.schema_version !== 'timetable-candidate-v1') fail(`${expectedSource} approved schema differs.`);
  if (approved.adapter_id !== expectedAdapter) fail(`${expectedSource} adapter differs.`);
  if (approved.country_id !== 'japan' || approved.authority_id !== 'nar-local-government-racing' || approved.source_id !== expectedSource) fail(`${expectedSource} approved envelope identity differs.`);
  if ((approved.records ?? []).length !== expectedCount) fail(`${expectedSource} approved record count differs.`);
  if (approved.review?.status !== 'approved' || approved.review?.reviewer !== review.review.reviewer || approved.review?.reviewed_at !== review.review.reviewed_at || approved.review?.promotion_target !== review.review.promotion_target) fail(`${expectedSource} review metadata differs.`);
}

for (const record of detailApproved.records ?? []) {
  if (record.capability_rank !== 'A+' || record.review_status !== 'approved' || record.confidence !== 'high') fail(`${record.meeting_id} A+ status/rank differs.`);
  if (record.source?.source_id !== detailSourceId || record.source?.extraction_method !== 'adapter_candidate') fail(`${record.meeting_id} A+ source identity differs.`);
  if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length < 2) fail(`${record.meeting_id} A+ rows are incomplete.`);
  record.timetable_rows?.forEach((row, index) => {
    if (row.label !== `Race ${index + 1}`) fail(`${record.meeting_id} row ${index + 1} label differs.`);
    for (const field of ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      if (row[field] === null || row[field] === '') fail(`${record.meeting_id} row ${index + 1} missing ${field}.`);
    }
  });
  if (record.first_race_time_local !== record.timetable_rows?.[0]?.post_time_local) fail(`${record.meeting_id} first race time differs.`);
  if (record.last_race_time_local !== record.timetable_rows?.at(-1)?.post_time_local) fail(`${record.meeting_id} last race time differs.`);
}

for (const record of scheduleApproved.records ?? []) {
  if (record.capability_rank !== 'C' || record.review_status !== 'approved' || record.confidence !== 'high') fail(`${record.meeting_id} historical C status/rank differs.`);
  if (record.first_race_time_local !== null || record.last_race_time_local !== null || (record.timetable_rows ?? []).length !== 0) fail(`${record.meeting_id} historical C record contains timetable detail.`);
  if (record.source?.source_id !== scheduleSourceId || record.source?.extraction_method !== 'adapter_candidate') fail(`${record.meeting_id} historical C source identity differs.`);
}

for (const sourceId of [detailSourceId, scheduleSourceId]) {
  const sourceRecord = oneBy(authorityInventory.records, (record) => record.country_id === 'japan' && record.authority_id === 'nar-local-government-racing' && record.official_source_id === sourceId, `${sourceId} authority/source record`);
  const readinessRecord = oneBy(readinessRegistry.records, (record) => record.authority_source_key === `japan/nar-local-government-racing/${sourceId}`, `${sourceId} readiness record`);
  if (sourceRecord?.adapter_candidate_status === 'blocked') fail(`${sourceId} source is blocked.`);
  if (!['ready', 'prototype_ready', 'manual_ready'].includes(readinessRecord?.readiness)) fail(`${sourceId} readiness does not permit promotion.`);
  if (['blocked', 'link_only', 'not_applicable'].includes(readinessRecord?.automation_mode)) fail(`${sourceId} automation mode does not permit promotion.`);
}

if (requirePromoted) {
  const canonicalMeetings = mapBy(readJson(canonicalMeetingsPath).meetings, 'meeting_id');
  const canonicalDetails = mapBy(readJson(canonicalDetailsPath).details, 'meeting_id');
  const publicMeetings = mapBy(readJson(publicMeetingsPath).meetings, 'meeting_id');
  const publicDetails = mapBy(readJson(publicDetailsPath).details, 'meeting_id');

  for (const record of detailApproved.records ?? []) {
    const meeting = canonicalMeetings.get(record.meeting_id);
    const detail = canonicalDetails.get(record.meeting_id);
    const publicMeeting = publicMeetings.get(record.meeting_id);
    const publicDetail = publicDetails.get(record.meeting_id);
    if (!meeting || !detail || !publicMeeting || !publicDetail) {
      fail(`${record.meeting_id} historical A+ record is missing from canonical or public projection.`);
      continue;
    }
    if (meeting.capability_rank !== 'A+' || detail.capability_rank !== 'A+') fail(`${record.meeting_id} historical canonical A+ rank differs.`);
    if (meeting.source_trace?.source_id !== detailSourceId || detail.source_trace?.source_id !== detailSourceId) fail(`${record.meeting_id} historical canonical A+ source differs.`);
    if (publicMeeting.effective_public_rank !== 'A+' || publicDetail.effective_public_rank !== 'A+') fail(`${record.meeting_id} historical public A+ rank differs.`);
    const expectedRows = record.timetable_rows.map(rowProjection);
    if (!exact(detail.timetable_rows.map(rowProjection), expectedRows)) fail(`${record.meeting_id} historical canonical A+ rows differ.`);
    if (!exact(publicDetail.timetable_rows.map(rowProjection), expectedRows)) fail(`${record.meeting_id} historical public A+ rows differ.`);
  }

  const subsequentById = new Map((currentWindowApproved?.records ?? []).map((record) => [record.meeting_id, record]));
  const subsequentIds = sorted(subsequentById.keys());
  if (currentWindowApproved?.review?.status !== 'approved' || currentWindowApproved?.review?.promotion_target !== 'canonical-timetable-v0') fail('current-window A+ approval state differs.');
  if (subsequentIds.length !== 15 || !subsequentIds.every((id) => scheduleApprovedIds.includes(id))) fail('current-window A+ set must be exactly 15 meetings from the historical C set.');

  let currentAPlus = 0;
  let currentC = 0;
  for (const record of scheduleApproved.records ?? []) {
    const meeting = canonicalMeetings.get(record.meeting_id);
    const publicMeeting = publicMeetings.get(record.meeting_id);
    if (!meeting || !publicMeeting) {
      fail(`${record.meeting_id} historical C record is missing from current canonical or public projection.`);
      continue;
    }
    const subsequent = subsequentById.get(record.meeting_id);
    if (subsequent) {
      currentAPlus += 1;
      const detail = canonicalDetails.get(record.meeting_id);
      const publicDetail = publicDetails.get(record.meeting_id);
      if (!detail || !publicDetail) {
        fail(`${record.meeting_id} subsequently promoted A+ detail is missing.`);
        continue;
      }
      if (meeting.capability_rank !== 'A+' || detail.capability_rank !== 'A+') fail(`${record.meeting_id} subsequent canonical A+ rank differs.`);
      if (meeting.source_trace?.source_id !== detailSourceId || detail.source_trace?.source_id !== detailSourceId) fail(`${record.meeting_id} subsequent canonical A+ source differs.`);
      if (publicMeeting.effective_public_rank !== 'A+' || publicDetail.effective_public_rank !== 'A+') fail(`${record.meeting_id} subsequent public A+ rank differs.`);
      const expectedRows = subsequent.timetable_rows.map(rowProjection);
      if (!exact(detail.timetable_rows.map(rowProjection), expectedRows)) fail(`${record.meeting_id} subsequent canonical A+ rows differ.`);
      if (!exact(publicDetail.timetable_rows.map(rowProjection), expectedRows)) fail(`${record.meeting_id} subsequent public A+ rows differ.`);
    } else {
      currentC += 1;
      if (meeting.capability_rank !== 'C') fail(`${record.meeting_id} retained canonical C rank differs.`);
      if (meeting.source_trace?.source_id !== scheduleSourceId) fail(`${record.meeting_id} retained canonical C source differs.`);
      if (canonicalDetails.has(record.meeting_id)) fail(`${record.meeting_id} retained C record unexpectedly has canonical detail.`);
      if (publicDetails.has(record.meeting_id)) fail(`${record.meeting_id} retained C record unexpectedly has public detail.`);
      if (publicMeeting.effective_public_rank !== 'C') fail(`${record.meeting_id} retained public C rank differs.`);
    }
  }
  if (currentAPlus !== 15 || currentC !== 56) fail(`current historical-C split differs: A+=${currentAPlus} C=${currentC}`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_V2_REVIEWED_PROMOTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_INCREMENTAL_V2_REVIEWED_PROMOTION: pass');
console.log(`HISTORICAL_REVIEWED_MEETINGS: ${scheduledIds.length}`);
console.log(`HISTORICAL_APPROVED_A_PLUS: ${detailApprovedIds.length}`);
console.log(`HISTORICAL_APPROVED_C: ${scheduleApprovedIds.length}`);
console.log(`PROMOTED_PROJECTION_CHECKED: ${requirePromoted}`);
console.log(`HISTORICAL_RETRY_MEETING_TARGETS: ${(retries.meeting_targets ?? []).length}`);
if (requirePromoted) {
  console.log('CURRENT_FROM_HISTORICAL_C: A+=15 C=56');
}
