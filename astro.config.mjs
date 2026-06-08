// @ts-check
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'astro/config';

const runTimetableBuilder = (script) => {
  execFileSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
};

runTimetableBuilder('scripts/timetable/build-public-timetable-pipeline.mjs');

export default defineConfig({
  site: 'https://whr.badjoke-lab.com',
  trailingSlash: 'always'
});
