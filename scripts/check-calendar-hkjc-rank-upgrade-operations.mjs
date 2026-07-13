import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import { buildHkjcDetailReviewedImportPackage } from './timetable/hkjc-detail-reviewed-import-core.mjs';
import {
  approveHkjcCandidateV1,
  buildHkjcOperatorRetryQueueV1,
  buildHkjcReviewQueueV1,
  sha256JsonV1,
  validateHkjcOperatorRetryQueueV1,
  validateHkjcRetryResultV1,
} from './timetable/hkjc-rank-upgrade-operations-core.mjs';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const registry = loadCalendarAcquisitionRegistryV1(root);
const routePolicy = readJson('data/static/calendar-route-runner-policy-v1.json');
const fixtures = readJson('data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json');
const readiness = loadCalendarReadinessV1(root);
const authorityInventory = loadAuthoritySourceInventoryV1(root);
const input = structuredClone(fixtures.valid_inputs.find((entry) => entry.id === 'reviewed-public-safe-a-plus')?.input);
if (!input) throw new Error('reviewed A+ fixture missing');
input.generated_at = '2026-07-13T03:30:00Z';
input.source_evidence.checked_at = '2026-07-13T03:30:00Z';
input.review.reviewed_at = '2026-07-13T03:45:00Z';
const meetingInput = input.meetings[0];
const meetingId = meetingInput.meeting_id;
const inputText = `${JSON.stringify(input, null, 2)}\n`;
const inputSha = crypto.createHash('sha256').update(inputText).digest('hex');
const batchId = 'hkjc-rank-upgrade-operations-proof';
const campaignId = 'hkjc-rank-upgrade-operations';
const jobId = 'hkjc-rank-upgrade-operations-proof-job';
const generatedAt = '2026-07-13T04:00:00Z';
const pkg = buildHkjcDetailReviewedImportPackage({
  input,
  inputFileName: 'hkjc-reviewed-a-plus-fixture.json',
  inputSha256: inputSha,
  batchId,
  campaignId,
  jobId,
});
const candidate = pkg.normalized_artifacts?.candidate;
const manifest = pkg.normalized_artifacts?.manifest;
if (!candidate || !manifest) fail('reviewed package did not produce candidate and manifest');

const canonicalMeeting = {
  meeting_id: meetingId,
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  racecourse_id: meetingInput.racecourse_id,
  date: meetingInput.date,
  timezone: 'Asia/Hong_Kong',
  capability_rank: 'C',
  display_status: 'partial',
  first_race_time_local: null,
  last_race_time_local: null,
  source_trace: {
    source_id: 'hkjc-fixture-list',
    route_id: null,
    source_status: 'verified',
    official_source_url: input.source_evidence.official_source_url,
    source_label: 'Hong Kong Jockey Club',
    extraction_method: 'adapter',
    source_snapshot_path: null,
    normalized_from_path: 'data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json'
  },
  freshness: {
    last_checked_date: '2026-07-10',
    generated_at: '2026-07-10T16:00:00Z',
    stale_after_date: null,
    freshness_note: 'Fixture-only C state for rank-upgrade operations proof.'
  },
  notes: 'Fixture-only canonical C state for HKJC rank-upgrade proof.'
};
const canonicalMeetings = [canonicalMeeting];

let retryQueue = null;
try {
  retryQueue = buildHkjcOperatorRetryQueueV1({
    meetingIds: [meetingId],
    generatedAt,
    canonicalMeetings,
    registry,
    routePolicy,
  });
} catch (error) {
  fail(`Retry Queue build failed: ${error.message}`);
}
if (retryQueue) {
  const retryErrors = validateHkjcOperatorRetryQueueV1(retryQueue, { canonicalMeetings, registry, routePolicy });
  if (retryErrors.length) fail(`Retry Queue validation failed: ${retryErrors.join('; ')}`);
  const entry = retryQueue.entries[0];
  if (entry.meeting_id !== meetingId || entry.current_reviewed_rank !== 'C' || entry.collection_target_rank !== 'best_available') fail('Retry Queue rank gap differs');
  if (entry.primary_runner !== 'reviewed_import' || entry.fallback_runner !== null || entry.adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('Retry Queue operator route differs');
  if (entry.retry_scope.mode !== 'selected_meetings' || !exact(entry.retry_scope.meeting_ids, [meetingId])) fail('Retry Queue selected-meeting scope differs');
}

if (retryQueue && candidate && manifest) {
  const resultErrors = validateHkjcRetryResultV1({ retryQueue, candidate, manifest });
  if (resultErrors.length) fail(`retry result reconciliation failed: ${resultErrors.join('; ')}`);
}

let reviewQueue = null;
try {
  reviewQueue = buildHkjcReviewQueueV1({
    manifest,
    manifestRef: `data/generated/timetable/hkjc-detail-batches/${batchId}/collection-result-manifest.json`,
    generatedAt,
  });
} catch (error) {
  fail(`Review Queue build failed: ${error.message}`);
}
if (reviewQueue) {
  const entry = reviewQueue.entries[0];
  if (entry.review_state !== 'review_ready' || entry.promotion_state !== 'not_ready') fail('Review Queue state differs');
  if (entry.runner_used !== 'reviewed_import' || entry.system_id !== 'hong-kong-hkjc-system') fail('Review Queue route differs');
  if (entry.rank_counts['A+'] !== 1 || entry.coverage_claim !== 'source_window_complete') fail('Review Queue rank/coverage differs');
}

const approval = {
  schema_version: 'calendar-hkjc-detail-promotion-approval-v1',
  batch_id: batchId,
  decision: 'approved',
  reviewer: 'fixture-reviewer',
  reviewed_at: '2026-07-13T04:15:00Z',
  candidate_sha256: sha256JsonV1(candidate),
  manifest_sha256: sha256JsonV1(manifest),
};
let approvedCandidate = null;
try {
  approvedCandidate = approveHkjcCandidateV1({ candidate, manifest, approval });
} catch (error) {
  fail(`candidate approval failed: ${error.message}`);
}
if (approvedCandidate) {
  if (approvedCandidate.review.status !== 'approved' || approvedCandidate.review.promotion_target !== 'canonical-timetable-v0') fail('approved candidate envelope differs');
  if (!approvedCandidate.records.every((record) => record.review_status === 'approved' && record.source.extraction_method === 'reviewed_snapshot')) fail('approved candidate record state differs');
}

const readinessRecord = readiness.records.find((record) => record.authority_source_key === 'hong-kong/hkjc/hkjc-detail-reviewed-import');
if (!readinessRecord) fail('HKJC detail Readiness supplement missing');
else {
  if (readinessRecord.technical_rank !== 'A+' || readinessRecord.public_ceiling !== 'A') fail('HKJC detail Readiness rank/ceiling differs');
  if (readinessRecord.automation_mode !== 'manual_import' || readinessRecord.implementation_status !== 'manual_operation') fail('HKJC detail Readiness operating mode differs');
  if (!readinessRecord.confirmed_fields?.per_race_post_times) fail('HKJC detail Readiness does not confirm per-race post times');
}
const sourceRecord = authorityInventory.records.find((record) => record.country_id === 'hong-kong' && record.authority_id === 'hkjc' && record.official_source_id === 'hkjc-detail-reviewed-import');
if (!sourceRecord || sourceRecord.capability_rank !== 'A+') fail('HKJC detail Authority/Source record differs');

if (approvedCandidate) {
  try {
    const promotion = promoteApprovedCandidateV1({
      candidate: approvedCandidate,
      meetingsDataset: {
        schema_version: 'canonical-timetable-v0',
        generated_at: '2026-07-10T16:00:00Z',
        input_sources: [],
        meetings: canonicalMeetings,
      },
      detailsDataset: {
        schema_version: 'canonical-meeting-details-v0',
        generated_at: '2026-07-10T16:00:00Z',
        input_sources: [],
        details: [],
      },
      authorityInventory,
      readinessRegistry: readiness,
      inputPath: `data/candidates/hkjc-detail-${batchId}-approved.json`,
    });
    const promoted = promotion.meetingsDataset.meetings.find((meeting) => meeting.meeting_id === meetingId);
    const detail = promotion.detailsDataset.details.find((row) => row.meeting_id === meetingId);
    if (promoted?.capability_rank !== 'A+' || promoted?.first_race_time_local !== '18:30' || promoted?.last_race_time_local !== '19:00') fail('promotion proposal meeting differs');
    if (detail?.timetable_rows?.length !== 2) fail('promotion proposal detail rows differ');
    if (promotion.summary.promoted_meeting_ids.length !== 1 || promotion.summary.promoted_detail_ids.length !== 1) fail('promotion summary differs');
  } catch (error) {
    fail(`promotion proposal failed: ${error.message}`);
  }
}

for (const [id, mutate, expectedFragment] of [
  ['stale-candidate-hash', (value) => { value.candidate_sha256 = '0'.repeat(64); }, 'candidate SHA-256'],
  ['stale-manifest-hash', (value) => { value.manifest_sha256 = '0'.repeat(64); }, 'manifest SHA-256'],
]) {
  const badApproval = structuredClone(approval);
  mutate(badApproval);
  let rejected = false;
  try { approveHkjcCandidateV1({ candidate, manifest, approval: badApproval }); }
  catch (error) { rejected = error.message.includes(expectedFragment); }
  if (!rejected) fail(`${id} was not rejected`);
}

const alreadyComplete = [{ ...canonicalMeeting, capability_rank: 'A+' }];
let completeRejected = false;
try {
  buildHkjcOperatorRetryQueueV1({ meetingIds: [meetingId], generatedAt, canonicalMeetings: alreadyComplete, registry, routePolicy });
} catch (error) {
  completeRejected = error.message.includes('already at technical capability A+');
}
if (!completeRejected) fail('already-A+ retry target was not rejected');

const wrongCandidate = structuredClone(candidate);
wrongCandidate.records[0].meeting_id = 'hkjc-wrong-meeting-2026-07-08';
const wrongResultErrors = validateHkjcRetryResultV1({ retryQueue, candidate: wrongCandidate, manifest });
if (!wrongResultErrors.some((error) => error.includes('exactly match'))) fail('retry/candidate meeting mismatch was not rejected');

if (errors.length) {
  console.error(`CALENDAR_HKJC_RANK_UPGRADE_OPERATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_RANK_UPGRADE_OPERATIONS: pass');
console.log('IMPLEMENTATION_UNIT: HKJC-DETAIL-RECOVERY-02');
console.log('RETRY_ROUTE: selected_meetings / reviewed_import / operator_only');
console.log('REVIEW_QUEUE: review_ready / promotion_not_ready');
console.log('APPROVAL_BINDING: candidate_sha256 + manifest_sha256');
console.log('PROMOTION_PROPOSAL: canonical C -> technical A+ / public ceiling A');
console.log('REPOSITORY_WRITE: false');
console.log('UNATTENDED_PUBLICATION: false');
