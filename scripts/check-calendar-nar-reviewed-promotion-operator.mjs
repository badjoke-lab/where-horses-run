import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

const launcher = read('promote-nar-monthly-manual');
const operator = read('scripts/timetable/manual-promote-reviewed-nar-monthly.mjs');
const builder = read('scripts/timetable/build-reviewed-nar-monthly-promotion-candidate.mjs');
const validator = read('scripts/check-calendar-nar-reviewed-promotion.mjs');
const readinessLoader = read('scripts/timetable/load-calendar-readiness.mjs');
const authorityLoader = read('scripts/timetable/load-authority-source-inventory.mjs');
const overrideBuilder = read('scripts/timetable/build-japan-a-plus-public-overrides.mjs');
const jraPilotReviewBuilder = read('scripts/timetable/build-jra-pilot-review.mjs');
const jraPilotReviewValidator = read('scripts/check-jra-pilot-foundation.mjs');
const operationsBuilder = read('scripts/timetable/build-operations-status.mjs');
const operationsValidator = read('scripts/check-calendar-operations-status.mjs');
const operationsReviewBuilder = read('scripts/timetable/build-operations-review-package.mjs');
const operationsReviewValidator = read('scripts/check-calendar-operations-review-package.mjs');
const readinessSupplement = read('data/static/calendar-readiness-nar-race-list-v1.json');
const authoritySupplement = read('data/static/authority-source-inventory-nar-race-list-v1.json');
const review = read('data/reviews/nar-monthly-2026-07-through-2026-07-04-review.json');
const scheduled = read('.github/workflows/timetable-scheduled-refresh.yml');

for (const marker of ['--filter=blob:none', '--no-checkout', 'sparse-checkout init --no-cone', '!/docs/', 'trap cleanup', 'manual-promote-reviewed-nar-monthly.mjs']) {
  if (!launcher.includes(marker)) fail(`launcher missing ${marker}.`);
}

const orderedCommands = [
  "check-calendar-nar-monthly-candidate-set.mjs",
  "check-calendar-nar-reviewed-promotion.mjs', '--allow-missing-generated",
  'build-reviewed-nar-monthly-promotion-candidate.mjs',
  "build-reviewed-nar-monthly-promotion-candidate.mjs', '--check",
  'promote-approved-candidate-v1.mjs',
  'build-public-timetable-view.mjs',
  'build-japan-a-plus-public-overrides.mjs',
  'check-japan-a-plus-public-overrides.mjs',
  'build-jra-pilot-review.mjs',
  'check-jra-pilot-foundation.mjs',
  'build-operations-status.mjs',
  'check-calendar-operations-status.mjs',
  'build-operations-review-package.mjs',
  'check-calendar-operations-review-package.mjs',
  "check-calendar-nar-reviewed-promotion.mjs', '--require-promoted",
  'check-calendar-runtime-import-boundary.mjs',
  "'run', 'build'",
];
let previousIndex = -1;
for (const marker of orderedCommands) {
  const index = operator.indexOf(marker);
  if (index < 0) fail(`operator missing ${marker}.`);
  else if (index <= previousIndex) fail(`operator command order differs at ${marker}.`);
  previousIndex = index;
}

for (const marker of [
  'data/candidates/nar-monthly-2026-07-through-2026-07-04-approved.json',
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/generated/timetable/public/japan-a-plus-overrides.json',
  'data/generated/timetable/jra-pilot-review.json',
  'data/generated/timetable/operations-status.json',
  'data/generated/timetable/operations-review-package.json',
  'automation/nar-promote-',
  'Expected changed file missing',
  'All 16 reviewed meetings must be present in public details at A+.',
]) {
  if (!operator.includes(marker)) fail(`operator missing boundary marker ${marker}.`);
}

for (const marker of [
  'nar-race-list-deba-table',
  'sourceBlobSha',
  'review approval set differs from source complete meeting set',
  'legacy NAR monthly-convene source must remain link_only',
  'REVIEWED_MEETINGS',
  'PROMOTED_PROJECTION_CHECKED',
]) {
  if (!validator.includes(marker)) fail(`reviewed promotion validator missing ${marker}.`);
}

for (const marker of [
  'nar-race-list-deba-table',
  'all_a_plus_fields_complete',
  'approved candidate IDs must be unique',
  'review approval set must exactly equal the complete source meeting candidate set',
  "review_status: 'approved'",
]) {
  if (!builder.includes(marker)) fail(`approved candidate builder missing ${marker}.`);
}

for (const marker of ['calendar-readiness-nar-race-list-v1.json', 'applySupplement', 'applyAmendments']) {
  if (!readinessLoader.includes(marker)) fail(`readiness loader missing ${marker}.`);
}
for (const marker of ['authority-source-inventory-nar-race-list-v1.json', 'supplement.records']) {
  if (!authorityLoader.includes(marker)) fail(`authority loader missing ${marker}.`);
}
for (const marker of ['loadCalendarReadinessV1', 'resolveCalendarReadinessRegistryForProjection']) {
  if (!overrideBuilder.includes(marker)) fail(`Japan override builder missing reviewed readiness integration ${marker}.`);
}
for (const marker of ['jra-pilot-review.json', 'public_meeting_list_sha256', 'public_meeting_details_sha256']) {
  if (!jraPilotReviewBuilder.includes(marker)) fail(`JRA pilot review builder missing ${marker}.`);
}
for (const marker of ['JRA pilot review check failed', 'public projection meeting count is invalid', 'public projection detail count is invalid']) {
  if (!jraPilotReviewValidator.includes(marker)) fail(`JRA pilot review validator missing ${marker}.`);
}
for (const marker of ['operations-status.json', '--reference-date']) {
  if (!operationsBuilder.includes(marker)) fail(`operations status builder missing ${marker}.`);
}
for (const marker of ['public meeting count differs from current public JSON', 'public detail count differs from current public JSON']) {
  if (!operationsValidator.includes(marker)) fail(`operations status validator missing ${marker}.`);
}
for (const marker of ['operations-review-package.json', 'operations_status_sha256', 'public_meeting_list_sha256']) {
  if (!operationsReviewBuilder.includes(marker)) fail(`operations review package builder missing ${marker}.`);
}
for (const marker of ['review package check failed', 'JRA_CANDIDATE_DIGEST_RESOLUTION']) {
  if (!operationsReviewValidator.includes(marker)) fail(`operations review package validator missing ${marker}.`);
}
for (const marker of ['"technical_rank": "A+"', '"public_ceiling": "A+"', '"readiness": "prototype_ready"', '"automation_mode": "semi_automatic"', '"racecourse_ids"']) {
  if (!readinessSupplement.includes(marker)) fail(`readiness supplement missing ${marker}.`);
}
for (const marker of ['"official_source_id": "nar-race-list-deba-table"', '"source_status": "verified"', '"capability_rank": "A+"']) {
  if (!authoritySupplement.includes(marker)) fail(`authority supplement missing ${marker}.`);
}
for (const marker of ['"status": "approved"', '"promotion_target": "canonical-timetable-v0"', '"meetings_discovered": 16', '"blocked_meetings": 0']) {
  if (!review.includes(marker)) fail(`review decision missing ${marker}.`);
}

const prohibited = ['runner', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'tips', 'raw_html', 'source_body'];
for (const [name, text] of [['review', review], ['builder', builder], ['readiness supplement', readinessSupplement], ['authority supplement', authoritySupplement]]) {
  const lower = text.toLowerCase();
  for (const marker of prohibited) {
    if (lower.includes(`\"${marker}\"`)) fail(`${name} contains prohibited key ${marker}.`);
  }
}

if (/^\s*schedule:/m.test(scheduled) || scheduled.includes('cron:')) fail('scheduled refresh must remain disabled.');
if (!operator.includes('2026-07') || !operator.includes('2026-07-04')) fail('operator must be pinned to the reviewed month and cutoff.');
if (!operator.includes('A later cutoff requires a new collection and review decision.')) fail('operator must reject unreviewed later cutoffs.');

if (errors.length) {
  console.error(`CALENDAR_NAR_REVIEWED_PROMOTION_OPERATOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_REVIEWED_PROMOTION_OPERATOR: pass');
console.log('REVIEWED_MEETINGS: 16');
console.log('SOURCE_SCOPE: nar-race-list-deba-table');
console.log('LEGACY_NAR_MONTHLY_SOURCE_ACTIVATED: false');
console.log('JRA_PILOT_REVIEW_SYNCHRONIZED: true');
console.log('OPERATIONS_STATUS_SYNCHRONIZED: true');
console.log('OPERATIONS_REVIEW_PACKAGE_SYNCHRONIZED: true');
console.log('SCHEDULED_FETCH: disabled');
