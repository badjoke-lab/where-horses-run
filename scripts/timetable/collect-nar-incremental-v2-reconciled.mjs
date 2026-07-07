import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseIncrementalV2Args } from './nar-incremental-v2-core.mjs';
import { reconcileDetailBlockerRetries } from './nar-incremental-v2-reconcile.mjs';

const root = process.cwd();
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json'), 'utf8'));
const argv = process.argv.slice(2);
const parsedArgs = parseIncrementalV2Args(argv, matrix.records);

execFileSync(process.execPath, ['scripts/timetable/collect-nar-incremental-v2.mjs', ...argv], {
  cwd: root,
  stdio: 'inherit',
});

if (parsedArgs.dryRun) process.exit(0);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const artifacts = {
  candidates: readJson(parsedArgs.paths.candidates),
  report: readJson(parsedArgs.paths.report),
  coverage: readJson(parsedArgs.paths.coverage),
  retries: readJson(parsedArgs.paths.retries),
};
const aggregate = {
  scheduleCandidates: artifacts.candidates.schedule_candidates ?? [],
  detailBlockers: artifacts.candidates.detail_blockers ?? [],
};
reconcileDetailBlockerRetries(artifacts, aggregate);
writeJson(parsedArgs.paths.coverage, artifacts.coverage);
writeJson(parsedArgs.paths.retries, artifacts.retries);

console.log(`[NAR incremental v2] reconciled retry targets for batch ${parsedArgs.batchId}`);
