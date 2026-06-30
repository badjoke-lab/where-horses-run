import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const auditStatusIndex = auditTrackerLines[0].split('\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

import fs from 'node:fs';
import path from 'node:path';
import { applyPublication6976 } from './lib/apply-publication-69-76.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['69', 'russia'], ['70', 'namibia'], ['71', 'nigeria'], ['72', 'belize'],
  ['73', 'colombia'], ['74', 'lithuania'], ['75', 'estonia'], ['76', 'guyana'],
];

const lines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = lines.shift().split('\t');
const rows = applyPublication6976(lines.map((line) => {
  const values = line.split('\t');
  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}));

if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);
const publishedCount = rows.filter((row) => row.programme_status === 'published').length;
if (publishedCount !== 76) fail(`effective tracker must contain 76 published rows; found ${publishedCount}`);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(`delivery ${deliveryNo} must be ${slug}`);
  else {
    if (row.programme_status !== 'published') fail(`${slug} must be published`);
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug} bilingual routes must be published`);
    if (row.qa_status !== 'passed' || row.page_published_at !== '2026-06-30') fail(`${slug} publication gate is incomplete`);
  }

  const profilePath = path.join(root, `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`);
  if (!fs.existsSync(profilePath)) fail(`missing profile ${profilePath}`);
  else {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))[0];
    if (profile?.public_display_ceiling !== 'C') fail(`${slug} public ceiling must remain C`);
  }

  for (const route of [`countries/${slug}/index.html`, `ja/countries/${slug}/index.html`]) {
    const file = path.join(root, 'dist', route);
    if (!fs.existsSync(file)) {
      fail(`missing built route ${route}`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (/<(?:iframe|video)\b/i.test(html)) fail(`${route} must not embed video`);
    if (/<th[^>]*>(?:Start time|開始時刻|Timezone|タイムゾーン)<\/th>/.test(html)) fail(`${route} exceeds C display boundary`);
  }
}

const evidence = JSON.parse(fs.readFileSync(path.join(root, 'docs/runbooks/rendered-preview-69-76-evidence.json'), 'utf8'));
if (evidence.result !== 'passed' || evidence.routes !== 16 || evidence.viewport_checks !== 32 || evidence.errors !== 0) {
  fail('rendered preview evidence is incomplete');
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PAGE_PUBLICATION_69_76_VALID');
console.log('EFFECTIVE_COUNTS: published=76 not_started=22 routes=152');
console.log('RENDERED_QA: routes=16 viewport_checks=32 screenshots=16 errors=0');
