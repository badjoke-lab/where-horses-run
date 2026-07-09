import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const executionPath = args.get('--execution');
const statusPath = args.get('--status');
const batchRoot = args.get('--batch-root');
const outputPath = args.get('--output');
if (!executionPath || !statusPath || !batchRoot || !outputPath) {
  throw new Error('--execution, --status, --batch-root, and --output are required');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function digest(relativePath) {
  return createHash('sha256').update(fs.readFileSync(path.resolve(root, relativePath))).digest('hex');
}

const execution = readJson(executionPath);
const status = readJson(statusPath);
const candidatePath = path.join(batchRoot, 'candidates.json');
const coveragePath = path.join(batchRoot, 'coverage-observation.json');
const manifestPath = path.join(batchRoot, 'result-manifest.json');
const reviewQueuePath = path.join(batchRoot, 'review-queue.json');
const reportPath = path.join(batchRoot, 'collection-report.json');
const candidate = readJson(candidatePath);
const coverage = readJson(coveragePath);
const manifest = readJson(manifestPath);
const reviewQueue = readJson(reviewQueuePath);
const report = readJson(reportPath);

if (execution.system_id !== 'japan-banei-system') throw new Error('execution system differs');
if (execution.runner_used !== 'github_actions') throw new Error('execution runner differs');
if (execution.executor_id !== 'banei-schedule-detail-actions') throw new Error('execution executor differs');
if (execution.collection_mode !== 'selected_meetings') throw new Error('execution mode differs');
if (execution.reason !== 'rank_upgrade_retry') throw new Error('execution reason differs');
if (execution.rank_strategy !== 'target_rank' || execution.target_rank !== 'A+') throw new Error('execution target differs');
if (execution.requested_scope.meeting_ids.length !== 1) throw new Error('expected one selected meeting');
if (status.status !== 'success') throw new Error(`expected success status, got ${status.status}`);
if (status.job_id !== execution.job_id || status.batch_id !== execution.batch_id || status.runner_used !== execution.runner_used) throw new Error('status identity differs');
if (coverage.coverage_claim !== 'source_window_complete') throw new Error(`coverage incomplete: ${coverage.coverage_claim}`);
if (coverage.records_discovered !== 1 || coverage.records_updated !== 1) throw new Error('coverage record counts differ');
if (coverage.unresolved_meeting_ids.length !== 0 || coverage.source_errors.length !== 0) throw new Error('coverage unresolved/error state differs');
if (manifest.coverage_claim !== coverage.coverage_claim) throw new Error('manifest coverage differs');
if (manifest.records_discovered !== 1 || manifest.records_updated !== 1) throw new Error('manifest record counts differ');
if (JSON.stringify(manifest.rank_counts) !== JSON.stringify({ C: 0, B: 0, 'B+': 0, A: 0, 'A+': 1 })) throw new Error(`manifest rank counts differ: ${JSON.stringify(manifest.rank_counts)}`);
if (manifest.unresolved_meeting_ids.length !== 0 || manifest.source_errors.length !== 0) throw new Error('manifest unresolved/error state differs');
if (reviewQueue.entries.length !== 1) throw new Error('review queue entry count differs');
const reviewEntry = reviewQueue.entries[0];
if (reviewEntry.review_state !== 'review_ready' || reviewEntry.promotion_state !== 'not_ready') throw new Error('review queue initial state differs');
if (candidate.records.length !== 1) throw new Error('candidate meeting count differs');
const record = candidate.records[0];
if (record.meeting_id !== execution.requested_scope.meeting_ids[0]) throw new Error('candidate meeting identity differs');
if (record.capability_rank !== 'A+') throw new Error(`candidate rank differs: ${record.capability_rank}`);
if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length !== 12) throw new Error(`candidate row count differs: ${record.timetable_rows?.length}`);
if (!record.timetable_rows.every((row) => row.distance_m === 200 && row.surface === 'Dirt' && row.course_label === 'Banei Straight Course')) throw new Error('candidate row semantics differ');
if (report.publication_effect !== 'none') throw new Error('report publication effect differs');

const evidence = {
  schema_version: 'calendar-banei-retry-ops-evidence-v1',
  generated_at: candidate.generated_at,
  work_id: 'WHR-CAL-JAPAN-BANEI-A-PLUS',
  control_plane_work_id: 'WHR-CAL-ACQUISITION-CONTROL-PLANE',
  plan_id: 'banei-reviewed-retry-ops-001',
  campaign_id: execution.campaign_id,
  job_id: execution.job_id,
  batch_id: execution.batch_id,
  system_id: execution.system_id,
  runner_used: execution.runner_used,
  executor_id: execution.executor_id,
  collection_mode: execution.collection_mode,
  reason: execution.reason,
  rank_strategy: execution.rank_strategy,
  target_rank: execution.target_rank,
  meeting_id: record.meeting_id,
  meeting_date: record.date,
  status: status.status,
  observed_rank: record.capability_rank,
  race_row_count: record.timetable_rows.length,
  first_race_time_local: record.first_race_time_local,
  last_race_time_local: record.last_race_time_local,
  row_semantics: {
    all_rows_distance_200m: record.timetable_rows.every((row) => row.distance_m === 200),
    all_rows_surface_dirt: record.timetable_rows.every((row) => row.surface === 'Dirt'),
    all_rows_course_banei_straight: record.timetable_rows.every((row) => row.course_label === 'Banei Straight Course')
  },
  coverage: {
    claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    unresolved_meeting_count: coverage.unresolved_meeting_ids.length,
    source_error_count: coverage.source_errors.length
  },
  result_manifest: {
    rank_counts: manifest.rank_counts,
    unresolved_meeting_count: manifest.unresolved_meeting_ids.length,
    source_error_count: manifest.source_errors.length
  },
  review_queue: {
    entry_count: reviewQueue.entries.length,
    review_state: reviewEntry.review_state,
    promotion_state: reviewEntry.promotion_state
  },
  artifact_digests_sha256: {
    status: digest(statusPath),
    candidate: digest(candidatePath),
    coverage_observation: digest(coveragePath),
    result_manifest: digest(manifestPath),
    review_queue: digest(reviewQueuePath),
    collection_report: digest(reportPath)
  },
  boundaries: {
    scheduler_automatic_execution: false,
    automatic_approval: false,
    promotion_performed: false,
    canonical_write_performed: false,
    public_write_performed: false,
    publication_performed: false,
    deployment_performed: false,
    raw_source_storage: false
  }
};

const serialized = JSON.stringify(evidence).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`"${forbidden}"`)) throw new Error(`forbidden evidence key: ${forbidden}`);
}

const absolute = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, absolute),
  plan_id: evidence.plan_id,
  job_id: evidence.job_id,
  status: evidence.status,
  observed_rank: evidence.observed_rank,
  race_row_count: evidence.race_row_count,
  coverage: evidence.coverage.claim,
  review_state: evidence.review_queue.review_state,
  publication_effect: 'none'
}));
