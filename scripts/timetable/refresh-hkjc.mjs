import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const researchOnly = args.includes('--legacy-research-only');
const forwardedArgs = args.filter((arg) => arg !== '--legacy-research-only');

if (!researchOnly) {
  throw new Error([
    'HKJC legacy rolling refresh is quarantined from canonical/public write paths.',
    'Use the shared Calendar Acquisition Control Plane for operational collection.',
    'For explicitly reviewed legacy source research only, rerun with --legacy-research-only.',
  ].join(' '));
}

const steps = [
  ['scripts/timetable/fetch-hkjc-racecards.mjs', ...forwardedArgs],
  ['scripts/timetable/normalize-hkjc-racecards.mjs'],
];

for (const step of steps) {
  execFileSync(process.execPath, step, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

console.log('[refresh-hkjc] legacy research-only acquisition/normalization complete');
console.log('[refresh-hkjc] canonical write: false');
console.log('[refresh-hkjc] public write: false');
