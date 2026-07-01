import { readFileSync } from 'node:fs';
import path from 'node:path';
import { evaluateJraFinalConfirmation } from './timetable/jra-final-confirmation-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const parse = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const clone = (value) => structuredClone(value);

const planned = parse('data/generated/timetable/jra-planned-program-intake.json');
const control = parse('data/static/jra-pilot-control.json');
const readinessRegistry = parse('data/static/calendar-readiness-registry.json');
const authorityInventory = parse('data/static/authority-source-inventory.json');

function makeFinal({
  sourceStage = 'final_program',
  generatedAt = '2026-07-02T07:30:00.000Z',
  checkedAt = generatedAt,
  reviewStatus = 'needs_review',
  reviewer = null,
  reviewedAt = null,
} = {}) {
  const final = clone(planned);
  final.schema_version = 'jra-final-program-intake-v1';
  final.source_stage = sourceStage;
  final.generated_at = generatedAt;
  final.review_status = reviewStatus;
  final.promotion_eligible = false;
  final.review = {
    status: reviewStatus,
    reviewer,
    reviewed_at: reviewedAt,
    summary: reviewStatus === 'approved'
      ? 'Synthetic approved fixture used only to validate the final-confirmation contract.'
      : 'Synthetic final fixture awaiting human review.'
  };
  final.records = final.records.map((record) => ({
    ...record,
    source_stage: sourceStage,
    promotion_eligible: false,
    source: {
      ...record.source,
      checked_at: checkedAt,
      acquisition_method: 'reviewed_final_program_fixture'
    }
  }));
  return final;
}

function evaluate(final) {
  return evaluateJraFinalConfirmation({
    planned,
    final,
    control,
    readinessRegistry,
    authorityInventory
  });
}

function expectBlockers(label, review, required, forbidden = []) {
  const blockers = review.candidate_generation.blockers;
  for (const blocker of required) {
    if (!blockers.includes(blocker)) fail(`${label} missing blocker ${blocker}.`);
  }
  for (const blocker of forbidden) {
    if (blockers.includes(blocker)) fail(`${label} unexpectedly contains blocker ${blocker}.`);
  }
}

function expectThrow(label, action, marker) {
  try {
    action();
    fail(`${label} did not throw.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(marker)) fail(`${label} threw unexpected error: ${message}`);
  }
}

expectThrow(
  'planned-stage fixture',
  () => evaluate(makeFinal({ sourceStage: 'planned_program' })),
  'final.source_stage must be final_program'
);

const beforeCutoff = evaluate(makeFinal({
  generatedAt: '2026-07-02T06:59:00.000Z',
  checkedAt: '2026-07-02T06:59:00.000Z'
}));
expectBlockers('pre-cutoff fixture', beforeCutoff, ['final_confirmation_too_early', 'human_review_required']);
if (beforeCutoff.source.final_confirmation_time_pass) fail('pre-cutoff fixture must fail final confirmation time.');

const needsReview = evaluate(makeFinal());
expectBlockers('final fixture awaiting review', needsReview, ['human_review_required'], [
  'final_confirmation_too_early',
  'source_fixture_predates_registry',
  'final_program_structure_invalid'
]);
if (!needsReview.source.final_confirmation_time_pass) fail('post-cutoff final fixture must pass confirmation time.');
if (needsReview.candidate_generation.permitted) fail('unreviewed final fixture must not permit candidate generation.');

const approved = evaluate(makeFinal({
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T08:00:00.000Z'
}));
if (approved.candidate_generation.blockers.length !== 0) {
  fail(`approved final fixture has blockers: ${approved.candidate_generation.blockers.join(', ')}.`);
}
if (!approved.candidate_generation.permitted) fail('approved post-cutoff final fixture must permit candidate generation.');
if (!approved.review.approved) fail('approved final fixture review state is not recorded.');
if (approved.comparison.has_changes) fail('unchanged approved fixture must report no planned/final changes.');

const changedFinal = makeFinal({
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T08:00:00.000Z'
});
changedFinal.records[0].first_race_time_local = '10:06';
changedFinal.records[0].timetable_rows[0].post_time_local = '10:06';
const changed = evaluate(changedFinal);
if (!changed.comparison.has_changes) fail('changed final fixture must report a planned/final difference.');
const changedMeeting = changed.comparison.changed_meetings.find((record) => record.meeting_id === changedFinal.records[0].meeting_id);
if (!changedMeeting) fail('changed meeting is missing from the comparison.');
else {
  if (!changedMeeting.time_fields.includes('first_race_time_local')) fail('first-race time change is not reported.');
  if (!changedMeeting.row_changes.some((row) => row.index === 1 && row.fields?.includes('post_time_local'))) {
    fail('first timetable-row post-time change is not reported.');
  }
}
if (!changed.candidate_generation.permitted) fail('reviewed, structurally valid changed final fixture may proceed to candidate generation.');

const badHost = makeFinal({
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T08:00:00.000Z'
});
badHost.records[0].source.official_url = 'https://example.com/final-program';
expectThrow('bad-host fixture', () => evaluate(badHost), 'allowed JRA host');

const badScope = makeFinal({
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T08:00:00.000Z'
});
badScope.records[0].racing_system_id = 'invented-system';
expectThrow('bad-scope fixture', () => evaluate(badScope), 'racing_system_id must match JRA pilot control');

const staleFinal = evaluate(makeFinal({
  generatedAt: '2026-07-02T07:30:00.000Z',
  checkedAt: '2026-06-16T23:59:00.000Z',
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T08:00:00.000Z'
}));
expectBlockers('stale final fixture', staleFinal, ['source_fixture_predates_registry']);

const earlyReview = evaluate(makeFinal({
  reviewStatus: 'approved',
  reviewer: 'jra-final-contract-validator',
  reviewedAt: '2026-07-02T07:00:00.000Z'
}));
expectBlockers('review-before-fixture fixture', earlyReview, ['review_predates_final_fixture']);

for (const review of [beforeCutoff, needsReview, approved, changed, staleFinal, earlyReview]) {
  for (const key of ['network_fetch_performed', 'candidate_generated', 'candidate_approved', 'canonical_written', 'public_projection_written']) {
    if (review.boundaries?.[key] !== false) fail(`final-confirmation boundary ${key} must remain false.`);
  }
}

const source = readFileSync(path.join(root, 'scripts/timetable/jra-final-confirmation-core.mjs'), 'utf8');
for (const required of ['assertJraFinalProgramIntake', 'jra-final-program-intake-validation.mjs']) {
  if (!source.includes(required)) fail(`final-confirmation core missing ${required}.`);
}
for (const forbidden of ['writeFileSync', 'fetch(', 'axios', 'data/generated/timetable/public/meeting-list.json', 'data/candidates/japan-jra-candidates.json']) {
  if (source.includes(forbidden)) fail(`final-confirmation core contains forbidden marker ${forbidden}.`);
}

if (errors.length) {
  console.error(`JRA_FINAL_CONFIRMATION_CONTRACT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JRA_FINAL_CONFIRMATION_CONTRACT: pass');
console.log('WRONG_SOURCE_STAGE_REJECTED: true');
console.log('PRE_CUTOFF_BLOCKED: true');
console.log('HUMAN_REVIEW_REQUIRED: true');
console.log('APPROVED_FINAL_FIXTURE_PERMITTED: true');
console.log('PLANNED_FINAL_DIFF_RECORDED: true');
console.log('NETWORK_OR_DATA_WRITE: false');
