import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const SITE_ORIGIN = 'https://whr.badjoke-lab.com';

const contractPath = 'data/static/canonical-hreflang-review-contract-v1.json';
const auditPath = 'data/audits/canonical-hreflang-review-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const docPath = 'docs/seo/canonical-hreflang-review.md';
const workflowPath = '.github/workflows/canonical-hreflang-review.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-canonical-hreflang-discovery.yml';
const unpairedPaths = [
  '/major-countries/preview-timetable/',
  '/major-countries/source-health/',
  '/major-countries/timetable/',
];

for (const required of [contractPath, auditPath, layoutPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary canonical hreflang discovery workflow remains');

const expectedScope = {
  public_pages: 769,
  canonical_links: 769,
  unique_canonical_urls: 769,
  paired_pages: 766,
  bilingual_clusters: 383,
  english_paired_pages: 383,
  japanese_paired_pages: 383,
  unpaired_pages: 3,
  unpaired_english_pages: 3,
  unpaired_japanese_pages: 0,
  hreflang_links: 2298,
  self_hreflang_links: 766,
  alternate_hreflang_links: 766,
  x_default_links: 766,
  language_switch_links: 769,
  unpaired_language_switch_home_fallbacks: 3,
  faq_bilingual_clusters: 1,
};

const contract = fs.existsSync(filePath(contractPath)) ? parse(contractPath) : {};
const audit = fs.existsSync(filePath(auditPath)) ? parse(auditPath) : {};
if (contract.schema_version !== 'canonical-hreflang-review-contract-v1') fail('canonical hreflang contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('canonical hreflang Work ID differs');
if (contract.implementation_unit !== 'CANONICAL-HREFLANG-REVIEW-01') fail('canonical hreflang implementation unit differs');
if (contract.status !== 'complete') fail('canonical hreflang contract status differs');
if (contract.reviewed_at !== '2026-07-18') fail('canonical hreflang review date differs');
if (contract.scope_updated_by !== 'FAQ-CONTENT-PAGES-01') fail('canonical hreflang scope update marker differs');
if (contract.site_origin !== SITE_ORIGIN) fail('canonical hreflang origin differs');
if (!exact(contract.scope, expectedScope)) fail('canonical hreflang scope differs');
if (!exact(contract.unpaired_paths, unpairedPaths)) fail('canonical hreflang unpaired paths differ');
if (contract.faq_pair_contract?.english_path !== '/faq/' || contract.faq_pair_contract?.japanese_path !== '/ja/faq/' || contract.faq_pair_contract?.x_default_target !== '/faq/') fail('FAQ hreflang pair contract differs');
if (Object.values(contract.privacy_boundary ?? {}).some((value) => value !== false)) fail('canonical hreflang privacy boundary differs');
if (Object.values(contract.automation_boundary ?? {}).some((value) => value !== false)) fail('canonical hreflang automation boundary differs');

if (audit.schema_version !== 'canonical-hreflang-review-audit-v1') fail('canonical hreflang audit schema differs');
if (audit.status !== 'complete') fail('canonical hreflang audit status differs');
if (audit.reviewed_at !== contract.reviewed_at || audit.scope_updated_by !== contract.scope_updated_by) fail('canonical hreflang audit scope identity differs');
for (const [key, value] of Object.entries({
  public_pages: 769,
  canonical_links: 769,
  unique_canonical_urls: 769,
  paired_pages: 766,
  bilingual_clusters: 383,
  english_paired_pages: 383,
  japanese_paired_pages: 383,
  unpaired_pages: 3,
  hreflang_links: 2298,
  self_hreflang_links: 766,
  alternate_hreflang_links: 766,
  x_default_links: 766,
  language_switch_links: 769,
  faq_bilingual_clusters: 1,
})) if (audit.verified?.[key] !== value) fail(`canonical hreflang audit ${key} differs`);
for (const key of ['canonical_self_mismatches', 'canonical_origin_errors', 'canonical_query_or_fragment_errors', 'canonical_trailing_slash_errors', 'missing_self_links', 'missing_alternate_links', 'missing_x_default_links', 'unexpected_hreflang_links', 'reciprocal_errors', 'cluster_set_errors', 'language_errors', 'x_default_errors', 'unpaired_hreflang_errors', 'faq_cluster_errors', 'contract_errors', 'output_errors']) {
  if (audit.verified?.[key] !== 0) fail(`canonical hreflang audit ${key} differs`);
}

const layout = fs.existsSync(filePath(layoutPath)) ? read(layoutPath) : '';
for (const marker of [
  'metadataAlternateHref',
  'languageSwitchHref',
  'explicitAlternateHref',
  'hreflang="x-default"',
  'alternatePath',
  'site-nav__language',
]) if (!layout.includes(marker)) fail(`BaseLayout canonical/hreflang marker missing ${marker}`);

const doc = fs.existsSync(filePath(docPath)) ? read(docPath) : '';
for (const marker of ['CANONICAL-HREFLANG-REVIEW-01', '769 canonical links', '383 bilingual clusters', '2,298 hreflang links', '/faq/', '/ja/faq/']) {
  if (!doc.includes(marker)) fail(`canonical hreflang documentation missing ${marker}`);
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? filePath('dist/index.html') : filePath(path.join('dist', pathname.replace(/^\//, ''), 'index.html'));
}

const sitemapPath = filePath('dist/sitemap.xml');
if (!fs.existsSync(sitemapPath)) fail('dist/sitemap.xml is missing; run npm run build first');
const urls = fs.existsSync(sitemapPath) ? [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]) : [];
if (urls.length !== 769) fail(`canonical hreflang sitemap count differs ${urls.length}`);
if (urls.length !== new Set(urls).size) fail('canonical hreflang sitemap contains duplicate URLs');

const pages = new Map();
let canonicalLinks = 0;
let languageSwitchLinks = 0;
for (const url of urls) {
  const file = renderedFile(url);
  if (!fs.existsSync(file)) {
    fail(`${url}: rendered file is missing`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  if (!['en', 'ja'].includes(lang)) fail(`${url}: unsupported html lang ${lang}`);
  const linkTags = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const canonicals = linkTags.filter((link) => link.rel === 'canonical');
  canonicalLinks += canonicals.length;
  if (canonicals.length !== 1 || canonicals[0].href !== url) fail(`${url}: self-canonical differs`);
  let canonicalUrl;
  try { canonicalUrl = new URL(canonicals[0]?.href ?? ''); }
  catch { canonicalUrl = null; fail(`${url}: invalid canonical URL`); }
  if (canonicalUrl && (canonicalUrl.origin !== SITE_ORIGIN || canonicalUrl.protocol !== 'https:' || canonicalUrl.search || canonicalUrl.hash || (canonicalUrl.pathname !== '/' && !canonicalUrl.pathname.endsWith('/')))) fail(`${url}: canonical URL contract differs`);

  const alternates = linkTags.filter((link) => link.rel === 'alternate' && link.hreflang);
  const languageListItems = [...html.matchAll(/<li\s+[^>]*class="[^"]*site-nav__language[^"]*"[^>]*>([\s\S]*?)<\/li>/g)];
  if (languageListItems.length !== 1) fail(`${url}: language-switch list item count differs ${languageListItems.length}`);
  const switchAnchor = languageListItems[0]?.[1].match(/<a\s+[^>]*>/)?.[0];
  const languageSwitch = switchAnchor ? attrs(switchAnchor) : {};
  if (!languageSwitch.href || !languageSwitch.hreflang) fail(`${url}: language-switch link is incomplete`);
  else languageSwitchLinks += 1;
  pages.set(url, { url, pathname: new URL(url).pathname, html, lang, alternates, languageSwitch });
}

let pairedPages = 0;
let englishPaired = 0;
let japanesePaired = 0;
let hreflangLinks = 0;
let selfLinks = 0;
let oppositeLinks = 0;
let xDefaultLinks = 0;
let homeFallbacks = 0;
const clusterKeys = new Set();

for (const page of pages.values()) {
  const isUnpaired = unpairedPaths.includes(page.pathname);
  if (isUnpaired) {
    if (page.alternates.length !== 0) fail(`${page.url}: unpaired page emits hreflang links`);
    if (page.lang !== 'en') fail(`${page.url}: unpaired page language differs`);
    if (page.languageSwitch.href !== '/ja/' || page.languageSwitch.hreflang !== 'ja') fail(`${page.url}: unpaired language-switch fallback differs`);
    else homeFallbacks += 1;
    continue;
  }

  pairedPages += 1;
  if (page.lang === 'en') englishPaired += 1;
  else japanesePaired += 1;
  hreflangLinks += page.alternates.length;
  if (page.alternates.length !== 3) {
    fail(`${page.url}: paired hreflang count differs ${page.alternates.length}`);
    continue;
  }
  const byLang = new Map(page.alternates.map((link) => [link.hreflang, link.href]));
  if (!exact([...byLang.keys()].sort(), ['en', 'ja', 'x-default'])) fail(`${page.url}: hreflang language set differs`);
  const selfTarget = byLang.get(page.lang);
  const oppositeLang = page.lang === 'en' ? 'ja' : 'en';
  const oppositeTarget = byLang.get(oppositeLang);
  const englishTarget = byLang.get('en');
  if (selfTarget === page.url) selfLinks += 1; else fail(`${page.url}: self hreflang differs`);
  if (oppositeTarget && pages.has(oppositeTarget)) oppositeLinks += 1; else fail(`${page.url}: opposite hreflang target is missing`);
  if (byLang.get('x-default') === englishTarget) xDefaultLinks += 1; else fail(`${page.url}: x-default differs`);
  if (page.languageSwitch.href !== new URL(oppositeTarget).pathname || page.languageSwitch.hreflang !== oppositeLang) fail(`${page.url}: paired language switch differs`);

  const oppositePage = pages.get(oppositeTarget);
  if (oppositePage) {
    const oppositeSet = new Map(oppositePage.alternates.map((link) => [link.hreflang, link.href]));
    if (!exact([...byLang.entries()].sort(), [...oppositeSet.entries()].sort())) fail(`${page.url}: reciprocal cluster set differs`);
  }
  clusterKeys.add([byLang.get('en'), byLang.get('ja')].sort().join('\u0000'));
}

const faqEn = pages.get(`${SITE_ORIGIN}/faq/`);
const faqJa = pages.get(`${SITE_ORIGIN}/ja/faq/`);
if (!faqEn || !faqJa) fail('FAQ bilingual pages are missing');
else {
  const enSet = new Map(faqEn.alternates.map((link) => [link.hreflang, link.href]));
  const jaSet = new Map(faqJa.alternates.map((link) => [link.hreflang, link.href]));
  const expectedFaqSet = new Map([
    ['en', `${SITE_ORIGIN}/faq/`],
    ['ja', `${SITE_ORIGIN}/ja/faq/`],
    ['x-default', `${SITE_ORIGIN}/faq/`],
  ]);
  if (!exact([...enSet.entries()].sort(), [...expectedFaqSet.entries()].sort()) || !exact([...jaSet.entries()].sort(), [...expectedFaqSet.entries()].sort())) fail('FAQ hreflang cluster differs');
}

for (const [label, actual, expected] of [
  ['canonical link total', canonicalLinks, 769],
  ['language-switch link total', languageSwitchLinks, 769],
  ['paired page total', pairedPages, 766],
  ['English paired pages', englishPaired, 383],
  ['Japanese paired pages', japanesePaired, 383],
  ['bilingual clusters', clusterKeys.size, 383],
  ['hreflang link total', hreflangLinks, 2298],
  ['self hreflang links', selfLinks, 766],
  ['opposite hreflang links', oppositeLinks, 766],
  ['x-default links', xDefaultLinks, 766],
  ['unpaired language-switch fallbacks', homeFallbacks, 3],
]) if (actual !== expected) fail(`${label} differs ${actual}`);

if (errors.length) {
  console.error(`CANONICAL_HREFLANG_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CANONICAL_HREFLANG_REVIEW: pass');
console.log('PUBLIC_PAGES: 769');
console.log('CANONICAL_LINKS: 769');
console.log('PAIRED_PAGES: 766');
console.log('BILINGUAL_CLUSTERS: 383');
console.log('HREFLANG_LINKS: 2298');
console.log('FAQ_BILINGUAL_CLUSTERS: 1');
console.log('UNPAIRED_PAGES: 3');
console.log('NEXT_IMPLEMENTATION_UNIT: OPEN-GRAPH-SOCIAL-CARDS-01');
