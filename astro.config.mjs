// @ts-check
import { defineConfig } from 'astro/config';
import sitemapRobotsIntegration from './scripts/sitemap-robots-integration.mjs';
import countryPageMetadataIntegration from './scripts/country-page-metadata-integration.mjs';

// Static builds read committed public timetable projections only.
// Candidate, canonical, and public-data generation run through explicit
// reviewed pipeline commands and must never execute as an Astro config side effect.
export default defineConfig({
  site: 'https://whr.badjoke-lab.com',
  trailingSlash: 'always',
  // Preserve the crawler-file integration as the build baseline, then append
  // page-specific metadata transforms in deterministic order.
  integrations: [sitemapRobotsIntegration()].concat(countryPageMetadataIntegration())
});
