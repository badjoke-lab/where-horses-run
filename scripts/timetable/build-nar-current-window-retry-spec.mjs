import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { compileRunnerExecutionV1 } from './runner-compatibility.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const outputDirArg = argument('output-dir');
const requestedAt = argument('requested-at') ?? new Date().toISOString();
if (!outputDirArg) throw new Error('--output-dir=<path> is required');
const outputDir = path.resolve(outputDirArg);
const relativeOutput = path.relative(root, outputDir);
if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput))) {
  throw new Error('NAR current-window retry output must remain outside the repository');
}
if (Number.isNaN(Date.parse(requestedAt))) throw new Error('requested-at must be a valid date-time');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const policy = readJson('data/static/calendar-nar-current-window-retry-policy-v1.json');
const historicalDecision = readJson(policy.source_decision_ref);
const historicalResult = readJson(policy.source_result_ref);
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (policy.schema_version !== 'calendar-nar-current-window-retry-policy-v1') throw new Error('NAR current-window retry policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || policy.implementation_unit !== 'NAR-CURRENT-WINDOW-RETRY-01') throw new Error('NAR current-window retry policy identity differs');
if (historicalDecision.schema_version !== 'calendar-japan-current-window-decision-v1') throw new Error('Japan current-window decision schema differs');
if (historicalResult.schema_version !== 'calendar-nar-current-window-retry-result-v1') throw new Error('NAR historical retry result schema differs');
const narDecision = historicalDecision.systems.find((record) => record.system_id === 'japan-nar-system');
if (!narDecision || narDecision.decision !== 'run_selected_meeting_detail_retry' || narDecision.canonical_meeting_count !== 66 || narDecision.rank_counts?.C !== 66) {
  throw new Error('Japan current-window historical NAR decision differs');
}
if (policy.historical_campaign?.status !== 'completed'
  || policy.historical_campaign?.selection?.selected_meeting_count !== 66
  || policy.historical_campaign?.result?.a_plus_candidate_count !== 15
  || policy.historical_campaign?.result?.retained_c_retry_target_count !== 51) {
  throw new Error('NAR completed campaign policy differs');
}
if (historicalResult.result?.a_plus_candidate_count !== 15
  || historicalResult.result?.retry_target_count !== 51
  || historicalResult.result?.source_error_count !== 0) {
  throw new Error('NAR completed campaign result differs');
}

const remaining = policy.remaining_campaign;
if (remaining?.status !== 'manual_retry_available') throw new Error('NAR remaining campaign status differs');
const meetings = canonical.meetings
  .filter((meeting) => (
    meeting.country_id === remaining.selection.country_id
    && meeting.authority_id === remaining.selection.authority_id
    && meeting.capability_rank === remaining.selection.current_rank
    && meeting.date >= policy.window.start_date
    && meeting.date < policy.window.end_date_exclusive
  ))
  .sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
const meetingIds = meetings.map((meeting) => meeting.meeting_id);
if (new Set(meetingIds).size !== meetingIds.length) throw new Error('NAR remaining retry meeting IDs are not unique');
if (meetingIds.length !== remaining.selection.expected_meeting_count) throw new Error(`NAR remaining retry count differs: ${meetingIds.length}`);
if (meetings[0]?.date !== remaining.selection.expected_first_date || meetings.at(-1)?.date !== remaining.selection.expected_last_date) throw new Error('NAR remaining retry date boundary differs');
if (JSON.stringify([...meetingIds].sort()) !== JSON.stringify([...historicalResult.unresolved_meeting_ids].sort())) {
  throw new Error('NAR current C scope differs from the historical unresolved set');
}
const canonicalById = new Map(canonical.meetings.map((meeting) => [meeting.meeting_id, meeting]));
for (const id of historicalResult.resolved_meeting_ids) {
  if (canonicalById.get(id)?.capability_rank !== 'A+') throw new Error(`NAR promoted meeting is not A+: ${id}`);
}

const jobPolicy = remaining.job;
const job = {
  schema_version: 'calendar-collection-job-v1',
  job_id: jobPolicy.job_id,
  campaign_id: jobPolicy.campaign_id,
  system_id: jobPolicy.system_id,
  runner_policy: { mode: 'exact', runner: jobPolicy.runner },
  collection_mode: jobPolicy.collection_mode,
  requested_scope: { meeting_ids: meetingIds },
  rank_strategy: jobPolicy.rank_strategy,
  target_rank: jobPolicy.target_rank,
  reason: jobPolicy.reason,
  requested_at: requestedAt,
};
const execution = compileRunnerExecutionV1(job, { batch_id: jobPolicy.batch_id }, registry, compatibility);
if (execution.executor_id !== 'nar-incremental-v2-actions') throw new Error('NAR remaining retry executor differs');
if (execution.runner_used !== 'github_actions' || execution.collection_mode !== 'selected_meetings') throw new Error('NAR remaining retry execution route differs');
if (execution.target_rank !== 'A+' || execution.reason !== 'rank_upgrade_retry') throw new Error('NAR remaining retry execution target differs');
if (execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) throw new Error('NAR remaining retry execution safety boundary differs');

const scope = {
  schema_version: 'calendar-nar-current-window-retry-scope-v1',
  work_id: policy.work_id,
  implementation_unit: policy.implementation_unit,
  scope_kind: 'remaining_after_reviewed_promotion',
  canonical_generated_at: canonical.generated_at,
  source_decision_ref: policy.source_decision_ref,
  source_result_ref: policy.source_result_ref,
  window: structuredClone(policy.window),
  historical_selected_meeting_count: policy.historical_campaign.selection.selected_meeting_count,
  promoted_a_plus_meeting_count: historicalResult.resolved_meeting_ids.length,
  selected_meeting_count: meetingIds.length,
  first_meeting_date: meetings[0].date,
  last_meeting_date: meetings.at(-1).date,
  meeting_ids: meetingIds,
  existing_rank_counts: { C: meetingIds.length, B: 0, 'B+': 0, A: 0, 'A+': 0 },
  target_rank: 'A+',
  execution_policy: structuredClone(policy.execution_policy),
  side_effect_boundary: structuredClone(policy.side_effect_boundary),
};
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'collection-job.json'), `${JSON.stringify(job, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'runner-execution.json'), `${JSON.stringify(execution, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'retry-scope.json'), `${JSON.stringify(scope, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'meeting-ids.txt'), `${meetingIds.join('\n')}\n`);
console.log(JSON.stringify({
  schema_version: 'calendar-nar-current-window-retry-spec-summary-v1',
  work_id: policy.work_id,
  implementation_unit: policy.implementation_unit,
  scope_kind: scope.scope_kind,
  batch_id: jobPolicy.batch_id,
  historical_selected_meeting_count: scope.historical_selected_meeting_count,
  promoted_a_plus_meeting_count: scope.promoted_a_plus_meeting_count,
  selected_meeting_count: meetingIds.length,
  first_meeting_date: meetings[0].date,
  last_meeting_date: meetings.at(-1).date,
  target_rank: 'A+',
  executor_id: execution.executor_id,
  output_dir: outputDir,
  pull_request_live_fetch: false,
  manual_workflow_dispatch: true,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
