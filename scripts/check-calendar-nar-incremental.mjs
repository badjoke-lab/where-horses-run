import fs from 'node:fs';
import path from 'node:path';
import { NAR_INCREMENTAL_PATHS } from './timetable/nar-incremental-core.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';

const root = process.cwd();
const allowEmpty = process.argv.includes('--allow-empty');
const errors = [];
const fail = (message) => errors.push(message);
const files = Object.values(NAR_INCREMENTAL_PATHS);
const existing = files.filter((file) => fs.existsSync(path.join(root, file)));

if (existing.length === 0 && allowEmpty) {
  console.log('CALENDAR_NAR_INCREMENTAL: empty-allowed');
  process.exit(0);
}
if (existing.length !== files.length) fail('incremental output set is incomplete.');

if (existing.length === files.length) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const candidates = read(NAR_INCREMENTAL_PATHS.candidates);
  const report = read(NAR_INCREMENTAL_PATHS.report);
  const coverage = read(NAR_INCREMENTAL_PATHS.coverage);
  const retries = read(NAR_INCREMENTAL_PATHS.retries);

  if (candidates.schema_version !== 'nar-incremental-meeting-candidates-v1') fail('candidate schema differs.');
  if (report.schema_version !== 'nar-incremental-collection-report-v1') fail('report schema differs.');
  if (retries.schema_version !== 'nar-incremental-retry-targets-v1') fail('retry schema differs.');
  if (candidates.generated_at !== report.generated_at || report.generated_at !== coverage.checked_at || coverage.checked_at !== retries.generated_at) fail('artifact timestamps differ.');
  if (candidates.collection_mode !== report.collection_mode || report.collection_mode !== coverage.collection_mode) fail('collection mode differs.');
  if (JSON.stringify(candidates.requested_scope) !== JSON.stringify(report.requested_scope)) fail('candidate/report requested scope differs.');
  if (JSON.stringify(report.requested_scope) !== JSON.stringify(coverage.requested_scope)) fail('report/coverage requested scope differs.');
  if (JSON.stringify(coverage.unresolved_dates) !== JSON.stringify(retries.date_targets)) fail('coverage/retry date targets differ.');
  if (JSON.stringify(coverage.unresolved_meeting_ids) !== JSON.stringify(retries.meeting_targets)) fail('coverage/retry meeting targets differ.');
  if (candidates.review?.status !== 'needs_review' || candidates.review?.promotion_eligible !== false) fail('candidate review boundary differs.');
  if (candidates.review?.canonical_write !== 'disabled' || candidates.review?.public_write !== 'disabled' || candidates.review?.raw_source_storage !== 'disabled') fail('candidate write boundary differs.');
  if (report.publication_effect !== 'none' || report.canonical_write !== 'disabled' || report.public_write !== 'disabled') fail('report write boundary differs.');
  if (retries.scheduled_retry !== 'disabled' || retries.canonical_write !== 'disabled' || retries.public_write !== 'disabled') fail('retry write boundary differs.');

  const result = validateCoverageObservation(coverage);
  if (!result.valid) fail(`Coverage Observation invalid: ${result.errors.join(' | ')}`);

  const ids = new Set();
  for (const meeting of candidates.meetings ?? []) {
    if (meeting.schema_version !== 'nar-incremental-meeting-candidate-v1') fail(`meeting schema differs: ${meeting.candidate_id}.`);
    if (ids.has(meeting.candidate_id)) fail(`duplicate candidate: ${meeting.candidate_id}.`);
    ids.add(meeting.candidate_id);
  }
}

const operatorSource = fs.readFileSync(path.join(root, 'scripts/timetable/collect-nar-incremental.mjs'), 'utf8');
for (const marker of ['normalize-nar-monthly-schedule-fetch.mjs', 'aggregateMonthlyScratch', 'buildIncrementalArtifacts', 'restore(scratchCandidatePath', 'restore(scratchReportPath']) {
  if (!operatorSource.includes(marker)) fail(`operator missing ${marker}.`);
}
for (const forbidden of ['data/generated/timetable/canonical/', 'data/generated/timetable/public/']) {
  if (operatorSource.includes(forbidden)) fail(`operator crosses publication boundary with ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_INCREMENTAL: pass');
console.log('COVERAGE_OBSERVATION: validated');
console.log('RETRY_TARGETS: synchronized');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
