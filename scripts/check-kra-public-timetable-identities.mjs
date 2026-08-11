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
assert.equal(review.review.status, 'approved');
assert.ok(review.review.reviewer);
assert.ok(!Number.isNaN(Date.parse(review.review.reviewed_at)));
assert.equal(review.review.promotion_target, 'data/static/racecourses-public-timetable-identities-v1.json');
assert.equal(review.publication_boundary.automatic_approval, false);
assert.equal(review.publication_boundary.automatic_merge, false);
assert.equal(review.publication_boundary.deployment_performed, false);

const expectedIds = ['seoul-racecourse', 'busan-gyeongnam-racecourse', 'jeju-racecourse'];
assert.deepEqual(review.records.map((record) => record.racecourse_id), expectedIds);
assert.deepEqual(plan.venues.map((venue) => venue.racecourse_id), expectedIds);
for (const record of review.records) {
  assert.equal(record.slug, record.racecourse_id);
  assert.equal(record.timezone, 'Asia/Seoul');
  assert.equal(record.public_profile, 'identity_only');
  assert.ok(record.name_en && record.name_ja && record.name_local);
}

const seoulMatches = rows.filter(({ row }) => row?.id === 'seoul-racecourse');
assert.equal(seoulMatches.length, 1, 'Seoul canonical identity must exist exactly once');
assert.equal(seoulMatches[0].file, 'data/static/racecourses.json');
assert.equal(seoulMatches[0].row.country_id, 'south-korea');
assert.equal(seoulMatches[0].row.timezone, 'Asia/Seoul');
assert.equal(seoulMatches[0].row.name_local, '서울경마공원');

const targets = review.records.slice(1);
const targetMatches = targets.map((record) => rows.filter(({ row }) => row?.id === record.racecourse_id));
const presentCount = targetMatches.filter((matches) => matches.length === 1).length;
assert.ok(presentCount === 0 || presentCount === 2, 'Busan-Gyeongnam and Jeju identities must be either both pending or both published');

if (presentCount === 0) {
  for (const matches of targetMatches) assert.equal(matches.length, 0);
} else {
  for (const [index, matches] of targetMatches.entries()) {
    assert.equal(matches.length, 1, `${targets[index].racecourse_id} must exist exactly once after publication`);
    assert.equal(matches[0].file, 'data/static/racecourses-public-timetable-identities-v1.json');
    const row = matches[0].row;
    const expected = targets[index];
    assert.equal(row.slug, expected.slug);
    assert.equal(row.country_id, 'south-korea');
    assert.equal(row.name_en, expected.name_en);
    assert.equal(row.name_ja, expected.name_ja);
    assert.equal(row.name_local, expected.name_local);
    assert.equal(row.timezone, 'Asia/Seoul');
    assert.equal(row.identity_status, 'verified_from_reviewed_public_timetable');
    assert.equal(row.profile_status, 'identity_only');
  }
}

assert.equal(review.records[1].name_local, '부산경남경마공원');
assert.equal(review.records[2].name_local, '제주경마공원');
assert.ok(review.official_identity_evidence.every((source) => source.url.startsWith('https://')));
assert.ok(review.official_identity_evidence.every((source) => expectedIds.every((id) => source.supports.includes(id))));

console.log('KRA_PUBLIC_TIMETABLE_IDENTITIES: pass');
console.log(`PUBLICATION_STATE: ${presentCount === 2 ? 'published_identity_only' : 'approved_not_written'}`);
console.log('AUTOMATIC_APPROVAL: false');
console.log('AUTOMATIC_MERGE: false');
