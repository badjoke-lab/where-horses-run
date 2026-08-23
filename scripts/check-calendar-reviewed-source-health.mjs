import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-reviewed-source-health-'));
const statePath = path.join(tempDir, 'live-state.json');
const planPath = path.join(tempDir, 'due-plan.json');
const asOf = '2026-08-23T05:15:00Z';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

try {
  const reviewedHealth = readJson(path.join(root, 'data/static/calendar-reviewed-source-health-v1.json'));
  if (reviewedHealth.schema_version !== 'calendar-reviewed-source-health-v1') throw new Error('reviewed source health schema differs');
  const jraEvidence = reviewedHealth.records.filter((record) => record.system_id === 'japan-jra-system');
  if (jraEvidence.length !== 1) throw new Error(`expected exactly one JRA reviewed source health record, got ${jraEvidence.length}`);
  if (jraEvidence[0].checked_at !== asOf) throw new Error('JRA reviewed source health checked_at differs');
  if (jraEvidence[0].source_health !== 'healthy') throw new Error('JRA reviewed source health must be healthy');
  if (jraEvidence[0].review_state !== 'reviewed') throw new Error('JRA reviewed source health must remain reviewed');
  if (!jraEvidence[0].evidence_urls.every((url) => url.startsWith('https://www.jra.go.jp/'))) {
    throw new Error('JRA reviewed source health evidence must remain on official JRA hosts');
  }

  run(process.execPath, [
    'scripts/timetable/build-calendar-live-planner-state.mjs',
    `--as-of=${asOf}`,
    `--output=${statePath}`,
  ]);

  const state = readJson(statePath);
  const jra = state.system_states.find((entry) => entry.system_id === 'japan-jra-system');
  if (!jra) throw new Error('JRA planner state missing');
  if (jra.source_health !== 'healthy') throw new Error(`JRA source health should be healthy, got ${jra.source_health}`);
  if (jra.last_successful_collection_at !== '2026-08-08T00:00:00Z') {
    throw new Error(`JRA last successful collection must remain 2026-08-08, got ${jra.last_successful_collection_at}`);
  }
  if (jra.last_source_revalidation_at !== asOf) {
    throw new Error(`JRA source revalidation should use reviewed evidence time, got ${jra.last_source_revalidation_at}`);
  }
  if (jra.coverage_gaps.length !== 0) {
    throw new Error(`JRA coverage gap must not extend beyond the reviewed season window: ${JSON.stringify(jra.coverage_gaps)}`);
  }

  const seasonState = readJson(path.join(root, 'data/static/calendar-system-season-state-v1.json'));
  const planningDate = asOf.slice(0, 10);
  for (const system of state.system_states.filter((entry) => entry.season_state === 'active')) {
    const reviewedSeason = seasonState.records.find((record) => record.system_id === system.system_id
      && record.effective_start_date <= planningDate
      && planningDate < record.effective_end_date_exclusive);
    if (!reviewedSeason) throw new Error(`reviewed active season missing for ${system.system_id}`);
    for (const gap of system.coverage_gaps) {
      if (gap.end_date_exclusive > reviewedSeason.effective_end_date_exclusive) {
        throw new Error(`${system.system_id} coverage gap exceeds reviewed active season end`);
      }
    }
  }

  run(process.execPath, [
    'scripts/timetable/plan-calendar-due-jobs.mjs',
    `--state=${statePath}`,
    `--output=${planPath}`,
  ]);

  const plan = readJson(planPath);
  const jraJobs = plan.collection_plan.jobs.filter((job) => job.system_id === 'japan-jra-system');
  if (jraJobs.length !== 1) throw new Error(`expected one JRA Job after source revalidation, got ${jraJobs.length}`);
  const job = jraJobs[0];
  if (job.job_id !== 'due-japan-jra-regular-refresh-001') throw new Error(`unexpected JRA Job ${job.job_id}`);
  if (job.reason !== 'regular_refresh') throw new Error(`JRA Job reason should be regular_refresh, got ${job.reason}`);
  if (job.collection_mode !== 'date_window') throw new Error(`JRA Job mode should be date_window, got ${job.collection_mode}`);
  if (job.requested_scope.start_date !== '2026-08-24' || job.requested_scope.end_date_exclusive !== '2026-08-31') {
    throw new Error(`JRA regular refresh scope differs: ${JSON.stringify(job.requested_scope)}`);
  }
  if (job.runner_policy.mode !== 'registry_primary' || job.runner_policy.runner !== null) {
    throw new Error('JRA regular refresh must retain Registry primary local routing');
  }
  if (plan.scheduler_boundary.automatic_approval !== false
    || plan.scheduler_boundary.automatic_promotion !== false
    || plan.scheduler_boundary.automatic_publication !== false
    || plan.scheduler_boundary.automatic_deployment !== false) {
    throw new Error('planner publication safety boundary changed');
  }

  console.log(JSON.stringify({
    jra_source_health: jra.source_health,
    last_successful_collection_at: jra.last_successful_collection_at,
    last_source_revalidation_at: jra.last_source_revalidation_at,
    next_jra_job: job.job_id,
    requested_scope: job.requested_scope,
    jra_coverage_gap_count: jra.coverage_gaps.length,
  }));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
