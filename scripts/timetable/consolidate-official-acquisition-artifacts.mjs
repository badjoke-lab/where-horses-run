import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else files.push(absolute);
  }
  return files;
}
function isCandidateArtifact(file) {
  if (path.basename(file) === 'candidates.json') return true;
  return path.basename(file) === 'batch.json' && file.includes(`${path.sep}nar-incremental-batches${path.sep}`);
}
function applyArtifact(file) {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/apply-official-rolling-observations.mjs',
    `--artifact=${file}`,
  ], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`official observation apply failed for ${file}: ${(result.stderr || result.stdout || '').slice(0, 4000)}`);
  }
  const lines = String(result.stdout ?? '').trim().split(/\r?\n/).filter(Boolean);
  return JSON.parse(lines.at(-1));
}

const root = path.resolve(arg('root', '.calendar-acquisition-downloads'));
const output = path.resolve(arg('output', '.calendar-acquisition-consolidation.json'));
const artifacts = walk(root).filter(isCandidateArtifact).sort();
const results = artifacts.map((file) => ({
  artifact: path.relative(process.cwd(), file),
  result: applyArtifact(file),
}));
const totals = results.reduce((acc, item) => {
  const outcomes = item.result.outcomes ?? {};
  for (const key of ['add', 'update', 'no_op', 'protected_higher_rank', 'ignored']) {
    acc[key] += outcomes[key] ?? 0;
  }
  if (item.result.changed) acc.changed_artifacts += 1;
  return acc;
}, { add: 0, update: 0, no_op: 0, protected_higher_rank: 0, ignored: 0, changed_artifacts: 0 });
const summary = {
  schema_version: 'official-acquisition-consolidation-v1',
  generated_at: new Date().toISOString(),
  artifact_count: artifacts.length,
  totals,
  results,
};
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
