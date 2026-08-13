import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const review = readJson('data/candidates/tjk-current-2026-08-11-promotion-review-v1.json');
const identityReview = readJson('data/static/tjk-2026-08-11-reviewed-public-timetable-identities-v1.json');
const approved = readJson('data/candidates/tjk-current-2026-08-11-approved.json');
const registry = readJson('data/static/racecourses-public-timetable-identities-v1.json');
const canonicalMeetings = readJson('data/generated/timetable/canonical/meetings.json');
const canonicalDetails = readJson('data/generated/timetable/canonical/meeting-details.json');
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');
const policies = readJson('src/data/publicationDisplayPolicies.json');

const targetMeetingIds = ['tjk-ankara-racecourse-2026-08-11', 'tjk-kocaeli-racecourse-2026-08-11'];
const targetRacecourseIds = ['ankara-racecourse', 'kocaeli-racecourse'];
const expectedTimes = new Map([
  ['tjk-ankara-racecourse-2026-08-11', ['14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']],
  ['tjk-kocaeli-racecourse-2026-08-11', ['17:15','17:45','18:30','19:00','19:30','20:00','20:30','21:00','21:30']],
]);

assert.equal(review.review.status, 'approved');
assert.equal(review.review.reviewer, 'badjoke-lab');
assert.equal(review.review.reviewed_at, '2026-08-12T06:29:00Z');
assert.equal(identityReview.review.status, 'approved');
assert.equal(identityReview.review.reviewer, review.review.reviewer);
assert.equal(identityReview.review.reviewed_at, review.review.reviewed_at);
for (const document of [review, identityReview]) {
  assert.equal(document.publication_boundary.canonical_written, true);
  assert.equal(document.publication_boundary.public_projection_written, true);
  assert.equal(document.publication_boundary.public_racecourse_identity_written, true);
  assert.equal(document.publication_boundary.automatic_approval, false);
  assert.equal(document.publication_boundary.automatic_merge, false);
  assert.equal(document.publication_boundary.deployment_performed, false);
}

assert.equal(approved.schema_version, 'timetable-candidate-v1');
assert.equal(approved.review.status, 'approved');
assert.equal(approved.review.reviewer, 'badjoke-lab');
assert.equal(approved.review.reviewed_at, '2026-08-12T06:29:00Z');
assert.equal(approved.review.promotion_target, 'canonical-timetable-v0');
assert.equal(approved.records.length, 2);
assert.deepEqual(approved.records.map((row) => row.meeting_id), targetMeetingIds);
for (const record of approved.records) {
  assert.equal(record.capability_rank, 'A');
  assert.equal(record.review_status, 'approved');
  assert.equal(record.timetable_rows.length, 9);
  const times = expectedTimes.get(record.meeting_id);
  assert.deepEqual(record.timetable_rows.map((row) => row.label), Array.from({ length: 9 }, (_, index) => `Race ${index + 1}`));
  assert.deepEqual(record.timetable_rows.map((row) => row.post_time_local), times);
  assert.equal(record.first_race_time_local, times[0]);
  assert.equal(record.last_race_time_local, times[8]);
  assert.equal(new URL(record.source.official_url).hostname, 'www.tjk.org');
}

const identityTargets = registry.filter((row) => targetRacecourseIds.includes(row.id));
assert.equal(identityTargets.length, 2);
assert.deepEqual(identityTargets.map((row) => row.id).sort(), [...targetRacecourseIds].sort());
for (const row of identityTargets) {
  assert.equal(row.country_id, 'turkey');
  assert.equal(row.timezone, 'Europe/Istanbul');
  assert.equal(row.identity_status, 'verified_from_reviewed_public_timetable');
  assert.equal(row.profile_status, 'identity_only');
}

const policy = policies.policies.find((row) => row.id === 'tjk-reviewed-a');
assert.ok(policy, 'missing TJK A public-display policy');
assert.deepEqual(policy.match.authority_ids, ['turkiye-jokey-kulubu']);
assert.equal(policy.max_public_rank, 'A');
assert.equal(policy.include_in_public_list, true);
assert.deepEqual(policy.a_plus_fields, { show_race_name: false, show_distance: false, show_surface: false, show_course: false });

const canonicalMeetingTargets = canonicalMeetings.meetings.filter((row) => targetMeetingIds.includes(row.meeting_id));
assert.equal(canonicalMeetingTargets.length, 2);
for (const row of canonicalMeetingTargets) {
  const times = expectedTimes.get(row.meeting_id);
  assert.equal(row.country_id, 'turkey');
  assert.equal(row.authority_id, 'turkiye-jokey-kulubu');
  assert.ok(targetRacecourseIds.includes(row.racecourse_id));
  assert.equal(row.capability_rank, 'A');
  assert.equal(row.display_status, 'displayable');
  assert.equal(row.first_race_time_local, times[0]);
  assert.equal(row.last_race_time_local, times[8]);
}

const canonicalDetailTargets = canonicalDetails.details.filter((row) => targetMeetingIds.includes(row.meeting_id));
assert.equal(canonicalDetailTargets.length, 2);
for (const row of canonicalDetailTargets) {
  const times = expectedTimes.get(row.meeting_id);
  assert.equal(row.capability_rank, 'A');
  assert.equal(row.timetable_rows.length, 9);
  assert.deepEqual(row.timetable_rows.map((item) => item.label), Array.from({ length: 9 }, (_, index) => `Race ${index + 1}`));
  assert.deepEqual(row.timetable_rows.map((item) => item.post_time_local), times);
  assert.ok(row.timetable_rows.every((item) => item.race_name === null && item.distance_m === null && item.surface === null && item.course_label === null));
}

const publicMeetingTargets = publicMeetings.meetings.filter((row) => targetMeetingIds.includes(row.meeting_id));
assert.equal(publicMeetingTargets.length, 2);
for (const row of publicMeetingTargets) {
  assert.equal(row.capability_rank, 'A');
  assert.equal(row.max_public_rank, 'A');
  assert.equal(row.effective_public_rank, 'A');
  assert.equal(row.policy_id, 'tjk-reviewed-a');
  assert.equal(row.show_live_label, false);
  assert.equal(row.show_replay_label, false);
  assert.ok(typeof row.detail_path === 'string' && row.detail_path.length > 0);
}

const publicDetailTargets = publicDetails.details.filter((row) => targetMeetingIds.includes(row.meeting_id));
assert.equal(publicDetailTargets.length, 2);
for (const row of publicDetailTargets) {
  const times = expectedTimes.get(row.meeting_id);
  assert.equal(row.capability_rank, 'A');
  assert.equal(row.max_public_rank, 'A');
  assert.equal(row.effective_public_rank, 'A');
  assert.equal(row.policy_id, 'tjk-reviewed-a');
  assert.equal(row.show_race_name, false);
  assert.equal(row.show_distance, false);
  assert.equal(row.show_surface, false);
  assert.equal(row.show_course, false);
  assert.equal(row.timetable_rows.length, 9);
  assert.deepEqual(row.timetable_rows.map((item) => item.label), Array.from({ length: 9 }, (_, index) => `Race ${index + 1}`));
  assert.deepEqual(row.timetable_rows.map((item) => item.post_time_local), times);
  assert.ok(row.timetable_rows.every((item) => !Object.hasOwn(item, 'race_name') && !Object.hasOwn(item, 'distance_m') && !Object.hasOwn(item, 'surface') && !Object.hasOwn(item, 'course_label')));
}

console.log('TJK_CURRENT_REVIEWED_PROMOTION: pass');
console.log('CANONICAL_MEETINGS: 2');
console.log('CANONICAL_RACES: 18');
console.log('PUBLIC_MEETINGS: 2 rank=A');
console.log('PUBLIC_RACES: 18 rank=A');
console.log('PUBLIC_IDENTITIES: 2');
