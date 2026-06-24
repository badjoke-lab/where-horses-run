import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['37', 'malaysia'],
  ['38', 'thailand'],
  ['39', 'philippines'],
  ['40', 'mauritius'],
  ['41', 'argentina'],
  ['42', 'germany'],
  ['43', 'italy'],
  ['44', 'spain']
];

const trackerLines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const rows = trackerLines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index]])));
if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (row.programme_status !== 'profile_ready') fail(`${slug} must remain profile_ready before rendered preview approval`);
  if (row.profile_status !== 'reviewed' || row.note_status !== 'reviewed') fail(`${slug} profile and note must be reviewed`);
  if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug} bilingual routes must be complete`);
  if (row.qa_status !== 'not_started') fail(`${slug} QA must remain not_started before rendered preview`);
  if (row.page_published_at) fail(`${slug} must not have a publication date`);
}

const staticDir = path.join(root, 'data/static');
const sourceFiles = fs.readdirSync(staticDir).filter((name) => name === 'sources.json' || /^country-page-sources-.*\.json$/.test(name));
const sources = sourceFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(staticDir, name), 'utf8')));
const sourceById = new Map(sources.map((source) => [source.id, source]));
const profiles = new Map();

for (const [deliveryNo, slug] of expected) {
  const profileFile = path.join(staticDir, `country-profiles-v2-${deliveryNo}-${slug}.json`);
  if (!fs.existsSync(profileFile)) {
    fail(`missing profile for ${slug}`);
    continue;
  }
  const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'))[0];
  profiles.set(slug, profile);
  if (profile.public_display_ceiling !== 'C') fail(`${slug} public ceiling must remain C`);
  const sourceIds = (profile.systems ?? []).flatMap((system) => [
    ...(system.organiser_source_ids ?? []),
    ...(system.distributor_source_ids ?? [])
  ]);
  if (!sourceIds.length) fail(`${slug} requires reviewed official source references`);
  for (const sourceId of sourceIds) {
    const source = sourceById.get(sourceId);
    if (!source) fail(`${slug} has dangling source ${sourceId}`);
    else if (source.country_id !== slug) fail(`${slug} source country mismatch: ${sourceId}`);
  }
}

const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) fail('dist is missing; run npm run build first');
const count = (text, expression) => [...text.matchAll(expression)].length;

for (const [, slug] of expected) {
  const enPath = path.join(distDir, 'countries', slug, 'index.html');
  const jaPath = path.join(distDir, 'ja', 'countries', slug, 'index.html');
  if (!fs.existsSync(enPath)) fail(`missing EN route for ${slug}`);
  if (!fs.existsSync(jaPath)) fail(`missing JA route for ${slug}`);
  if (!fs.existsSync(enPath) || !fs.existsSync(jaPath)) continue;

  const en = fs.readFileSync(enPath, 'utf8');
  const ja = fs.readFileSync(jaPath, 'utf8');
  const enCanonical = `https://whr.badjoke-lab.com/countries/${slug}/`;
  const jaCanonical = `https://whr.badjoke-lab.com/ja/countries/${slug}/`;

  if (!en.includes(`rel="canonical" href="${enCanonical}"`)) fail(`${slug} EN canonical is missing`);
  if (!ja.includes(`rel="canonical" href="${jaCanonical}"`)) fail(`${slug} JA canonical is missing`);
  if (!en.includes(`hreflang="ja" href="${jaCanonical}"`)) fail(`${slug} EN hreflang is missing`);
  if (!ja.includes(`hreflang="en" href="${enCanonical}"`)) fail(`${slug} JA hreflang is missing`);
  if (count(en, /<h1\b/g) !== 1 || count(ja, /<h1\b/g) !== 1) fail(`${slug} must have one h1 per locale`);
  if (!en.includes(`/ja/countries/${slug}/`) || !ja.includes(`/countries/${slug}/`)) fail(`${slug} language switch is missing`);

  for (const [locale, html] of [['EN', en], ['JA', ja]]) {
    if (/<th[^>]*>(?:Start time|開始時刻)<\/th>/.test(html)) fail(`${slug} ${locale} C page must not render start-time columns`);
    if (/<th[^>]*>(?:Timezone|タイムゾーン)<\/th>/.test(html)) fail(`${slug} ${locale} C page must not render timezone columns`);
    if (/<(?:iframe|video)\b/i.test(html)) fail(`${slug} ${locale} must not embed video`);
    if (/\bWatch here\b/i.test(html)) fail(`${slug} ${locale} must not use Watch here`);
  }

  const sourceIds = (profiles.get(slug)?.systems ?? []).flatMap((system) => [
    ...(system.organiser_source_ids ?? []),
    ...(system.distributor_source_ids ?? [])
  ]);
  const urls = sourceIds.map((id) => sourceById.get(id)?.url).filter(Boolean);
  if (!urls.some((url) => en.includes(url))) fail(`${slug} EN official source link is missing`);
  if (!urls.some((url) => ja.includes(url))) fail(`${slug} JA official source link is missing`);

  if (!/<tbody>[\s\S]*?<tr>/.test(en) && !en.includes('This does not mean there is no racing in this country.')) fail(`${slug} EN empty-state safeguard is missing`);
  if (!/<tbody>[\s\S]*?<tr>/.test(ja) && !ja.includes('これは、この国で開催がないことを意味しません。')) fail(`${slug} JA empty-state safeguard is missing`);
}

const runtime = fs.readFileSync(path.join(root, 'src/lib/country-profile-runtime.ts'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
if (runtime.includes('legacy-compat') || runtime.includes('adaptLegacyCountryProfile')) fail('runtime must remain Profile v2 only');
if (data.includes('legacyCountryProfiles') || data.includes("country-profiles.json'")) fail('data.ts must remain Profile v2 only');

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PAGE_PUBLICATION_37_44_VALID');
console.log('BUILT_ROUTES: 8 EN + 8 JA');
console.log('DISPLAY_CEILINGS: C=8');
console.log('PREVIEW_GATE: GitHub QA passed; rendered Cloudflare preview remains required before publication');
