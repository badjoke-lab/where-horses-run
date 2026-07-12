import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const executionArg = args.get('--execution');
if (!executionArg) throw new Error('--execution=<path> is required');
const fixtureArg = args.get('--fixture');
const checkOnly = args.has('--check-only');
const executionPath = path.resolve(root, executionArg);
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));

if (execution.system_id !== 'uae-national-racing-system') throw new Error('UAE Actions dispatcher requires uae-national-racing-system');
if (execution.runner_used !== 'github_actions') throw new Error('UAE Actions dispatcher requires github_actions');
if (execution.executor_id !== 'uae-era-pdf-grid-actions') throw new Error('UAE Actions dispatcher executor identity differs');

function runNode(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed: ${result.stderr || result.stdout}`);
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  return lines.length ? JSON.parse(lines.at(-1)) : null;
}

function writeJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

if (execution.collection_mode === 'selected_meetings') {
  const runnerArgs = [`--execution=${executionPath}`];
  if (fixtureArg) runnerArgs.push(`--fixture=${path.resolve(root, fixtureArg)}`);
  if (checkOnly) runnerArgs.push('--check-only');
  const summary = runNode('scripts/timetable/run-uae-era-detail-actions-job.mjs', runnerArgs);
  console.log(JSON.stringify({
    schema_version: 'calendar-uae-era-actions-dispatch-summary-v1',
    route: 'detail_selected_meetings',
    ...summary,
  }));
  process.exit(0);
}

if (execution.collection_mode === 'source_visible_horizon') {
  if (fixtureArg) throw new Error('UAE schedule route does not accept a detail fixture');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-uae-era-actions-dispatch-'));
  try {
    const job = {
      schema_version: 'calendar-collection-job-v1',
      job_id: execution.job_id,
      campaign_id: execution.campaign_id,
      system_id: execution.system_id,
      runner_policy: { mode: 'exact', runner: execution.runner_used },
      collection_mode: execution.collection_mode,
      requested_scope: execution.requested_scope,
      rank_strategy: execution.rank_strategy,
      target_rank: execution.target_rank,
      reason: execution.reason,
      requested_at: new Date().toISOString(),
    };
    const jobPath = path.join(tempDir, 'job.json');
    const outputDir = path.join(tempDir, 'output');
    writeJson(jobPath, job);
    const scheduleSummary = runNode('scripts/timetable/run-uae-era-pdf-grid-actions.mjs', [
      `--execution=${executionPath}`,
      `--job=${jobPath}`,
      `--output-dir=${outputDir}`,
    ]);
    if (!checkOnly) {
      const targetRoot = path.join(root, 'data/generated/timetable/actions-multi-job', execution.batch_id);
      fs.mkdirSync(targetRoot, { recursive: true });
      const mapping = new Map([
        ['candidates.json', 'candidates.json'],
        ['coverage-observation.json', 'coverage-observation.json'],
        ['collection-result-manifest.json', 'result-manifest.json'],
        ['collection-report.json', 'collection-report.json'],
      ]);
      for (const [sourceName, targetName] of mapping) {
        fs.copyFileSync(path.join(outputDir, sourceName), path.join(targetRoot, targetName));
      }
    }
    console.log(JSON.stringify({
      schema_version: 'calendar-uae-era-actions-dispatch-summary-v1',
      route: 'schedule_source_visible_horizon',
      ...scheduleSummary,
      check_only: checkOnly,
    }));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  process.exit(0);
}

throw new Error(`UAE Actions dispatcher does not support ${execution.collection_mode}`);
