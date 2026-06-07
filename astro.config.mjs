// @ts-check
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'astro/config';

const runTimetableBuilder = (script) => {
  execFileSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
};

runTimetableBuilder('scripts/timetable/build-canonical-timetable.mjs');
runTimetableBuilder('scripts/timetable/build-public-timetable-view.mjs');

export default defineConfig({
  site: 'https://where-horses-run.pages.dev',
  trailingSlash: 'always'
});
