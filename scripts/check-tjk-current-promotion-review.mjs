import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTjkCurrentBoundedCandidate } from './timetable/tjk-current-bounded-adapter.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const reviewPath = 'data/candidates/tjk-current-2026-08-11-promotion-review-v1.json';
const registryPath = 'data/static/racecourses-public-timetable-identities-v1.json';
const review = readJson(reviewPath);
const registry = readJson(registryPath);
const candidate = loadTjkCurrentBoundedCandidate();

assert.equal(review.schema_version, 'tjk-current-promotion-review-v1');
assert.equal(review.work_id, 'WHR-CAL-TURKEY-TJK');
assert.equal(review.implementation_unit, 'TJK-CURRENT-PROMOTION-REVIEW-01');
assert.equal(review.recorded_at, '2026-08-12');
assert.equal(review.candidate_artifact, 'data/candidates/tjk-current-bounded-2026-08-11-v1.json');
assert.equal(review.source_revalidation, 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-12.json');
assert.equal(review.meeting_count, 2);
assert.equal(review.race_count, 18);
assert.equal(review.technical_capability_rank, 'A+');
assert.equal(review.candidate_rank, 'A');
assert.equal(review.public_ceiling, 'A');
assert.equal(review.review.promotion_target, 'separate-racecourse-identity-and-timetable-promotion-unit');
assert.equal(review.publication_boundary.automatic_approval, false);
assert.equal(review.publication_boundary.automatic_merge, false);
assert.equal(review.publication_boundary.deployment_performed, false);

const candidateBinding = candidate.records.map((record) => ({
  meeting_id: record.meeting_id,
  source_venue_id: record.source_venue_id,
  source_venue_label: record.source_venue_label,
  date: record.date,
  candidate_rank: record.candidate_rank,
  race_count: record.timetable_rows.length,
  first_race_time_local: record.first_race_time_local,
  last_race_time_local: record.last_race_time_local,
  race_schedule: record.timetable_rows,
}));
const reviewBinding = review.records.map((record) => ({
  meeting_id: record.meeting_id,
  source_venue_id: record.source_venue_id,
  source_venue_label: record.source_venue_label,
  date: record.date,
  candidate_rank: record.candidate_rank,
  race_count: record.race_count,
  first_race_time_local: record.first_race_time_local,
  last_race_time_local: record.last_race_time_local,
  race_schedule: record.race_schedule,
}));
assert.deepEqual(reviewBinding, candidateBinding, 'TJK review must exactly bind the deterministic current candidate');

assert.equal(review.identity_review.registry, registryPath);
assert.equal(review.identity_review.existing_public_identity_found, false);
assert.equal(review.identity_review.registration_required_for_promotion, true);

const expectedApprovedIdentities = [
  { source_venue_id: '5', source_venue_label: 'Ankara', public_racecourse_id: 'ankara-racecourse', status: 'approved_for_identity_only_registration' },
  { source_venue_id: '9', source_venue_label: 'Kocaeli', public_racecourse_id: 'kocaeli-racecourse', status: 'approved_for_identity_only_registration' },
];
const targetIds = new Set(['ankara-racecourse', 'kocaeli-racecourse']);
const registeredTargets = registry.filter((entry) => targetIds.has(entry.id));

if (review.review.status === 'pending_human_review') {
  assert.equal(review.review.reviewed_at, null);
  assert.equal(review.review.reviewer, null);
  assert.equal(review.review.approval_effect, 'none_until_explicit_human_approval');
  assert.deepEqual(review.identity_review.records, [
    { source_venue_id: '5', source_venue_label: 'Ankara', public_racecourse_id: null, status: 'requires_separate_identity_review' },
    { source_venue_id: '9', source_venue_label: 'Kocaeli', public_racecourse_id: null, status: 'requires_separate_identity_review' },
  ]);
  for (const key of ['canonical_written', 'public_projection_written', 'public_racecourse_identity_written']) {
    assert.equal(review.publication_boundary[key], false, `pending TJK review boundary differs: ${key}`);
  }
  assert.equal(registeredTargets.length, 0, 'pending TJK review must not have registered target identities');
} else {
  assert.equal(review.review.status, 'approved');
  assert.equal(review.review.reviewer, 'badjoke-lab');
  assert.equal(review.review.reviewed_at, '2026-08-12T06:29:00Z');
  assert.equal(review.review.approval_effect, 'authorizes_separate_reviewed_identity_and_timetable_promotion_unit');
  assert.deepEqual(review.identity_review.records, expectedApprovedIdentities);
  assert.deepEqual(review.records.map(({ public_racecourse_id, canonical_meeting_id }) => ({ public_racecourse_id, canonical_meeting_id })), [
    { public_racecourse_id: 'ankara-racecourse', canonical_meeting_id: 'tjk-ankara-racecourse-2026-08-11' },
    { public_racecourse_id: 'kocaeli-racecourse', canonical_meeting_id: 'tjk-kocaeli-racecourse-2026-08-11' },
  ]);
  const writeFlags = ['canonical_written', 'public_projection_written', 'public_racecourse_identity_written'].map((key) => review.publication_boundary[key]);
  assert.ok(writeFlags.every((value) => value === false) || writeFlags.every((value) => value === true), 'approved TJK publication flags must be all false or all true');
  assert.equal(registeredTargets.length, writeFlags[0] ? 2 : 0, 'TJK identity registry state must match publication boundary');
}

for (const record of review.records) {
  assert.equal(record.candidate_rank, 'A');
  assert.equal(record.race_count, 9);
  assert.equal(record.race_schedule.length, 9);
  record.race_schedule.forEach((race, index) => {
    assert.deepEqual(Object.keys(race), ['race_number', 'post_time_local']);
    assert.equal(race.race_number, index + 1);
    assert.match(race.post_time_local, /^\d{2}:\d{2}$/);
  });
}

console.log('TJK_CURRENT_PROMOTION_REVIEW: pass');
console.log(`REVIEW_STATUS: ${review.review.status}`);
console.log('CANDIDATE_MEETINGS: 2');
console.log('CANDIDATE_RACES: 18');
console.log(`PUBLIC_IDENTITY_WRITTEN: ${review.publication_boundary.public_racecourse_identity_written}`);
