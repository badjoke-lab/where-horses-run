import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const identityReviewPath = 'data/static/tjk-2026-08-11-reviewed-public-timetable-identities-v1.json';
const promotionReviewPath = 'data/candidates/tjk-current-2026-08-11-promotion-review-v1.json';
const registryPath = 'data/static/racecourses-public-timetable-identities-v1.json';
const approvedCandidatePath = 'data/candidates/tjk-current-2026-08-11-approved.json';

function fail(message) { throw new Error(`[TJK reviewed promotion] ${message}`); }
function absolute(relativePath) { return path.join(root, relativePath); }
function readJson(relativePath) { return JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8')); }
function writeTextAtomic(relativePath, content) {
  const target = absolute(relativePath);
  const temporaryPath = `${target}.tjk-reviewed-promotion.tmp`;
  fs.writeFileSync(temporaryPath, content);
  fs.renameSync(temporaryPath, target);
}
function appendJsonArrayRecordsPreservingExisting(relativePath, records) {
  if (!records.length) return;
  const raw = fs.readFileSync(absolute(relativePath), 'utf8');
  const trimmed = raw.trimEnd();
  if (!trimmed.endsWith(']')) fail(`${relativePath} must be a JSON array`);
  const prefix = trimmed.slice(0, -1).trimEnd();
  const separator = prefix.endsWith('[') ? '\n' : ',\n';
  const rendered = records.map((record) => JSON.stringify(record, null, 2)).join(',\n');
  writeTextAtomic(relativePath, `${prefix}${separator}${rendered}\n]\n`);
}
function markPublicationBoundaryWritten(relativePath) {
  let raw = fs.readFileSync(absolute(relativePath), 'utf8');
  for (const field of ['canonical_written', 'public_projection_written', 'public_racecourse_identity_written']) {
    const from = `"${field}": false`;
    const to = `"${field}": true`;
    const occurrences = raw.split(from).length - 1;
    if (occurrences === 0 && raw.includes(to)) continue;
    if (occurrences !== 1) fail(`${relativePath} must contain exactly one pending ${field} flag`);
    raw = raw.replace(from, to);
  }
  writeTextAtomic(relativePath, raw);
}
function run(script, args = []) {
  console.log(`$ node ${script} ${args.join(' ')}`.trim());
  execFileSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
}
function assertApproved(value, target) {
  if (value.review?.status !== 'approved') fail(`${target} review is not approved`);
  if (value.review?.reviewer !== 'badjoke-lab') fail(`${target} reviewer differs`);
  if (value.review?.reviewed_at !== '2026-08-12T06:29:00Z') fail(`${target} reviewed_at differs`);
  if (value.publication_boundary?.automatic_approval !== false) fail(`${target} automatic approval boundary changed`);
  if (value.publication_boundary?.automatic_merge !== false) fail(`${target} automatic merge boundary changed`);
  if (value.publication_boundary?.deployment_performed !== false) fail(`${target} deployment boundary changed`);
}
function emptyCourseProfile() {
  return { turf_circumference_m: null, dirt_circumference_m: null, home_straight_m: null, has_inner_outer_courses: null, has_lighting: null, elevation_notes_en: null, elevation_notes_ja: null, course_notes_en: null, course_notes_ja: null };
}
function emptyDistanceProfile() {
  const empty = () => ({ min_m: null, max_m: null, known_distances_m: [] });
  return { turf: empty(), dirt: empty(), all_weather: empty(), jump: empty(), harness: empty(), upcoming_conditions: [] };
}
function makeIdentity(record, review) {
  const evidence = review.official_identity_evidence.find((source) => source.supports.includes(record.racecourse_id));
  if (!evidence) fail(`missing official identity evidence for ${record.racecourse_id}`);
  return {
    id: record.racecourse_id,
    slug: record.slug,
    country_id: 'turkey',
    name_en: record.name_en,
    name_ja: record.name_ja,
    name_local: record.name_local,
    city: null,
    region: null,
    timezone: 'Europe/Istanbul',
    racing_types: [],
    status: 'active',
    surfaces: [],
    direction: 'unknown',
    course_profile: emptyCourseProfile(),
    distance_profile: emptyDistanceProfile(),
    schedule_summary: { today_status: 'unknown', next_meeting_date: null, upcoming_meetings: [], status: 'official-link-only', last_checked: null },
    notable_races: [],
    seasonality: {
      summary_en: 'Meeting dates must be confirmed through the reviewed public Calendar and official TJK sources.',
      summary_ja: '開催日は、確認済み公開カレンダーおよびTJK公式ソースで確認する必要がある。',
      status: 'unverified'
    },
    official_links: [{ label_en: 'TJK daily programme', label_ja: 'TJK公式競走プログラム', source_id: evidence.source_id, url: evidence.url, link_type: 'official' }],
    related_terms: ['racecourse', 'meeting', 'fixture', 'post-time'],
    related_sources: [evidence.source_id],
    data_status: { course_profile: 'unverified', schedule: 'official-link-only', source_status: 'link_first', last_checked: review.review.reviewed_at.slice(0, 10) },
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
assertApproved(promotionReview, 'promotion');
if (identityReview.review.reviewed_at !== promotionReview.review.reviewed_at || identityReview.review.reviewer !== promotionReview.review.reviewer) fail('identity and meeting approvals must share reviewer and reviewed_at');
if (promotionReview.meeting_count !== 2 || promotionReview.race_count !== 18 || promotionReview.records?.length !== 2) fail('approved TJK scope must be exactly 2 meetings / 18 races');

const registry = readJson(registryPath);
const targetRecords = identityReview.records;
const existing = targetRecords.map((record) => registry.some((row) => row.id === record.racecourse_id));
if (existing.some(Boolean) && !existing.every(Boolean)) fail('refusing partial TJK identity publication state');
if (!existing[0]) appendJsonArrayRecordsPreservingExisting(registryPath, targetRecords.map((record) => makeIdentity(record, identityReview)));

run('scripts/timetable/build-tjk-current-approved-candidate.mjs');
run('scripts/timetable/build-tjk-current-approved-candidate.mjs', ['--check']);
run('scripts/timetable/promote-approved-candidate-v1.mjs', ['--input', approvedCandidatePath]);
run('scripts/timetable/build-public-timetable-view.mjs');

for (const reviewPath of [identityReviewPath, promotionReviewPath]) markPublicationBoundaryWritten(reviewPath);

run('scripts/check-tjk-public-timetable-identities.mjs');
run('scripts/check-tjk-current-promotion-review.mjs');
run('scripts/timetable/build-tjk-current-approved-candidate.mjs', ['--check']);
run('scripts/timetable/promote-approved-candidate-v1.mjs', ['--input', approvedCandidatePath, '--check']);
run('scripts/timetable/build-public-timetable-view.mjs', ['--check']);
run('scripts/check-tjk-current-reviewed-promotion.mjs');
run('scripts/check-calendar-runtime-import-boundary.mjs');

console.log('[TJK reviewed promotion] complete');
console.log('[TJK reviewed promotion] generated Canonical/public/identity changes remain branch-local until reviewed merge. Deployment is not performed.');
