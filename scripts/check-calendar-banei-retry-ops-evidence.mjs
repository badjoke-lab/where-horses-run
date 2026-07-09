import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = path.join(root, 'data/fixtures/calendar-banei-retry-ops-evidence-v1.json');
if (!fs.existsSync(evidencePath)) {
  console.error('BANEI_RETRY_OPS_EVIDENCE: missing evidence file');
  process.exit(1);
}
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

if (evidence.schema_version !== 'calendar-banei-retry-ops-evidence-v1') fail('schema_version differs');
if (evidence.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('work_id differs');
if (evidence.control_plane_work_id !== 'WHR-CAL-ACQUISITION-CONTROL-PLANE') fail('control_plane_work_id differs');
if (evidence.plan_id !== 'banei-reviewed-retry-ops-001') fail('plan_id differs');
if (evidence.campaign_id !== 'banei-reviewed-retry-operations') fail('campaign_id differs');
if (evidence.job_id !== 'banei-reviewed-retry-job-001') fail('job_id differs');
if (evidence.system_id !== 'japan-banei-system') fail('system_id differs');
if (evidence.runner_used !== 'github_actions') fail('runner differs');
if (evidence.executor_id !== 'banei-schedule-detail-actions') fail('executor differs');
if (evidence.collection_mode !== 'selected_meetings') fail('collection mode differs');
if (evidence.reason !== 'rank_upgrade_retry') fail('reason differs');
if (evidence.rank_strategy !== 'target_rank' || evidence.target_rank !== 'A+') fail('target strategy differs');
if (evidence.meeting_id !== 'banei-obihiro-racecourse-2026-07-04') fail('meeting_id differs');
if (evidence.status !== 'success') fail('status must be success');
if (evidence.observed_rank !== 'A+') fail('observed rank must be A+');
if (evidence.race_row_count !== 12) fail(`race row count differs: ${evidence.race_row_count}`);
if (!Object.values(evidence.row_semantics ?? {}).every((value) => value === true)) fail('row semantics must all be true');
if (evidence.coverage?.claim !== 'source_window_complete') fail('coverage claim differs');
if (evidence.coverage?.records_discovered !== 1 || evidence.coverage?.records_updated !== 1) fail('coverage record counts differ');
if (evidence.coverage?.unresolved_meeting_count !== 0 || evidence.coverage?.source_error_count !== 0) fail('coverage unresolved/error counts differ');
if (!exact(evidence.result_manifest?.rank_counts, { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 1 })) fail(`manifest rank counts differ: ${JSON.stringify(evidence.result_manifest?.rank_counts)}`);
if (evidence.result_manifest?.unresolved_meeting_count !== 0 || evidence.result_manifest?.source_error_count !== 0) fail('manifest unresolved/error counts differ');
if (evidence.review_queue?.entry_count !== 1) fail('review queue entry count differs');
if (evidence.review_queue?.review_state !== 'review_ready' || evidence.review_queue?.promotion_state !== 'not_ready') fail('review queue state differs');
if (Object.keys(evidence.artifact_digests_sha256 ?? {}).length !== 6) fail('artifact digest count differs');
for (const [key, digest] of Object.entries(evidence.artifact_digests_sha256 ?? {})) {
  if (!/^[0-9a-f]{64}$/.test(digest)) fail(`artifact digest invalid for ${key}`);
}
for (const [key, value] of Object.entries(evidence.boundaries ?? {})) {
  if (value !== false) fail(`boundary ${key} must be false`);
}
if (Object.keys(evidence.boundaries ?? {}).length !== 8) fail('boundary key count differs');

const plans = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-collection-plans-v1.json'), 'utf8'));
const plan = plans.plans.find((entry) => entry.plan_id === evidence.plan_id);
if (!plan) fail('reviewed retry Plan fixture missing');
else {
  if (plan.jobs.length !== 1) fail('reviewed retry Plan must contain exactly one Job');
  const job = plan.jobs[0];
  if (job.job_id !== evidence.job_id) fail('Plan Job identity differs from evidence');
  if (job.runner_policy.mode !== 'registry_primary_or_fallback') fail('Plan must preserve fallback eligibility');
  if (job.collection_mode !== 'selected_meetings') fail('Plan Job mode differs');
  if (job.reason !== 'rank_upgrade_retry') fail('Plan Job reason differs');
  if (job.rank_strategy !== 'target_rank' || job.target_rank !== 'A+') fail('Plan Job target differs');
  if (!exact(job.requested_scope.meeting_ids, [evidence.meeting_id])) fail('Plan selected meeting differs');
}

const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-due-job-policy-v1.json'), 'utf8'));
if (policy.scheduler.artifact_only !== true || policy.scheduler.execute_jobs !== false) fail('scheduler automatic execution boundary differs');

const serialized = JSON.stringify(evidence).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`"${forbidden}"`)) fail(`forbidden evidence key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`BANEI_RETRY_OPS_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('BANEI_RETRY_OPS_EVIDENCE: pass');
console.log(`PLAN_ID: ${evidence.plan_id}`);
console.log(`JOB_ID: ${evidence.job_id}`);
console.log(`STATUS: ${evidence.status}`);
console.log(`OBSERVED_RANK: ${evidence.observed_rank}`);
console.log(`RACE_ROWS: ${evidence.race_row_count}`);
console.log(`COVERAGE: ${evidence.coverage.claim}`);
console.log(`REVIEW_STATE: ${evidence.review_queue.review_state}`);
console.log('AUTOMATIC_EXECUTION: false');
