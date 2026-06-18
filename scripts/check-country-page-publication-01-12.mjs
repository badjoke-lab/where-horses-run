import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const componentPath = 'src/components/CountryDetailPage.astro';
const layoutPath = 'src/layouts/BaseLayout.astro';
const enRoutePath = 'src/pages/countries/[slug].astro';
const jaRoutePath = 'src/pages/ja/countries/[slug].astro';
const cssPath = 'src/styles/components.css';

for (const file of [trackerPath, componentPath, layoutPath, enRoutePath, jaRoutePath, cssPath]) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}
if (process.exitCode) process.exit(process.exitCode);

const expected = [
  ['01', 'united-arab-emirates'], ['02', 'south-korea'], ['03', 'turkey'], ['04', 'morocco'],
  ['05', 'chile'], ['06', 'peru'], ['07', 'mexico'], ['08', 'brazil'],
  ['09', 'bahrain'], ['10', 'qatar'], ['11', 'oman'], ['12', 'zimbabwe']
];

const trackerLines = read(trackerPath).replace(/\r\n/g, '\n').trimEnd().split('\n');
const headers = trackerLines[0].split('\t');
const rows = trackerLines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
}).filter(Boolean);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row) {
    fail(`missing tracker row ${deliveryNo}`);
    continue;
  }
  if (row.slug !== slug) fail(`delivery ${deliveryNo} must be ${slug}`);
  if (row.programme_status !== 'published') fail(`${slug} programme_status must be published`);
  if (row.profile_status !== 'reviewed') fail(`${slug} profile_status must be reviewed`);
  if (row.en_route_status !== 'published') fail(`${slug} EN route must be published`);
  if (row.ja_route_status !== 'published') fail(`${slug} JA route must be published`);
  if (row.qa_status !== 'passed') fail(`${slug} QA must be passed`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.page_published_at)) fail(`${slug} requires page_published_at`);
}

const publishedCount = rows.filter((row) => row.programme_status === 'published').length;
const profileReadyCount = rows.filter((row) => row.programme_status === 'profile_ready').length;
const noteReviewedCount = rows.filter((row) => row.programme_status === 'note_reviewed').length;
const notStartedCount = rows.filter((row) => row.programme_status === 'not_started').length;
if (publishedCount !== 12) fail(`expected 12 published rows; found ${publishedCount}`);
if (profileReadyCount !== 8) fail(`expected 8 profile_ready rows; found ${profileReadyCount}`);
if (noteReviewedCount !== 0) fail(`expected 0 note_reviewed rows; found ${noteReviewedCount}`);
if (notStartedCount !== 78) fail(`expected 78 not_started rows; found ${notStartedCount}`);

const staticDirectory = path.join(root, 'data/static');
const profileFiles = fs.readdirSync(staticDirectory)
  .filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name))
  .sort();
const profiles = profileFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(staticDirectory, file), 'utf8')));
const profileIds = new Set(profiles.map((profile) => profile.country_id));
for (const [, slug] of expected) {
  if (!profileIds.has(slug)) fail(`missing production profile for ${slug}`);
}

const component = read(componentPath);
const requiredComponentSnippets = [
  "const canonicalPath = isJa ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`;",
  "const alternatePath = isJa ? `/countries/${country.slug}/` : `/ja/countries/${country.slug}/`;",
  "const racecoursePathPrefix = isJa ? '/ja/tracks/' : '/tracks/';",
  'canonicalPath={canonicalPath}',
  'alternatePath={alternatePath}',
  'aria-labelledby="page-title"',
  'aria-label={pick(\'Page sections\', \'ページ内リンク\')}',
  'data-label={pick(\'Date\', \'日付\')}',
  '<th scope="col">'
];
for (const snippet of requiredComponentSnippets) {
  if (!component.includes(snippet)) fail(`CountryDetailPage is missing publication QA snippet: ${snippet}`);
}
if (component.includes("'/racecourses/'") || component.includes("'/ja/racecourses/'")) {
  fail('CountryDetailPage must link racecourse profiles through /tracks/ routes');
}
if (/<(?:iframe|video)\b/i.test(component)) fail('CountryDetailPage must not embed video');
if (/direct_stream_url|stream_url/i.test(component)) fail('CountryDetailPage must not expose stream URL fields');

const layout = read(layoutPath);
for (const snippet of [
  'const languageSwitchHref = alternatePath ?? defaultAlternateHref;',
  'const alternateUrl = `${siteUrl}${languageSwitchHref}`;',
  '<a href={languageSwitchHref}>{alternateLabel}</a>',
  '<link rel="alternate" hreflang="x-default"'
]) {
  if (!layout.includes(snippet)) fail(`BaseLayout is missing locale metadata support: ${snippet}`);
}

for (const routePath of [enRoutePath, jaRoutePath]) {
  const route = read(routePath);
  if (!route.includes('getCountries().map')) fail(`${routePath} must generate static country paths`);
  if (!route.includes('CountryDetailPage')) fail(`${routePath} must render CountryDetailPage`);
}

const css = read(cssPath);
for (const snippet of [
  '@media (max-width: 720px)', '@media (max-width: 480px)',
  '.country-table td::before', 'content: attr(data-label)',
  '.country-grid--2', '.country-grid--3'
]) {
  if (!css.includes(snippet)) fail(`responsive country-page CSS is missing: ${snippet}`);
}

if (!process.exitCode) {
  console.log('COUNTRY_PAGE_PUBLICATION_01_12_VALID');
  console.log('PUBLICATION_QA_SCOPE: entries 01-12');
  console.log('PUBLISHED_ROUTES: 12 EN + 12 JA');
  console.log('TRACKER_COUNTS: published=12 profile_ready=8 not_started=78');
  console.log('METADATA: canonical + hreflang + page-specific language switch');
  console.log('RESPONSIVE_AND_ACCESSIBILITY: validated');
}
