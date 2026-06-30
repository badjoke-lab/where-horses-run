// @ts-check
import { defineConfig } from 'astro/config';

// Static builds read committed public timetable projections only.
// Candidate, canonical, and public-data generation run through explicit
// reviewed pipeline commands and must never execute as an Astro config side effect.
export default defineConfig({
  site: 'https://whr.badjoke-lab.com',
  trailingSlash: 'always'
});
