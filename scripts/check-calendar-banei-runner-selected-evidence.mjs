import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = path.join(root, 'data/fixtures/calendar-banei-runner-selected-evidence-v1.json');
if (!fs.existsSync(evidencePath)) {
  console.error('BANEI_RUNNER_SELECTED_EVIDENCE: missing evidence file');
  process.exit(1);
}
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (evidence.schema_version !== 'calendar-banei-runner-selected-evidence-v1') fail('schema_version differs');
if (evidence.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('work_id differs');
if (evidence.system_id !== 'japan-banei-system') fail('system_id differs');
if (evidence.execution_environment !== 'github_actions') fail('execution environment differs');

const schedule = evidence.schedule_evidence;
if (schedule?.source_id !== 'banei-official-schedule') fail('schedule source differs');
if (schedule?.target_month !== '2026-07') fail('schedule target month differs');
if (schedule?.month_start !== '2026-07-01' || schedule?.month_end !== '2026-07-31') fail('schedule month boundary differs');
if (schedule?.meetings_scheduled !== 12) fail(`schedule meeting count differs: ${schedule?.meetings_scheduled}`);
if (!Array.isArray(schedule?.meeting_dates) || schedule.meeting_dates.length !== 12) fail('schedule meeting-date count differs');
if (new Set(schedule?.meeting_dates ?? []).size !== 12) fail('schedule meeting dates contain duplicates');
if (schedule?.schedule_scope_complete !== true) fail('schedule scope must be complete');
if (schedule?.partial_cutoff_completion_allowed !== false) fail('partial cutoff must remain disallowed');
if (schedule?.review_status !== 'needs_review') fail('schedule review status differs');
if (schedule?.publication_effect !== 'none') fail('schedule publication effect differs');

const selected = evidence.selected_detail_evidence;
if (selected?.source_id !== 'nar-banei-race-list-deba-table') fail('selected source differs');
if (selected?.adapter_id !== 'banei-nar-race-list-detail-v1') fail('selected adapter differs');
if (selected?.meeting_id !== 'banei-obihiro-racecourse-2026-07-04') fail('selected meeting ID differs');
if (selected?.observed_rank !== 'A+') fail('selected rank must be A+');
if (selected?.race_row_count !== 12) fail(`selected race row count differs: ${selected?.race_row_count}`);
if (selected?.scope_mode !== 'selected_meetings') fail('selected scope mode differs');
if (selected?.coverage_claim !== 'source_window_complete') fail('selected coverage differs');
if (selected?.records_discovered !== 1 || selected?.records_updated !== 1) fail('selected record counts differ');
if (selected?.unresolved_meeting_count !== 0 || selected?.source_error_count !== 0 || selected?.blocked_meetings !== 0) {
  fail('selected unresolved/source-error/blocker counts must be zero');
}
if (selected?.publication_effect !== 'none') fail('selected publication effect differs');

const convergence = evidence.runner_convergence;
for (const key of ['same_execution_environment', 'schedule_live_success', 'selected_detail_live_success', 'date_window_detail_live_success_already_recorded', 'evidence_supports_github_actions_primary_candidate', 'fallback_policy_requires_separate_decision']) {
  if (convergence?.[key] !== true) fail(`runner_convergence.${key} must be true`);
}

if (Object.keys(evidence.artifact_digests_sha256 ?? {}).length !== 5) fail('artifact digest count differs');
for (const [key, digest] of Object.entries(evidence.artifact_digests_sha256 ?? {})) {
  if (!/^[0-9a-f]{64}$/.test(digest)) fail(`artifact digest invalid for ${key}`);
}
for (const [key, value] of Object.entries(evidence.boundaries ?? {})) {
  if (value !== false) fail(`boundary ${key} must be false`);
}
if (Object.keys(evidence.boundaries ?? {}).length !== 7) fail('boundary key count differs');

const serialized = JSON.stringify(evidence).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) fail(`forbidden evidence key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`BANEI_RUNNER_SELECTED_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('BANEI_RUNNER_SELECTED_EVIDENCE: pass');
console.log(`EXECUTION_ENVIRONMENT: ${evidence.execution_environment}`);
console.log(`SCHEDULE_MEETINGS: ${schedule.meetings_scheduled}`);
console.log(`SELECTED_MEETING: ${selected.meeting_id}`);
console.log(`SELECTED_RANK: ${selected.observed_rank}`);
console.log(`SELECTED_ROWS: ${selected.race_row_count}`);
console.log('RUNNER_CONVERGENCE_CANDIDATE: github_actions');
