import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scopeArgs = process.argv.slice(2);

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

if (scopeArgs.length === 0) {
  throw new Error('Provide --start-date/--end-date-exclusive or selected meeting IDs.');
}

run(process.execPath, ['scripts/timetable/collect-nar-incremental.mjs', ...scopeArgs]);
run(process.execPath, ['scripts/check-calendar-nar-incremental-core.mjs']);
run(process.execPath, ['scripts/check-calendar-nar-incremental.mjs']);
run(process.execPath, ['scripts/check-calendar-runtime-import-boundary.mjs']);

console.log('\n[NAR incremental] Local collection and validation complete.');
console.log('[NAR incremental] Review the four generated artifacts before any promotion work.');
