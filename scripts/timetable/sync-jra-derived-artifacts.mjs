import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(script, args = []) {
  console.log(`\n$ ${process.execPath} ${script} ${args.join(' ')}`.trimEnd());
  execFileSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: 'inherit',
  });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const normalized = readJson('data/generated/timetable/jra-normalized-timetable.json');
const referenceDate = String(normalized.generated_at ?? '').slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) {
  throw new Error('JRA normalized generated_at does not provide a valid operations reference date.');
}

run('scripts/generate-japan-jra-candidates.mjs');
run('scripts/timetable/build-jra-pilot-review.mjs');
run('scripts/timetable/build-operations-status.mjs', ['--reference-date', referenceDate]);
run('scripts/timetable/build-operations-review-package.mjs');

console.log(`\nJRA_DERIVED_ARTIFACTS_SYNC: complete reference_date=${referenceDate}`);
