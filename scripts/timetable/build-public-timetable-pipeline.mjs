import { execFileSync } from 'node:child_process';

const steps = [
  'scripts/timetable/normalize-hkjc-racecards.mjs',
  'scripts/timetable/build-canonical-timetable.mjs',
  'scripts/timetable/merge-hkjc-normalized-into-canonical.mjs',
  'scripts/timetable/build-public-timetable-view.mjs',
];

for (const step of steps) {
  execFileSync(process.execPath, [step], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

console.log('[build-public-timetable-pipeline] complete');
