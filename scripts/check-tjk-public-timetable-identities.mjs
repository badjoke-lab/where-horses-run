import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const reviewPath = 'data/static/tjk-2026-08-11-reviewed-public-timetable-identities-v1.json';
const registryPath = 'data/static/racecourses-public-timetable-identities-v1.json';
const review = readJson(reviewPath);
const registry = readJson(registryPath);

assert.equal(review.schema_version, 'tjk-reviewed-public-timetable-identities-v1');
assert.equal(review.work_id, 'WHR-CAL-TURKEY-TJK');
assert.equal(review.implementation_unit, 'TJK-CURRENT-IDENTITY-PROMOTION-01');
assert.equal(review.country_id, 'turkey');
assert.equal(review.authority_id, 'turkiye-jokey-kulubu');
assert.equal(review.candidate_rank, 'A');
assert.equal(review.review.status, 'approved');
assert.equal(review.review.reviewer, 'badjoke-lab');
assert.equal(review.review.reviewed_at, '2026-08-12T06:29:00Z');
assert.equal(review.review.promotion_target, registryPath);
assert.equal(review.records.length, 2);
assert.deepEqual(review.records.map((row) => [row.source_venue_id, row.racecourse_id, row.name_en, row.name_ja, row.name_local]), [
  ['5', 'ankara-racecourse', 'Ankara Racecourse', 'アンカラ競馬場', 'Ankara'],
  ['9', 'kocaeli-racecourse', 'Kocaeli Racecourse', 'コジャエリ競馬場', 'Kocaeli'],
]);

for (const key of ['automatic_approval', 'automatic_merge', 'deployment_performed']) {
  assert.equal(review.publication_boundary[key], false, `TJK identity governance boundary differs: ${key}`);
}
const written = review.publication_boundary.public_racecourse_identity_written;
assert.equal(review.publication_boundary.canonical_written, written, 'TJK identity canonical flag must match identity write state');
assert.equal(review.publication_boundary.public_projection_written, written, 'TJK identity public flag must match identity write state');

const targetIds = new Set(review.records.map((row) => row.racecourse_id));
const targets = registry.filter((row) => targetIds.has(row.id));
assert.equal(targets.length, written ? 2 : 0, 'TJK registry state must match reviewed identity publication boundary');

if (written) {
  for (const approved of review.records) {
    const row = targets.find((entry) => entry.id === approved.racecourse_id);
    assert.ok(row, `missing TJK public identity ${approved.racecourse_id}`);
    assert.equal(row.slug, approved.slug);
    assert.equal(row.country_id, 'turkey');
    assert.equal(row.name_en, approved.name_en);
    assert.equal(row.name_ja, approved.name_ja);
    assert.equal(row.name_local, approved.name_local);
    assert.equal(row.timezone, 'Europe/Istanbul');
    assert.equal(row.identity_status, 'verified_from_reviewed_public_timetable');
    assert.equal(row.profile_status, 'identity_only');
    assert.equal(row.status, 'active');
    assert.ok(Array.isArray(row.official_links) && row.official_links.some((link) => link.source_id === 'tjk-daily-programme' && new URL(link.url).hostname === 'www.tjk.org'));
  }
}

console.log('TJK_PUBLIC_TIMETABLE_IDENTITIES: pass');
console.log(`IDENTITIES_WRITTEN: ${written}`);
