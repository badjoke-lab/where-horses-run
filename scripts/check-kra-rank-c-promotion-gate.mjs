import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadKraRankCCandidate } from './timetable/kra-calendar-plan-adapter.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifestPath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-review-v1.json';
const identityReviewPath = 'data/static/kra-2026-reviewed-public-timetable-identities-v1.json';
const publicIdentityPath = 'data/static/racecourses-public-timetable-identities-v1.json';
const canonicalRacecoursesPath = 'data/static/racecourses.json';

const manifest = readJson(manifestPath);
const identityReview = readJson(identityReviewPath);
const publicIdentities = readJson(publicIdentityPath);
const canonicalRacecourses = readJson(canonicalRacecoursesPath);
const candidate = loadKraRankCCandidate();
const inventory = loadAuthoritySourceInventoryV1(process.cwd());
const readinessRegistry = loadCalendarReadinessV1(process.cwd());

assert.equal(manifest.schema_version, 'kra-rank-c-promotion-review-v1');
assert.equal(manifest.work_id, 'WHR-CAL-SOUTH-KOREA-KRA');
assert.equal(manifest.implementation_unit, 'KRA-RANK-C-PROMOTION-REVIEW-01');
assert.equal(manifest.meeting_count, 32);
assert.deepEqual(manifest.venue_counts, {
  'seoul-racecourse': 11,
  'busan-gyeongnam-racecourse': 10,
  'jeju-racecourse': 11
});
assert.equal(manifest.review.status, 'pending_human_review');
assert.equal(manifest.review.reviewed_at, null);
assert.equal(manifest.review.reviewer, null);
assert.ok(Object.values(manifest.publication_boundary).every((value) => value === false));

assert.equal(candidate.records.length, 32);
assert.equal(candidate.source_id, 'kra-2026-racing-operation-overview');
assert.equal(candidate.review.status, 'pending');
assert.equal(candidate.review.reviewed_at, null);
assert.equal(candidate.review.reviewer, null);
assert.ok(candidate.records.every((record) => record.capability_rank === 'C'));
assert.ok(candidate.records.every((record) => record.racing_system_id === 'kra-national-racing-system'));
assert.ok(candidate.records.every((record) => record.source.extraction_method === 'reviewed_snapshot'));
assert.ok(candidate.records.every((record) => record.first_race_time_local === null && record.last_race_time_local === null && record.timetable_rows.length === 0));

const compactCandidate = candidate.records.map((record) => ({
  meeting_id: record.meeting_id,
  racecourse_id: record.racecourse_id,
  date: record.date,
  capability_rank: record.capability_rank
}));
assert.deepEqual(compactCandidate, manifest.records, 'review manifest must exactly match deterministic KRA candidate output');

const sourceMatches = inventory.records.filter((record) =>
  record.country_id === 'south-korea' &&
  record.authority_id === 'korea-racing-authority' &&
  record.official_source_id === candidate.source_id
);
assert.equal(sourceMatches.length, 1, 'KRA reviewed calendar source must resolve exactly once');
assert.equal(sourceMatches[0].capability_rank, 'C');
assert.equal(sourceMatches[0].source_status, 'verified');

const readinessMatches = readinessRegistry.records.filter((record) =>
  record.authority_source_key === 'south-korea/korea-racing-authority/kra-2026-racing-operation-overview'
);
assert.equal(readinessMatches.length, 1, 'KRA reviewed calendar readiness must resolve exactly once');
const readiness = readinessMatches[0];
assert.equal(readiness.system_id, 'kra-national-racing-system');
assert.equal(readiness.technical_rank, 'C');
assert.equal(readiness.public_ceiling, 'C');
assert.equal(readiness.confirmed_fields.meeting_date, true);
assert.equal(readiness.confirmed_fields.racecourse, true);
for (const key of ['first_race_time', 'last_race_time', 'per_race_post_times', 'race_name', 'distance', 'surface', 'course']) {
  assert.equal(readiness.confirmed_fields[key], false, `KRA Rank C readiness unexpectedly confirms ${key}`);
}
assert.deepEqual(new Set(readiness.racecourse_ids), new Set(['seoul-racecourse', 'busan-gyeongnam-racecourse', 'jeju-racecourse']));

assert.equal(identityReview.review.status, 'pending_human_review');
assert.equal(identityReview.review.reviewed_at, null);
assert.equal(identityReview.review.reviewer, null);
assert.ok(Object.values(identityReview.publication_boundary).every((value) => value === false));
assert.equal(canonicalRacecourses.filter((record) => record.id === 'seoul-racecourse').length, 1);
for (const id of ['busan-gyeongnam-racecourse', 'jeju-racecourse']) {
  assert.equal(publicIdentities.filter((record) => record.id === id).length, 0, `${id} must remain unpublished before human identity review`);
}

let blocked = false;
try {
  promoteApprovedCandidateV1({
    candidate,
    meetingsDataset: readJson('data/generated/timetable/canonical/meetings.json'),
    detailsDataset: readJson('data/generated/timetable/canonical/meeting-details.json'),
    authorityInventory: inventory,
    readinessRegistry,
    inputPath: manifestPath
  });
} catch (error) {
  blocked = true;
  assert.match(String(error?.message ?? error), /candidate envelope is not approved/);
}
assert.equal(blocked, true, 'shared promotion core must reject the pending KRA candidate');

console.log('KRA_RANK_C_PROMOTION_GATE: pass');
console.log('CANDIDATE_MEETINGS: 32');
console.log('SOURCE_READINESS_ALIGNMENT: pass');
console.log('IDENTITY_REVIEW: pending_human_review');
console.log('PROMOTION_CORE_BLOCK: enforced');
console.log('PUBLICATION_EFFECT: none');
