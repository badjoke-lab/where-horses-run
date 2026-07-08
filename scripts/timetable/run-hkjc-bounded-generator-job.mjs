import fs from 'node:fs';
import path from 'node:path';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';

const root = process.cwd();
const arg = process.argv.find((item) => item.startsWith('--execution='));
if (!arg) throw new Error('--execution=<path> is required');
const checkOnly = process.argv.includes('--check-only');
const executionPath = arg.slice('--execution='.length);
const execution = JSON.parse(fs.readFileSync(path.resolve(root, executionPath), 'utf8'));

if (execution.schema_version !== 'calendar-runner-execution-v1') throw new Error('execution schema mismatch');
if (execution.system_id !== 'hong-kong-hkjc-system') throw new Error('HKJC bounded executor requires hong-kong-hkjc-system');
if (execution.runner_used !== 'github_actions') throw new Error('HKJC bounded Actions executor requires github_actions runner');
if (execution.executor_id !== 'hkjc-bounded-generator-actions') throw new Error('HKJC executor_id mismatch');
if (execution.collection_mode !== 'date_window') throw new Error('HKJC bounded executor supports date_window only');
if (execution.source_route.schedule_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') throw new Error('HKJC schedule adapter mismatch');

const source = JSON.parse(fs.readFileSync(path.join(root, 'data/candidates/hong-kong-hkjc-candidates.json'), 'utf8'));
if (source.source_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') throw new Error('HKJC bounded source adapter mismatch');

const requested = execution.requested_scope;
const sourceWindow = source.candidate_window;
const overlapStart = requested.start_date > sourceWindow.start_date ? requested.start_date : sourceWindow.start_date;
const overlapEnd = requested.end_date_exclusive < sourceWindow.end_date_exclusive
  ? requested.end_date_exclusive
  : sourceWindow.end_date_exclusive;
const hasOverlap = overlapStart < overlapEnd;
const fullyCovered = requested.start_date >= sourceWindow.start_date
  && requested.end_date_exclusive <= sourceWindow.end_date_exclusive;

const records = hasOverlap
  ? (source.records ?? [])
      .filter((record) => requested.start_date <= record.date && record.date < requested.end_date_exclusive)
      .map((record) => ({
        meeting_id: `hkjc-${record.racecourse_id}-${record.date}`,
        date: record.date,
        racecourse_id: record.racecourse_id,
        capability_rank: 'C',
        source_id: 'hkjc-fixture-list',
      }))
      .sort((a, b) => a.meeting_id.localeCompare(b.meeting_id))
  : [];

const sourceErrors = fullyCovered
  ? []
  : [{
      code: 'source_unavailable',
      scope_ref: 'requested_scope',
      message: `Bounded HKJC dry-run source window ${sourceWindow.start_date}..${sourceWindow.end_date_exclusive} does not fully cover the requested Job window.`,
    }];

let observedScope;
let coverageClaim;
if (!hasOverlap) {
  observedScope = { kind: 'not_observed', timezone: requested.timezone };
  coverageClaim = 'none';
} else if (fullyCovered) {
  observedScope = {
    kind: 'date_window',
    start_date: requested.start_date,
    end_date_exclusive: requested.end_date_exclusive,
    timezone: requested.timezone,
  };
  coverageClaim = 'source_window_complete';
} else {
  observedScope = {
    kind: 'source_visible_horizon',
    start_date: overlapStart,
    end_date_exclusive: overlapEnd,
    timezone: requested.timezone,
  };
  coverageClaim = 'partial';
}

const outputDirRelative = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
const outputDir = path.join(root, outputDirRelative);
const candidateRef = `${outputDirRelative}/candidates.json`;
const coverageRef = `${outputDirRelative}/coverage-observation.json`;
const manifestRef = `${outputDirRelative}/result-manifest.json`;
const reportRef = `${outputDirRelative}/collection-report.json`;

const candidate = {
  schema_version: 'calendar-actions-hkjc-bounded-candidates-v1',
  batch_id: execution.batch_id,
  system_id: execution.system_id,
  requested_scope: requested,
  source_window: sourceWindow,
  records,
  publication_effect: 'none',
};

const coverage = {
  schema_version: 'calendar-coverage-observation-v1',
  run_id: execution.batch_id,
  system_id: execution.system_id,
  source_id: 'hkjc-fixture-list',
  checked_at: source.generated_at,
  requested_scope: {
    kind: 'date_window',
    start_date: requested.start_date,
    end_date_exclusive: requested.end_date_exclusive,
    timezone: requested.timezone,
  },
  observed_scope: observedScope,
  collection_mode: 'date_window',
  records_discovered: records.length,
  records_updated: records.length,
  unresolved_dates: [],
  unresolved_meeting_ids: [],
  source_errors: sourceErrors,
  coverage_claim: coverageClaim,
  completion_audit_ref: null,
};

const manifest = {
  schema_version: 'calendar-collection-result-manifest-v1',
  campaign_id: execution.campaign_id,
  job_id: execution.job_id,
  batch_id: execution.batch_id,
  system_id: execution.system_id,
  runner_used: execution.runner_used,
  requested_scope: requested,
  observed_scope: observedScope,
  coverage_claim: coverageClaim,
  records_discovered: records.length,
  records_updated: records.length,
  rank_counts: {
    C: records.length,
    B: 0,
    'B+': 0,
    A: 0,
    'A+': 0,
  },
  unresolved_dates: [],
  unresolved_meeting_ids: [],
  source_errors: sourceErrors,
  artifact_refs: {
    candidate_ref: candidateRef,
    coverage_observation_ref: coverageRef,
    collection_report_ref: reportRef,
  },
};

const coverageValidation = validateCoverageObservation(coverage);
if (!coverageValidation.valid) throw new Error(`HKJC Coverage invalid: ${coverageValidation.errors.join('; ')}`);
const manifestErrors = validateCollectionResultManifestV1(manifest);
if (manifestErrors.length) throw new Error(`HKJC Manifest invalid: ${manifestErrors.join('; ')}`);

const report = {
  schema_version: 'calendar-actions-hkjc-bounded-report-v1',
  batch_id: execution.batch_id,
  system_id: execution.system_id,
  requested_scope: requested,
  source_window: sourceWindow,
  records_discovered: records.length,
  source_error_count: sourceErrors.length,
  coverage_claim: coverageClaim,
  candidate_ref: candidateRef,
  coverage_observation_ref: coverageRef,
  result_manifest_ref: manifestRef,
  publication_effect: 'none',
};

if (!checkOnly) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [file, value] of [
    ['candidates.json', candidate],
    ['coverage-observation.json', coverage],
    ['result-manifest.json', manifest],
    ['collection-report.json', report],
  ]) {
    fs.writeFileSync(path.join(outputDir, file), `${JSON.stringify(value, null, 2)}\n`);
  }
}

console.log(JSON.stringify({
  batch_id: execution.batch_id,
  coverage_claim: coverageClaim,
  records_discovered: records.length,
  source_error_count: sourceErrors.length,
  output_dir: outputDirRelative,
  check_only: checkOnly,
}));
