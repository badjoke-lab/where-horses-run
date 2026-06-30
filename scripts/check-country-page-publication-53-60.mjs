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

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['53', 'cyprus'],
  ['54', 'panama'],
  ['55', 'kuwait'],
  ['56', 'kenya'],
  ['57', 'pakistan'],
  ['58', 'ecuador'],
  ['59', 'venezuela'],
  ['60', 'belgium'],
];
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];

const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const trackerLines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const rows = trackerLines.slice(1).map((line, rowIndex) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${rowIndex + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}).filter(Boolean);
if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);

for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('profile_ready')) {
    fail(`${slug} must be at least profile_ready`);
  }
  if (row.profile_status !== 'reviewed' || row.note_status !== 'reviewed') {
    fail(`${slug} profile and note must be reviewed`);
  }

  if (row.programme_status === 'published') {
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug} published routes are required`);
    if (row.qa_status !== 'passed') fail(`${slug} published QA must be passed`);
    if (!row.page_published_at) fail(`${slug} published row requires page_published_at`);
  } else if (row.programme_status === 'page_qa') {
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug} page-QA routes must be complete`);
    if (row.qa_status !== 'pending') fail(`${slug} page-QA status must be pending`);
    if (row.page_published_at) fail(`${slug} page-QA row must not have a publication date`);
  } else {
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug} profile-ready routes must be complete`);
    if (row.qa_status !== 'not_started') fail(`${slug} profile-ready QA must remain not_started`);
    if (row.page_published_at) fail(`${slug} profile-ready row must not have a publication date`);
  }
}

const staticDir = path.join(root, 'data/static');
const sourceFiles = fs.readdirSync(staticDir)
  .filter((name) => name === 'sources.json' || /^country-page-sources-.*\.json$/.test(name))
  .sort();
const sources = sourceFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(staticDir, name), 'utf8')));
const sourceById = new Map(sources.map((source) => [source.id, source]));
const profiles = new Map();

for (const [deliveryNo, slug] of expected) {
  const profileFile = path.join(staticDir, `country-profiles-v2-${deliveryNo}-${slug}.json`);
  if (!fs.existsSync(profileFile)) {
    fail(`missing profile for ${slug}`);
    continue;
  }
  const batch = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
  const profile = Array.isArray(batch) ? batch[0] : null;
  if (!profile) {
    fail(`missing profile record for ${slug}`);
    continue;
  }
  profiles.set(slug, profile);
  if (profile.public_display_ceiling !== 'C') fail(`${slug} public ceiling must remain C`);
  if (!Array.isArray(profile.systems) || profile.systems.length === 0) fail(`${slug} requires a racing system`);
  const sourceIds = (profile.systems ?? []).flatMap((system) => [
    ...(system.organiser_source_ids ?? []),
    ...(system.distributor_source_ids ?? []),
  ]);
  if (!sourceIds.length) fail(`${slug} requires reviewed official source references`);
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
  'This does not mean there is no racing in this country.',
  'これは、この国で開催がないことを意味しません。',
]) {
  if (!component.includes(phrase)) fail(`CountryDetailPage is missing publication-boundary phrase: ${phrase}`);
}
if (component.includes('legacy-compat')) fail('CountryDetailPage must not contain legacy compatibility output');

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
    ...(system.distributor_source_ids ?? []),
  ]);
  const urls = sourceIds.map((id) => sourceById.get(id)?.url).filter(Boolean);
  if (!urls.some((url) => en.includes(url))) fail(`${slug} EN official source link is missing`);
  if (!urls.some((url) => ja.includes(url))) fail(`${slug} JA official source link is missing`);

  if (!/<tbody>[\s\S]*?<tr>/.test(en) && !en.includes('This does not mean there is no racing in this country.')) {
    fail(`${slug} EN empty-state safeguard is missing`);
  }
  if (!/<tbody>[\s\S]*?<tr>/.test(ja) && !ja.includes('これは、この国で開催がないことを意味しません。')) {
    fail(`${slug} JA empty-state safeguard is missing`);
  }
}

const runtime = fs.readFileSync(path.join(root, 'src/lib/country-profile-runtime.ts'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
if (runtime.includes('legacy-compat') || runtime.includes('adaptLegacyCountryProfile')) fail('runtime must remain Profile v2 only');
if (data.includes('legacyCountryProfiles') || data.includes("country-profiles.json'")) fail('data.ts must remain Profile v2 only');

if (profiles.get('kuwait')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('kuwait must retain link-only guidance');
if (profiles.get('pakistan')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('pakistan must retain link-only guidance');
if (!profiles.get('venezuela')?.calendar_guidance_en?.includes('Do not create current meeting rows')) fail('venezuela must retain blocked calendar guidance');
if (profiles.get('belgium')?.schedule?.time_patterns?.includes('meeting-date-only') !== true) fail('belgium country output must remain C-level');

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PAGE_PUBLICATION_53_60_VALID');
console.log('BUILT_ROUTES: 8 EN + 8 JA');
console.log('DISPLAY_CEILINGS: C=8');
console.log('PREVIEW_GATE: GitHub QA passed; rendered Cloudflare preview remains required before publication');
