import fs from 'node:fs';
import assert from 'node:assert/strict';

const REVIEW_PATH = 'data/static/kra-2026-reviewed-public-timetable-identities-v1.json';
const PLAN_PATH = 'data/static/kra-2026-reviewed-calendar-plan-v1.json';
const RACECOURSE_FILES = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json'
];

const review = JSON.parse(fs.readFileSync(REVIEW_PATH, 'utf8'));
const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
const rows = RACECOURSE_FILES.flatMap((file) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (Array.isArray(data) ? data : []).map((row) => ({ file, row }));
});

assert.equal(review.schema_version, 'kra-reviewed-public-timetable-identities-v1');
assert.equal(review.work_id, 'WHR-CAL-SOUTH-KOREA-KRA');
assert.equal(review.implementation_unit, 'KRA-PUBLIC-IDENTITY-PROMOTION-01');
assert.equal(review.country_id, 'south-korea');
assert.equal(review.authority_id, 'korea-racing-authority');
assert.equal(review.candidate_rank, 'C');
assert.equal(review.review.status, 'pending_human_review');
assert.equal(review.review.reviewed_at, null);
assert.equal(review.review.reviewer, null);
assert.deepEqual(review.publication_boundary, {
  canonical_written: false,
  public_projection_written: false,
  automatic_approval: false,
  automatic_merge: false,
  deployment_performed: false
});

const expectedIds = ['seoul-racecourse', 'busan-gyeongnam-racecourse', 'jeju-racecourse'];
assert.deepEqual(review.records.map((record) => record.racecourse_id), expectedIds);
assert.deepEqual(plan.venues.map((venue) => venue.racecourse_id), expectedIds);

for (const record of review.records) {
  assert.equal(record.slug, record.racecourse_id);
  assert.equal(record.timezone, 'Asia/Seoul');
  assert.equal(record.public_profile, 'identity_only');
  assert.ok(record.name_en && record.name_ja && record.name_local);
}

const seoul = review.records[0];
assert.equal(seoul.registration_state, 'existing_canonical');
assert.equal(seoul.canonical_registry, 'data/static/racecourses.json');
assert.equal(seoul.promotion_action, 'reuse_existing_identity');
const seoulMatches = rows.filter(({ row }) => row?.id === 'seoul-racecourse');
assert.equal(seoulMatches.length, 1, 'Seoul canonical identity must exist exactly once');
assert.equal(seoulMatches[0].file, 'data/static/racecourses.json');
assert.equal(seoulMatches[0].row.country_id, 'south-korea');
assert.equal(seoulMatches[0].row.timezone, 'Asia/Seoul');
assert.equal(seoulMatches[0].row.name_local, '서울경마공원');

for (const record of review.records.slice(1)) {
  assert.equal(record.registration_state, 'prepared_for_human_review');
  assert.equal(record.canonical_registry, 'data/static/racecourses-public-timetable-identities-v1.json');
  assert.equal(record.promotion_action, 'add_identity_only_after_human_review');
  assert.equal(rows.filter(({ row }) => row?.id === record.racecourse_id).length, 0, `${record.racecourse_id} must not be written before human review`);
}

assert.equal(review.records[1].name_local, '부산경남경마공원');
assert.equal(review.records[2].name_local, '제주경마공원');
assert.ok(review.official_identity_evidence.every((source) => source.url.startsWith('https://')));
assert.ok(review.official_identity_evidence.every((source) => expectedIds.every((id) => source.supports.includes(id))));

console.log('KRA_PUBLIC_TIMETABLE_IDENTITIES: pass');
console.log('IDENTITIES: seoul-racecourse=existing busan-gyeongnam-racecourse=pending jeju-racecourse=pending');
console.log('PUBLICATION_EFFECT: none');
console.log('HUMAN_REVIEW_REQUIRED: true');
