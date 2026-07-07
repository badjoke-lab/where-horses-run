import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scopeArgs = process.argv.slice(2);
const batchIdArg = scopeArgs.find((value) => value.startsWith('--batch-id='));

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

if (scopeArgs.length === 0) {
  throw new Error('Provide --batch-id and either a date window or selected meeting IDs.');
}
if (!batchIdArg) {
  throw new Error('--batch-id is required so every review batch remains immutable.');
}
const batchId = batchIdArg.slice('--batch-id='.length);

run(process.execPath, ['scripts/timetable/collect-nar-incremental-v2.mjs', ...scopeArgs]);
run(process.execPath, ['scripts/check-calendar-nar-incremental-core.mjs']);
run(process.execPath, ['scripts/check-calendar-nar-incremental-v2.mjs', `--batch-id=${batchId}`]);
run(process.execPath, ['scripts/check-calendar-coverage-observation-schema.mjs']);
run(process.execPath, ['scripts/check-calendar-validation-responsibilities.mjs']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);

console.log('\n[NAR incremental v2] Local Schedule + Detail collection and validation complete.');
console.log(`[NAR incremental v2] Batch ${batchId} is immutable and review-only.`);
console.log('[NAR incremental v2] Review C schedule candidates, A+ detail candidates, Coverage Observation, and retry targets before promotion.');
