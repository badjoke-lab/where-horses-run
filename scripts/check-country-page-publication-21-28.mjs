import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['21', 'hungary', 'A'],
  ['22', 'malta', 'C'],
  ['23', 'austria', 'C'],
  ['24', 'puerto-rico', 'A'],
  ['25', 'jamaica', 'A'],
  ['26', 'trinidad-and-tobago', 'A'],
  ['27', 'barbados', 'A'],
  ['28', 'martinique', 'C']
];
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];

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

if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('profile_ready')) {
    fail(`${slug} must be at least profile_ready`);
  }
  if (row.profile_status !== 'reviewed') fail(`${slug} profile_status must be reviewed`);
  if (row.note_status !== 'reviewed') fail(`${slug} note_status must remain reviewed`);

  if (row.programme_status === 'published') {
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug} published routes are required`);
    if (row.qa_status !== 'passed') fail(`${slug} published QA must be passed`);
    if (!row.page_published_at) fail(`${slug} published row requires page_published_at`);
  } else if (row.programme_status === 'page_qa') {
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug} page-QA routes must be complete`);
    if (row.qa_status !== 'pending') fail(`${slug} page-QA status must be pending`);
    if (row.page_published_at) fail(`${slug} page-QA row must not have page_published_at`);
  } else {
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug} profile-ready routes must be complete`);
    if (row.qa_status !== 'not_started') fail(`${slug} profile-ready QA must be not_started`);
    if (row.page_published_at) fail(`${slug} profile-ready row must not have page_published_at`);
  }
}

const staticDirectory = path.join(root, 'data/static');
const sourceFiles = fs.readdirSync(staticDirectory)
  .filter((name) => name === 'sources.json' || /^country-page-sources-.*\.json$/.test(name))
  .sort();
const sources = sourceFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(staticDirectory, name), 'utf8')));
const sourceById = new Map(sources.map((source) => [source.id, source]));

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
  if (!Array.isArray(profile.systems) || profile.systems.length === 0) fail(`${slug} requires a racing system`);
  const sourceIds = (profile.systems ?? []).flatMap((system) => [
    ...(system.organiser_source_ids ?? []),
    ...(system.distributor_source_ids ?? [])
  ]);
  if (sourceIds.length === 0) fail(`${slug} requires reviewed official source references`);
  for (const sourceId of sourceIds) {
    const source = sourceById.get(sourceId);
    if (!source) fail(`${slug} has dangling source ${sourceId}`);
    else if (source.country_id !== slug) fail(`${slug} source country mismatch: ${sourceId}`);
  }
}

const componentPath = path.join(root, 'src/components/CountryDetailPage.astro');
const component = fs.readFileSync(componentPath, 'utf8');
for (const phrase of [
  "const publicDisplayCeiling = profile?.public_display_ceiling ?? 'C';",
  "const showMeetingDetails = ['A+', 'A', 'B+', 'B'].includes(publicDisplayCeiling);",
  'showMeetingDetails &&',
  'This does not mean there is no racing in this country.',
  'これは、この国で開催がないことを意味しません。'
]) {
  if (!component.includes(phrase)) fail(`CountryDetailPage is missing publication-boundary phrase: ${phrase}`);
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
  if (!en.includes(`/ja/countries/${slug}/`)) fail(`${slug} EN language switch is missing`);
  if (!ja.includes(`/countries/${slug}/`)) fail(`${slug} JA language switch is missing`);

  const enHasMeetingRows = /<tbody>[\s\S]*?<tr>/.test(en);
  const jaHasMeetingRows = /<tbody>[\s\S]*?<tr>/.test(ja);
  if (!enHasMeetingRows && !en.includes('This does not mean there is no racing in this country.')) {
    fail(`${slug} EN empty-state safeguard is missing`);
  }
  if (!jaHasMeetingRows && !ja.includes('これは、この国で開催がないことを意味しません。')) {
    fail(`${slug} JA empty-state safeguard is missing`);
  }

  const profile = profiles.get(slug);
  const sourceIds = (profile?.systems ?? []).flatMap((system) => [
    ...(system.organiser_source_ids ?? []),
    ...(system.distributor_source_ids ?? [])
  ]);
  const sourceUrls = sourceIds.map((id) => sourceById.get(id)?.url).filter(Boolean);
  if (!sourceUrls.some((url) => en.includes(url))) fail(`${slug} EN official source link is missing`);
  if (!sourceUrls.some((url) => ja.includes(url))) fail(`${slug} JA official source link is missing`);

  if (cSlugs.has(slug)) {
    if (/<th[^>]*>Start time<\/th>/.test(en)) fail(`${slug} C page must not render an EN start-time column`);
    if (/<th[^>]*>開始時刻<\/th>/.test(ja)) fail(`${slug} C page must not render a JA start-time column`);
    if (/<th[^>]*>Timezone<\/th>/.test(en)) fail(`${slug} C page must not render an EN timezone column`);
    if (/<th[^>]*>タイムゾーン<\/th>/.test(ja)) fail(`${slug} C page must not render a JA timezone column`);
  }

  for (const [label, html] of [['EN', en], ['JA', ja]]) {
    if (/<(?:iframe|video)\b/i.test(html)) fail(`${slug} ${label} must not embed video`);
    if (/\bWatch here\b/i.test(html)) fail(`${slug} ${label} must not use Watch here`);
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

console.log('COUNTRY_PAGE_PUBLICATION_21_28_VALID');
console.log('BUILT_ROUTES: 8 EN + 8 JA');
console.log('DISPLAY_CEILINGS: A=5 C=3');
console.log('PREVIEW_GATE: GitHub QA passed; rendered Cloudflare preview remains required before publication');
