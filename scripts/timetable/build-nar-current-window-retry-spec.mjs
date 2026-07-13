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
const decision = readJson(policy.source_decision_ref);
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (policy.schema_version !== 'calendar-nar-current-window-retry-policy-v1') throw new Error('NAR current-window retry policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || policy.implementation_unit !== 'NAR-CURRENT-WINDOW-RETRY-01') throw new Error('NAR current-window retry policy identity differs');
if (decision.schema_version !== 'calendar-japan-current-window-decision-v1') throw new Error('Japan current-window decision schema differs');
const narDecision = decision.systems.find((record) => record.system_id === 'japan-nar-system');
if (!narDecision || narDecision.decision !== 'run_selected_meeting_detail_retry') throw new Error('Japan current-window decision does not authorize NAR selected retry preparation');

const meetings = canonical.meetings
  .filter((meeting) => (
    meeting.country_id === policy.selection.country_id
    && meeting.authority_id === policy.selection.authority_id
    && meeting.capability_rank === policy.selection.current_rank
    && meeting.date >= policy.window.start_date
    && meeting.date < policy.window.end_date_exclusive
  ))
  .sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
const meetingIds = meetings.map((meeting) => meeting.meeting_id);
if (new Set(meetingIds).size !== meetingIds.length) throw new Error('NAR selected retry meeting IDs are not unique');
if (meetingIds.length !== policy.selection.expected_meeting_count) throw new Error(`NAR selected retry count differs: ${meetingIds.length}`);
if (meetings[0]?.date !== policy.selection.expected_first_date || meetings.at(-1)?.date !== policy.selection.expected_last_date) throw new Error('NAR selected retry date boundary differs');
if (narDecision.canonical_meeting_count !== meetingIds.length || narDecision.rank_counts?.C !== meetingIds.length) throw new Error('NAR selected retry scope differs from recorded decision');

const job = {
  schema_version: 'calendar-collection-job-v1',
  job_id: policy.job.job_id,
  campaign_id: policy.job.campaign_id,
  system_id: policy.job.system_id,
  runner_policy: { mode: 'exact', runner: policy.job.runner },
  collection_mode: policy.job.collection_mode,
  requested_scope: { meeting_ids: meetingIds },
  rank_strategy: policy.job.rank_strategy,
  target_rank: policy.job.target_rank,
  reason: policy.job.reason,
  requested_at: requestedAt,
};
const execution = compileRunnerExecutionV1(job, { batch_id: policy.job.batch_id }, registry, compatibility);
if (execution.executor_id !== 'nar-incremental-v2-actions') throw new Error('NAR current-window executor differs');
if (execution.runner_used !== 'github_actions' || execution.collection_mode !== 'selected_meetings') throw new Error('NAR current-window execution route differs');
if (execution.target_rank !== 'A+' || execution.reason !== 'rank_upgrade_retry') throw new Error('NAR current-window execution target differs');
if (execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) throw new Error('NAR current-window execution safety boundary differs');

const scope = {
  schema_version: 'calendar-nar-current-window-retry-scope-v1',
  work_id: policy.work_id,
  implementation_unit: policy.implementation_unit,
  canonical_generated_at: canonical.generated_at,
  source_decision_ref: policy.source_decision_ref,
  window: structuredClone(policy.window),
  selected_meeting_count: meetingIds.length,
  first_meeting_date: meetings[0].date,
  last_meeting_date: meetings.at(-1).date,
  meeting_ids: meetingIds,
  existing_rank_counts: { C: meetingIds.length, B: 0, 'B+': 0, A: 0, 'A+': 0 },
  target_rank: 'A+',
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
  batch_id: policy.job.batch_id,
  selected_meeting_count: meetingIds.length,
  first_meeting_date: meetings[0].date,
  last_meeting_date: meetings.at(-1).date,
  target_rank: 'A+',
  executor_id: execution.executor_id,
  output_dir: outputDir,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
