import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const fail = (message) => errors.push(message);

const astroConfig = read('astro.config.mjs');
const packageJson = JSON.parse(read('package.json'));
const pipeline = read('scripts/timetable/build-public-timetable-pipeline.mjs');
const viewModel = read('src/lib/timetable/publicTimetableViewModel.ts');

for (const forbidden of [
  "node:child_process",
  'execFileSync',
  'runTimetableBuilder',
  'build-public-timetable-pipeline.mjs',
  'build-canonical-timetable.mjs',
  'build-public-timetable-view.mjs',
]) {
  if (astroConfig.includes(forbidden)) fail(`astro.config.mjs must not execute timetable generation: ${forbidden}`);
}

if (packageJson.scripts?.build !== 'astro build') fail('package build must remain exactly astro build.');
if ((packageJson.scripts?.check ?? '').includes('merge:june-2026-manual-records')) fail('normal check must not run the June merge command.');

for (const required of [
  "'scripts/timetable/normalize-hkjc-racecards.mjs'",
  "'scripts/timetable/build-canonical-timetable.mjs'",
  "'scripts/timetable/merge-hkjc-normalized-into-canonical.mjs'",
  "'scripts/timetable/build-public-timetable-view.mjs'",
]) {
  if (!pipeline.includes(required)) fail(`explicit timetable pipeline must retain step: ${required}`);
}

for (const required of [
  "../../../data/generated/timetable/public/meeting-list.json",
  "../../../data/generated/timetable/public/meeting-details.json",
]) {
  if (!viewModel.includes(required)) fail(`public view model must read committed public projection: ${required}`);
}
for (const forbidden of [
  'data/candidates/',
  'data/generated/timetable/canonical/',
  'data/generated/normalized-timetable.json',
  'data/generated/timetables.json',
]) {
  if (viewModel.includes(forbidden)) fail(`public view model must not read non-public input: ${forbidden}`);
}

for (const file of [
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'docs/calendar/pipeline-v1-build-boundary.md',
]) {
  if (!existsSync(path.join(root, file))) fail(`missing required build-boundary file: ${file}`);
}

if (errors.length) {
  console.error(`CALENDAR_BUILD_BOUNDARY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BUILD_BOUNDARY: pass');
console.log('BUILD_MODE: committed-public-projection-read-only');
console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');
