import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const steps = [
  ['scripts/timetable/fetch-hkjc-racecards.mjs', ...args],
  ['scripts/timetable/normalize-hkjc-racecards.mjs'],
  ['scripts/timetable/build-canonical-timetable.mjs'],
  ['scripts/timetable/merge-hkjc-normalized-into-canonical.mjs'],
  ['scripts/timetable/build-public-timetable-view.mjs'],
];

for (const step of steps) {
  execFileSync(process.execPath, step, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

console.log('[refresh-hkjc] complete');
