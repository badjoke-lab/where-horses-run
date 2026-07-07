import { spawnSync } from 'node:child_process';
import { buildActionsCollectionPlan } from './nar-incremental-v2-actions-core.mjs';

const plan = buildActionsCollectionPlan(process.env);

console.log(JSON.stringify({
  runner: 'github_actions',
  batch_id: plan.batchId,
  mode: plan.mode,
  artifact_paths: plan.artifactPaths,
  publication_effect: 'none',
}, null, 2));

const result = spawnSync(process.execPath, [
  'scripts/timetable/collect-nar-incremental-v2.mjs',
  ...plan.args,
], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`NAR_INCREMENTAL_V2_ACTIONS_COLLECTION: complete batch=${plan.batchId} mode=${plan.mode}`);
