import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const scheduleCandidatePath = args.get('--schedule-candidate');
const scheduleReportPath = args.get('--schedule-report');
const selectedRoot = args.get('--selected-root');
const outputPath = args.get('--output');
if (!scheduleCandidatePath || !scheduleReportPath || !selectedRoot || !outputPath) {
  throw new Error('--schedule-candidate, --schedule-report, --selected-root, and --output are required');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function digest(relativePath) {
  return createHash('sha256').update(fs.readFileSync(path.resolve(root, relativePath))).digest('hex');
}

const scheduleCandidate = readJson(scheduleCandidatePath);
const scheduleReport = readJson(scheduleReportPath);
const selectedCandidatePath = path.join(selectedRoot, 'candidate.json');
const selectedCoveragePath = path.join(selectedRoot, 'coverage-observation.json');
const selectedReportPath = path.join(selectedRoot, 'collection-report.json');
const selectedCandidate = readJson(selectedCandidatePath);
const selectedCoverage = readJson(selectedCoveragePath);
const selectedReport = readJson(selectedReportPath);

if (scheduleCandidate.schema_version !== 'banei-full-month-candidate-set-v1') throw new Error('schedule candidate schema differs');
if (scheduleReport.schema_version !== 'banei-full-month-collection-report-v1') throw new Error('schedule report schema differs');
if (scheduleReport.target_month !== '2026-07') throw new Error('schedule target month differs');
if (scheduleReport.meetings_scheduled !== 12) throw new Error(`schedule meeting count differs: ${scheduleReport.meetings_scheduled}`);
if (scheduleReport.schedule_scope_complete !== true || scheduleReport.partial_cutoff_completion_allowed !== false) {
  throw new Error('schedule completion boundary differs');
}
if (scheduleReport.publication_effect !== 'none') throw new Error('schedule publication effect differs');
if (scheduleCandidate.meetings.length !== 12) throw new Error('schedule candidate meeting count differs');
if (scheduleCandidate.review?.status !== 'needs_review'
  || scheduleCandidate.review?.promotion_eligible !== false
  || scheduleCandidate.review?.canonical_write !== 'disabled'
  || scheduleCandidate.review?.public_write !== 'disabled'
  || scheduleCandidate.review?.raw_source_storage !== 'disabled') {
  throw new Error('schedule review boundary differs');
}

if (selectedCandidate.schema_version !== 'timetable-candidate-v1') throw new Error('selected candidate schema differs');
if (selectedCandidate.records.length !== 1) throw new Error(`selected candidate count differs: ${selectedCandidate.records.length}`);
const selectedRecord = selectedCandidate.records[0];
if (selectedRecord.meeting_id !== 'banei-obihiro-racecourse-2026-07-04') throw new Error('selected meeting ID differs');
if (selectedRecord.capability_rank !== 'A+') throw new Error(`selected rank differs: ${selectedRecord.capability_rank}`);
if (selectedRecord.timetable_rows.length !== 12) throw new Error(`selected row count differs: ${selectedRecord.timetable_rows.length}`);
if (!selectedRecord.timetable_rows.every((row) => row.distance_m === 200
  && row.surface === 'Dirt'
  && row.course_label === 'Banei Straight Course')) {
  throw new Error('selected Banei row semantics differ');
}
if (selectedCoverage.collection_mode !== 'selected_meetings') throw new Error('selected Coverage mode differs');
if (selectedCoverage.coverage_claim !== 'source_window_complete') throw new Error('selected Coverage claim differs');
if (selectedCoverage.records_discovered !== 1 || selectedCoverage.records_updated !== 1) throw new Error('selected Coverage record counts differ');
if (selectedCoverage.unresolved_dates.length !== 0
  || selectedCoverage.unresolved_meeting_ids.length !== 0
  || selectedCoverage.source_errors.length !== 0) {
  throw new Error('selected Coverage unresolved/error state differs');
}
if (selectedReport.collection_mode !== 'selected_meetings'
  || selectedReport.meetings_targeted !== 1
  || selectedReport.complete_a_plus_candidates !== 1
  || selectedReport.blocked_meetings !== 0) {
  throw new Error('selected execution report differs');
}
if (selectedReport.publication_effect !== 'none'
  || selectedReport.promotion_eligible_candidates !== 0
  || selectedReport.canonical_write !== 'disabled'
  || selectedReport.public_write !== 'disabled'
  || selectedReport.raw_source_storage !== 'disabled') {
  throw new Error('selected execution side-effect boundary differs');
}

const evidence = {
  schema_version: 'calendar-banei-runner-selected-evidence-v1',
  generated_at: new Date().toISOString(),
  work_id: 'WHR-CAL-JAPAN-BANEI-A-PLUS',
  system_id: 'japan-banei-system',
  execution_environment: 'github_actions',
  schedule_evidence: {
    source_id: scheduleCandidate.source.source_id,
    source_url: scheduleCandidate.source.official_schedule_url,
    target_month: scheduleReport.target_month,
    month_start: scheduleReport.month_start,
    month_end: scheduleReport.month_end,
    meetings_scheduled: scheduleReport.meetings_scheduled,
    meeting_dates: scheduleReport.meeting_dates,
    time_summary_available: scheduleReport.time_summary_available,
    pending_detail_meetings: scheduleReport.pending_detail_meetings,
    schedule_scope_complete: scheduleReport.schedule_scope_complete,
    partial_cutoff_completion_allowed: scheduleReport.partial_cutoff_completion_allowed,
    review_status: scheduleCandidate.review.status,
    publication_effect: scheduleReport.publication_effect
  },
  selected_detail_evidence: {
    source_id: selectedCandidate.source_id,
    adapter_id: selectedCandidate.adapter_id,
    meeting_id: selectedRecord.meeting_id,
    meeting_date: selectedRecord.date,
    observed_rank: selectedRecord.capability_rank,
    race_row_count: selectedRecord.timetable_rows.length,
    first_race_time_local: selectedRecord.first_race_time_local,
    last_race_time_local: selectedRecord.last_race_time_local,
    scope_mode: selectedCoverage.collection_mode,
    coverage_claim: selectedCoverage.coverage_claim,
    records_discovered: selectedCoverage.records_discovered,
    records_updated: selectedCoverage.records_updated,
    unresolved_meeting_count: selectedCoverage.unresolved_meeting_ids.length,
    source_error_count: selectedCoverage.source_errors.length,
    blocked_meetings: selectedReport.blocked_meetings,
    publication_effect: selectedReport.publication_effect
  },
  runner_convergence: {
    same_execution_environment: true,
    schedule_live_success: true,
    selected_detail_live_success: true,
    date_window_detail_live_success_already_recorded: true,
    evidence_supports_github_actions_primary_candidate: true,
    fallback_policy_requires_separate_decision: true
  },
  artifact_digests_sha256: {
    schedule_candidate: digest(scheduleCandidatePath),
    schedule_report: digest(scheduleReportPath),
    selected_candidate: digest(selectedCandidatePath),
    selected_coverage_observation: digest(selectedCoveragePath),
    selected_collection_report: digest(selectedReportPath)
  },
  boundaries: {
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
  if (serialized.includes(`\"${forbidden}\"`)) throw new Error(`forbidden evidence key: ${forbidden}`);
}

const absolute = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, absolute),
  execution_environment: evidence.execution_environment,
  schedule_meetings: evidence.schedule_evidence.meetings_scheduled,
  selected_meeting: evidence.selected_detail_evidence.meeting_id,
  selected_rank: evidence.selected_detail_evidence.observed_rank,
  selected_rows: evidence.selected_detail_evidence.race_row_count,
  runner_convergence_candidate: evidence.runner_convergence.evidence_supports_github_actions_primary_candidate
}));
