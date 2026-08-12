import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadKraRankCCandidate } from './timetable/kra-calendar-plan-adapter.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifestPath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-review-v1.json';
const identityReviewPath = 'data/static/kra-2026-reviewed-public-timetable-identities-v1.json';
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publishedNote = 'Human-approved KRA Rank C meeting identity. Publication remains limited to meeting date, racecourse identity, and reviewed official source trace.';

const manifest = readJson(manifestPath);
const identityReview = readJson(identityReviewPath);
const pendingCandidate = loadKraRankCCandidate();
const inventory = loadAuthoritySourceInventoryV1(process.cwd());
const readinessRegistry = loadCalendarReadinessV1(process.cwd());
const canonicalMeetings = readJson(canonicalMeetingsPath);
const canonicalDetails = readJson(canonicalDetailsPath);

assert.equal(manifest.schema_version, 'kra-rank-c-promotion-review-v1');
assert.equal(manifest.work_id, 'WHR-CAL-SOUTH-KOREA-KRA');
assert.equal(manifest.implementation_unit, 'KRA-RANK-C-PROMOTION-REVIEW-01');
assert.equal(manifest.meeting_count, 32);
assert.deepEqual(manifest.venue_counts, {
  'seoul-racecourse': 11,
  'busan-gyeongnam-racecourse': 10,
  'jeju-racecourse': 11
});
assert.equal(manifest.review.status, 'approved');
assert.ok(manifest.review.reviewer);
assert.ok(!Number.isNaN(Date.parse(manifest.review.reviewed_at)));
assert.equal(manifest.review.promotion_target, 'canonical-timetable-v0');
assert.equal(manifest.publication_boundary.automatic_approval, false);
assert.equal(manifest.publication_boundary.automatic_merge, false);
assert.equal(manifest.publication_boundary.deployment_performed, false);

assert.equal(pendingCandidate.records.length, 32);
assert.equal(pendingCandidate.source_id, 'kra-2026-racing-operation-overview');
assert.equal(pendingCandidate.review.status, 'pending');
assert.ok(pendingCandidate.records.every((record) => record.capability_rank === 'C'));
assert.ok(pendingCandidate.records.every((record) => record.racing_system_id === 'kra-national-racing-system'));
assert.ok(pendingCandidate.records.every((record) => record.source.extraction_method === 'reviewed_snapshot'));
assert.ok(pendingCandidate.records.every((record) => record.first_race_time_local === null && record.last_race_time_local === null && record.timetable_rows.length === 0));

const compactCandidate = pendingCandidate.records.map((record) => ({
  meeting_id: record.meeting_id,
  racecourse_id: record.racecourse_id,
  date: record.date,
  capability_rank: record.capability_rank
}));
assert.deepEqual(compactCandidate, manifest.records, 'approval manifest must exactly match deterministic KRA candidate output');

const approvedCandidate = {
  ...pendingCandidate,
  records: pendingCandidate.records.map((record) => ({ ...record, review_status: 'approved' })),
  review: {
    status: 'approved',
    reviewed_at: manifest.review.reviewed_at,
    reviewer: manifest.review.reviewer,
    promotion_target: manifest.review.promotion_target
  }
};

const targetIds = new Set(manifest.records.map((record) => record.meeting_id));
const currentTargets = canonicalMeetings.meetings.filter((record) => targetIds.has(record.meeting_id));
const currentNonTargets = canonicalMeetings.meetings.filter((record) => !targetIds.has(record.meeting_id));
const currentNonTargetDetails = canonicalDetails.details.filter((record) => !targetIds.has(record.meeting_id));

const promotion = promoteApprovedCandidateV1({
  candidate: approvedCandidate,
  meetingsDataset: canonicalMeetings,
  detailsDataset: canonicalDetails,
  authorityInventory: inventory,
  readinessRegistry,
  inputPath: 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-approved.json'
});
assert.equal(promotion.summary.promoted_meeting_ids.length, 32);
assert.equal(promotion.summary.promoted_detail_ids.length, 0);
assert.equal(promotion.summary.removed_detail_ids.length, 0);
assert.equal(promotion.summary.downgraded_meeting_ids.length, 0);
assert.equal(promotion.summary.public_projection_written, false);

assert.ok(currentTargets.length === 0 || currentTargets.length === 32, 'KRA canonical publication must be all-or-none');
for (const record of currentTargets) {
  assert.equal(record.country_id, 'south-korea');
  assert.equal(record.authority_id, 'korea-racing-authority');
  assert.equal(record.capability_rank, 'C');
  assert.equal(record.first_race_time_local, null);
  assert.equal(record.last_race_time_local, null);
  assert.equal(record.notes, publishedNote, 'published KRA approval note must remain exact');
}
assert.equal(canonicalDetails.details.filter((record) => targetIds.has(record.meeting_id)).length, 0, 'Rank C KRA meetings must never create canonical race-detail rows');

const promotedTargets = promotion.meetingsDataset.meetings.filter((record) => targetIds.has(record.meeting_id));
const promotedNonTargets = promotion.meetingsDataset.meetings.filter((record) => !targetIds.has(record.meeting_id));
const promotedNonTargetDetails = promotion.detailsDataset.details.filter((record) => !targetIds.has(record.meeting_id));
assert.equal(promotedTargets.length, 32);
assert.ok(promotedTargets.every((record) => record.capability_rank === 'C'));
assert.ok(promotedTargets.every((record) => record.first_race_time_local === null && record.last_race_time_local === null));
assert.deepEqual(promotedNonTargets, currentNonTargets, 'KRA promotion must preserve separately reviewed non-KRA meetings exactly');
assert.deepEqual(promotedNonTargetDetails, currentNonTargetDetails, 'KRA promotion must preserve separately reviewed non-KRA detail rows exactly');
if (currentTargets.length === 32) {
  const withoutPublicationNote = (record) => {
    const { notes, ...rest } = record;
    return rest;
  };
  assert.deepEqual(
    promotedTargets.map(withoutPublicationNote),
    currentTargets.map(withoutPublicationNote),
    'already-published KRA target fields other than the human-approved publication note must remain deterministic'
  );
}

assert.equal(identityReview.review.status, 'approved');
assert.equal(identityReview.review.reviewer, manifest.review.reviewer);
assert.equal(identityReview.review.reviewed_at, manifest.review.reviewed_at);
assert.equal(identityReview.publication_boundary.automatic_approval, false);
assert.equal(identityReview.publication_boundary.automatic_merge, false);
assert.equal(identityReview.publication_boundary.deployment_performed, false);

console.log('KRA_RANK_C_PROMOTION_GATE: pass');
console.log('CANDIDATE_MEETINGS: 32');
console.log('APPROVAL_BINDING: pass');
console.log('PROMOTION_CORE_DRY_RUN: pass');
console.log('NON_KRA_PRESERVATION: pass');
console.log('PUBLISHED_KRA_APPROVAL_NOTE: preserved');
console.log(`CANONICAL_STATE: ${currentTargets.length === 32 ? 'published_rank_c' : 'approved_not_written'}`);
console.log('PUBLIC_RANK_CEILING: C');