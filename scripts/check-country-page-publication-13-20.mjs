import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['13', 'japan', 'A'],
  ['14', 'hong-kong', 'A'],
  ['15', 'new-zealand', 'A'],
  ['16', 'south-africa', 'A'],
  ['17', 'uruguay', 'C'],
  ['18', 'sweden', 'C'],
  ['19', 'denmark', 'C'],
  ['20', 'czech-republic', 'C']
];

const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const rows = lines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
}).filter(Boolean);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (row.programme_status !== 'published') fail(`${slug} programme_status must be published`);
  if (row.profile_status !== 'reviewed') fail(`${slug} profile_status must be reviewed`);
  if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug} bilingual routes must be published`);
  if (row.qa_status !== 'passed') fail(`${slug} QA must be passed`);
  if (row.page_published_at !== '2026-06-18') fail(`${slug} page_published_at must be 2026-06-18`);
}

const counts = rows.reduce((result, row) => {
  result[row.programme_status] = (result[row.programme_status] ?? 0) + 1;
  return result;
}, {});
if ((counts.published ?? 0) !== 20) fail('tracker must contain 20 published rows');
if ((counts.profile_ready ?? 0) !== 0) fail('tracker must contain 0 profile_ready rows');
if ((counts.not_started ?? 0) !== 78) fail('tracker must contain 78 not_started rows');

const staticDirectory = path.join(root, 'data/static');
const profiles = new Map();
for (const [deliveryNo, slug, ceiling] of expected) {
  const file = path.join(staticDirectory, `country-profiles-v2-${deliveryNo}-${slug}.json`);
  if (!fs.existsSync(file)) {
    fail(`missing profile file for ${slug}`);
    continue;
  }
  const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
  const profile = Array.isArray(batch) ? batch[0] : null;
  if (!profile) {
    fail(`missing profile record for ${slug}`);
    continue;
  }
  profiles.set(slug, profile);
  if (profile.public_display_ceiling !== ceiling) fail(`${slug} public ceiling must be ${ceiling}`);
}

const componentPath = path.join(root, 'src/components/CountryDetailPage.astro');
const component = fs.readFileSync(componentPath, 'utf8');
for (const phrase of [
  "const publicDisplayCeiling = profile?.public_display_ceiling ?? 'C';",
  "const showMeetingDetails = ['A+', 'A', 'B+', 'B'].includes(publicDisplayCeiling);",
  "showMeetingDetails &&",
  "profile.beginner_guide_en ?? profile.coverage_note_en",
  "profile.beginner_guide_ja ?? profile.coverage_note_ja"
]) {
  if (!component.includes(phrase)) fail(`CountryDetailPage is missing ceiling-aware phrase: ${phrase}`);
}
if (component.includes('legacy-compat')) fail('CountryDetailPage must not contain legacy compatibility output');

const distDirectory = path.join(root, 'dist');
if (!fs.existsSync(distDirectory)) fail('dist is missing; run the production build before this validator');

const countMatches = (text, expression) => [...text.matchAll(expression)].length;
const cSlugs = new Set(expected.filter((entry) => entry[2] === 'C').map((entry) => entry[1]));
for (const [, slug] of expected) {
  const enPath = path.join(distDirectory, 'countries', slug, 'index.html');
  const jaPath = path.join(distDirectory, 'ja', 'countries', slug, 'index.html');
  for (const file of [enPath, jaPath]) {
    if (!fs.existsSync(file)) fail(`missing built route ${path.relative(root, file)}`);
  }
  if (!fs.existsSync(enPath) || !fs.existsSync(jaPath)) continue;

  const en = fs.readFileSync(enPath, 'utf8');
  const ja = fs.readFileSync(jaPath, 'utf8');
  const enCanonical = `https://whr.badjoke-lab.com/countries/${slug}/`;
  const jaCanonical = `https://whr.badjoke-lab.com/ja/countries/${slug}/`;

  if (!en.includes(`rel="canonical" href="${enCanonical}"`)) fail(`${slug} EN canonical is missing`);
  if (!en.includes(`hreflang="ja" href="${jaCanonical}"`)) fail(`${slug} EN Japanese alternate is missing`);
  if (!ja.includes(`rel="canonical" href="${jaCanonical}"`)) fail(`${slug} JA canonical is missing`);
  if (!ja.includes(`hreflang="en" href="${enCanonical}"`)) fail(`${slug} JA English alternate is missing`);
  if (countMatches(en, /<h1\b/g) !== 1) fail(`${slug} EN must contain exactly one h1`);
  if (countMatches(ja, /<h1\b/g) !== 1) fail(`${slug} JA must contain exactly one h1`);

  if (cSlugs.has(slug)) {
    if (/<th[^>]*>Start time<\/th>/.test(en)) fail(`${slug} C page must not render an EN start-time column`);
    if (/<th[^>]*>開始時刻<\/th>/.test(ja)) fail(`${slug} C page must not render a JA start-time column`);
    if (/<th[^>]*>Timezone<\/th>/.test(en)) fail(`${slug} C page must not render an EN timezone column`);
    if (/<th[^>]*>タイムゾーン<\/th>/.test(ja)) fail(`${slug} C page must not render a JA timezone column`);
  }
}

const runtime = fs.readFileSync(path.join(root, 'src/lib/country-profile-runtime.ts'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
if (runtime.includes('legacy-compat') || runtime.includes('adaptLegacyCountryProfile')) fail('runtime must remain v2-only');
if (data.includes('legacyCountryProfiles') || data.includes("country-profiles.json'")) fail('data.ts must remain v2-only');

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_PAGE_PUBLICATION_13_20_VALID');
console.log('PUBLISHED_ROUTES: 8 EN + 8 JA');
console.log('DISPLAY_CEILINGS: A=4 C=4');
console.log('TRACKER_COUNTS: published=20 not_started=78');
console.log('RUNTIME: v2-only');
