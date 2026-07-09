import fs from 'node:fs';
import path from 'node:path';
import { buildBaneiControlPlaneBridgeV1 } from './timetable/banei-control-plane-bridge.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1, validateCollectionResultManifestAgainstCoverageV1 } from './timetable/collection-result-manifest-validation.mjs';
import { validateReviewQueueV1, validateReviewQueueEntryAgainstManifestV1 } from './timetable/review-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixture = readJson('data/fixtures/calendar-banei-control-plane-bridge-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const control = readJson('data/static/banei-pilot-control.json');

let output = null;
try {
  output = buildBaneiControlPlaneBridgeV1(fixture);
} catch (error) {
  fail(`Banei bridge build failed: ${error.message}`);
}

if (output) {
  if (output.schema_version !== 'calendar-banei-control-plane-bridge-v1') fail('bridge schema_version differs.');
  if (output.system_id !== 'japan-banei-system') fail('bridge system_id differs.');
  if (output.target_rank !== 'A+') fail('bridge target rank must remain A+.');

  const candidate = output.candidate;
  if (candidate.schema_version !== 'timetable-candidate-v1') fail('shared candidate schema differs.');
  if (candidate.adapter_id !== 'japan-banei-dry-run-adapter') fail('Banei adapter ID differs.');
  if (candidate.review?.status !== 'needs_review') fail('candidate review status must remain needs_review.');
  if (candidate.records.length !== 3) fail(`fixture candidate count differs: ${candidate.records.length}`);
  const ranks = candidate.records.map((record) => record.capability_rank);
  if (!exact(ranks, ['C', 'B', 'B+'])) fail(`Banei fixture rank classification differs: ${JSON.stringify(ranks)}`);
  if (candidate.records.some((record) => ['A', 'A+'].includes(record.capability_rank))) fail('schedule bridge must not infer A or A+.');
  for (const record of candidate.records) {
    if (record.timetable_rows.length !== 0) fail(`${record.meeting_id}: schedule bridge timetable_rows must be empty.`);
    if (record.review_status !== 'needs_review') fail(`${record.meeting_id}: review_status must remain needs_review.`);
    if (record.source.extraction_method !== 'adapter_candidate') fail(`${record.meeting_id}: extraction_method differs.`);
  }

  const coverage = output.coverage_observation;
  const coverageValidation = validateCoverageObservation(coverage);
  if (!coverageValidation.valid) fail(`Coverage Observation invalid: ${coverageValidation.errors.join('; ')}`);
  if (coverage.coverage_claim !== 'partial') fail('fixture coverage must be partial while A+ target remains unresolved.');
  if (coverage.records_discovered !== 3 || coverage.records_updated !== 3) fail('Coverage record counts differ.');
  if (coverage.unresolved_meeting_ids.length !== 3) fail('all schedule-layer fixture meetings must remain unresolved against A+ target.');
  if (coverage.source_errors.length !== 0) fail('fixture source errors must be empty.');

  const manifest = output.result_manifest;
  const manifestErrors = [
    ...validateCollectionResultManifestV1(manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(manifest, coverage),
  ];
  if (manifestErrors.length) fail(`Result Manifest invalid: ${manifestErrors.join('; ')}`);
  if (!exact(manifest.rank_counts, { C: 1, B: 1, 'B+': 1, A: 0, 'A+': 0 })) fail(`Manifest rank counts differ: ${JSON.stringify(manifest.rank_counts)}`);
  if (manifest.runner_used !== 'reviewed_import') fail('bridge manifest runner must remain reviewed_import until runner testing changes Registry policy.');

  const queue = output.review_queue;
  const queueErrors = validateReviewQueueV1(queue);
  if (queueErrors.length) fail(`Review Queue invalid: ${queueErrors.join('; ')}`);
  if (queue.entries.length !== 1) fail('bridge Review Queue must contain one batch entry.');
  else {
    const entryErrors = validateReviewQueueEntryAgainstManifestV1(queue.entries[0], manifest);
    if (entryErrors.length) fail(`Review Queue entry differs from Manifest: ${entryErrors.join('; ')}`);
    if (queue.entries[0].review_state !== 'review_ready' || queue.entries[0].promotion_state !== 'not_ready') fail('Review Queue initial state differs.');
  }

  if (output.retry_activation.state !== 'blocked_pending_detail_adapter_and_registry_support') fail('Retry activation state differs.');
  if (output.retry_activation.automatic_retry_queue_write !== false) fail('automatic Retry Queue write must remain disabled.');
  if (output.retry_activation.unresolved_meeting_count !== 3) fail('retry blocker unresolved count differs.');
  if (Object.values(output.boundaries).some((value) => value !== false)) fail('bridge side-effect boundary enabled.');
}

const baneiProfile = registry.records.find((record) => record.system_id === 'japan-banei-system');
if (!baneiProfile) fail('Banei Registry profile missing.');
else {
  if (baneiProfile.profile_status !== 'provisional') fail('Banei Registry profile must remain provisional in bridge stage.');
  if (baneiProfile.primary_runner !== 'reviewed_import') fail('Banei bridge stage must not silently change primary runner.');
  if (baneiProfile.detail_adapter_id !== null) fail('Banei detail adapter must remain null until source-specific detail implementation exists.');
  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until Registry support is implemented.');
}

if (control.monthly_scope?.expected_meeting_dates?.length !== 12) fail('Banei July control must retain twelve expected meeting dates.');
if (control.monthly_scope?.full_calendar_month_required !== true || control.monthly_scope?.partial_cutoff_completion_allowed !== false) fail('Banei full-month Completion Audit boundary differs.');
if (control.field_semantics?.flat_racing_surface_assumptions_allowed !== false) fail('Banei flat-racing surface assumption boundary differs.');
if (control.field_semantics?.flat_racing_course_direction_assumptions_allowed !== false) fail('Banei flat-racing course direction boundary differs.');

for (const mutation of [
  {
    name: 'last-without-first',
    apply(value) {
      value.meetings[0].last_race_time_local = '20:00';
    },
  },
  {
    name: 'identity-drift',
    apply(value) {
      value.meetings[0].racing_system_id = 'japan-nar-system';
    },
  },
  {
    name: 'window-drift',
    apply(value) {
      value.meetings[0].date = '2026-08-05';
    },
  },
]) {
  const changed = structuredClone(fixture);
  mutation.apply(changed);
  let rejected = false;
  try {
    buildBaneiControlPlaneBridgeV1(changed);
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`invalid bridge case unexpectedly passed: ${mutation.name}`);
}

const docs = readText('docs/calendar/banei-control-plane-bridge.md');
for (const phrase of [
  'C / B / B+',
  'A and A+ are not inferred',
  'Coverage Observation',
  'Collection Result Manifest',
  'Review Queue',
  'Retry Queue activation remains blocked',
  'reviewed_import',
  'flat-racing assumptions',
]) {
  if (!docs.includes(phrase)) fail(`Banei bridge contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_CONTROL_PLANE_BRIDGE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_CONTROL_PLANE_BRIDGE: pass');
console.log('FIXTURE_RANKS: C=1 B=1 B+=1 A=0 A+=0');
console.log('COVERAGE: partial / unresolved=3');
console.log('RESULT_MANIFEST: pass');
console.log('REVIEW_QUEUE: review_ready / not_ready');
console.log('RETRY_ACTIVATION: blocked');
console.log('REGISTRY_PROFILE: provisional / reviewed_import');
console.log('SIDE_EFFECT_BOUNDARY: pass');
