import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const identityReviewPath = 'data/static/kra-2026-reviewed-public-timetable-identities-v1.json';
const promotionReviewPath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-review-v1.json';
const registryPath = 'data/static/racecourses-public-timetable-identities-v1.json';
const approvedCandidatePath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-approved.json';

function fail(message) {
  throw new Error(`[KRA reviewed promotion] ${message}`);
}
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function writeJson(relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  const temporaryPath = `${absolutePath}.kra-reviewed-promotion.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporaryPath, absolutePath);
}
function run(script, args = []) {
  console.log(`$ node ${script} ${args.join(' ')}`.trim());
  execFileSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
}
function assertApproved(review, target) {
  if (review.review?.status !== 'approved') fail(`${target} review is not approved`);
  if (!review.review?.reviewer) fail(`${target} reviewer is missing`);
  if (Number.isNaN(Date.parse(review.review?.reviewed_at))) fail(`${target} reviewed_at is invalid`);
  if (review.publication_boundary?.automatic_approval !== false) fail(`${target} automatic approval boundary changed`);
  if (review.publication_boundary?.automatic_merge !== false) fail(`${target} automatic merge boundary changed`);
  if (review.publication_boundary?.deployment_performed !== false) fail(`${target} deployment boundary changed`);
}
function emptyCourseProfile() {
  return { turf_circumference_m: null, dirt_circumference_m: null, home_straight_m: null, has_inner_outer_courses: null, has_lighting: null, elevation_notes_en: null, elevation_notes_ja: null, course_notes_en: null, course_notes_ja: null };
}
function emptyDistanceProfile() {
  const empty = () => ({ min_m: null, max_m: null, known_distances_m: [] });
  return { turf: empty(), dirt: empty(), all_weather: empty(), jump: empty(), harness: empty(), upcoming_conditions: [] };
}
function makeIdentity(record, review) {
  const checkedDate = review.review.reviewed_at.slice(0, 10);
  const officialLinks = review.official_identity_evidence.map((source) => ({
    label_en: source.source_id === 'kra-major-facilities' ? 'KRA major facilities' : 'KRA racing RSS service',
    label_ja: source.source_id === 'kra-major-facilities' ? 'KRA主要施設' : 'KRA競馬RSSサービス',
    source_id: source.source_id,
    url: source.url,
    link_type: 'official'
  }));
  return {
    id: record.racecourse_id,
    slug: record.slug,
    country_id: 'south-korea',
    name_en: record.name_en,
    name_ja: record.name_ja,
    name_local: record.name_local,
    city: null,
    region: null,
    timezone: 'Asia/Seoul',
    racing_types: [],
    status: 'active',
    surfaces: [],
    direction: 'unknown',
    course_profile: emptyCourseProfile(),
    distance_profile: emptyDistanceProfile(),
    schedule_summary: { today_status: 'unknown', next_meeting_date: null, upcoming_meetings: [], status: 'official-link-only', last_checked: null },
    notable_races: [],
    seasonality: {
      summary_en: 'Meeting dates must be confirmed through the reviewed public Calendar and official KRA sources.',
      summary_ja: '開催日は、確認済み公開カレンダーおよびKRA公式ソースで確認する必要がある。',
      status: 'unverified'
    },
    official_links: officialLinks,
    related_terms: ['racecourse', 'meeting', 'fixture', 'post-time'],
    related_sources: officialLinks.map((link) => link.source_id),
    data_status: { course_profile: 'unverified', schedule: 'official-link-only', source_status: 'link_first', last_checked: checkedDate },
    identity_status: 'verified_from_reviewed_public_timetable',
    profile_status: 'identity_only',
    image_status: 'planned',
    image_path: null,
    image_alt_en: `Planned illustrative image for ${record.name_en}.`,
    image_alt_ja: `${record.name_ja}の説明用イメージ画像予定地。`,
    course_diagram_status: 'pending',
    image: {
      src: '',
      alt_en: `Planned illustrative image for ${record.name_en}.`,
      alt_ja: `${record.name_ja}の説明用イメージ画像予定地。`,
      image_type: 'placeholder',
      is_official_photo: false,
      note_en: 'Illustrative image. Not an official venue photo.',
      note_ja: '説明用のイメージ画像です。公式写真ではありません。',
      status: 'planned'
    }
  };
}

const identityReview = readJson(identityReviewPath);
const promotionReview = readJson(promotionReviewPath);
assertApproved(identityReview, 'identity');
assertApproved(promotionReview, 'Rank C promotion');
if (identityReview.review.reviewed_at !== promotionReview.review.reviewed_at || identityReview.review.reviewer !== promotionReview.review.reviewer) {
  fail('identity and meeting approvals must share reviewer and reviewed_at');
}
if (promotionReview.meeting_count !== 32 || promotionReview.records?.length !== 32) fail('approved KRA meeting set must contain exactly 32 records');
if (promotionReview.records.some((record) => record.capability_rank !== 'C')) fail('approved KRA meeting set may contain Rank C only');

const registry = readJson(registryPath);
const targetRecords = identityReview.records.filter((record) => ['busan-gyeongnam-racecourse', 'jeju-racecourse'].includes(record.racecourse_id));
if (targetRecords.length !== 2) fail('identity review must contain Busan-Gyeongnam and Jeju exactly once');
const existing = targetRecords.map((record) => registry.some((row) => row.id === record.racecourse_id));
if (existing[0] !== existing[1]) fail('refusing partial KRA identity publication state');
if (!existing[0]) {
  for (const record of targetRecords) registry.push(makeIdentity(record, identityReview));
  writeJson(registryPath, registry);
}

run('scripts/check-kra-public-timetable-identities.mjs');
run('scripts/timetable/build-kra-rank-c-approved-candidate.mjs');
run('scripts/timetable/build-kra-rank-c-approved-candidate.mjs', ['--check']);
run('scripts/timetable/promote-approved-candidate-v1.mjs', ['--input', approvedCandidatePath]);
run('scripts/timetable/build-public-timetable-view.mjs');

for (const reviewPath of [identityReviewPath, promotionReviewPath]) {
  const review = readJson(reviewPath);
  review.publication_boundary = {
    ...review.publication_boundary,
    canonical_written: true,
    public_projection_written: true,
    automatic_approval: false,
    automatic_merge: false,
    deployment_performed: false
  };
  writeJson(reviewPath, review);
}

run('scripts/check-kra-public-timetable-identities.mjs');
run('scripts/check-kra-rank-c-promotion-gate.mjs');
run('scripts/timetable/promote-approved-candidate-v1.mjs', ['--input', approvedCandidatePath, '--check']);
run('scripts/timetable/build-public-timetable-view.mjs', ['--check']);
run('scripts/check-calendar-runtime-import-boundary.mjs');

console.log('[KRA reviewed promotion] complete');
console.log('[KRA reviewed promotion] canonical/public files were generated locally only; merge and deployment remain separate reviewed actions.');
