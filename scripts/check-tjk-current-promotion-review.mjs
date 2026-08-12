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

assert.equal(review.review.status, 'pending_human_review');
assert.equal(review.review.reviewed_at, null);
assert.equal(review.review.reviewer, null);
assert.equal(review.review.promotion_target, 'separate-racecourse-identity-and-timetable-promotion-unit');
assert.equal(review.review.approval_effect, 'none_until_explicit_human_approval');

for (const key of [
  'canonical_written',
  'public_projection_written',
  'public_racecourse_identity_written',
  'automatic_approval',
  'automatic_merge',
  'deployment_performed',
]) {
  assert.equal(review.publication_boundary[key], false, `TJK pending review publication boundary differs: ${key}`);
}

const compactCandidate = candidate.records.map((record) => ({
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
assert.deepEqual(review.records, compactCandidate, 'TJK human-review packet must exactly bind the deterministic current candidate');

assert.equal(review.identity_review.registry, registryPath);
assert.equal(review.identity_review.existing_public_identity_found, false);
assert.equal(review.identity_review.registration_required_for_promotion, true);
assert.deepEqual(review.identity_review.records, [
  { source_venue_id: '5', source_venue_label: 'Ankara', public_racecourse_id: null, status: 'requires_separate_identity_review' },
  { source_venue_id: '9', source_venue_label: 'Kocaeli', public_racecourse_id: null, status: 'requires_separate_identity_review' },
]);

const targetNames = new Set(['ankara', 'kocaeli']);
const existingTarget = registry.find((entry) => {
  const values = [entry.id, entry.slug, entry.name_en, entry.name_ja, entry.name_local]
    .filter((value) => typeof value === 'string')
    .map((value) => value.normalize('NFKC').toLowerCase());
  return values.some((value) => [...targetNames].some((target) => value.includes(target)));
});
assert.equal(existingTarget, undefined, 'Ankara/Kocaeli public racecourse identity already exists; review packet must be updated instead of assuming registration is required');

for (const record of review.records) {
  assert.ok(!Object.hasOwn(record, 'racecourse_id'), 'pending TJK review must not invent a public racecourse_id');
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
console.log('REVIEW_STATUS: pending_human_review');
console.log('CANDIDATE_MEETINGS: 2');
console.log('CANDIDATE_RACES: 18');
console.log('PUBLIC_IDENTITY_REGISTRATION_REQUIRED: true');
console.log('PUBLICATION_EFFECT: none');
