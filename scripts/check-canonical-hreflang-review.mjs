import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const CONTRACT = 'data/static/canonical-hreflang-review-contract-v1.json';
const AUDIT = 'data/audits/canonical-hreflang-review-v1.json';
const LAYOUT = 'src/layouts/BaseLayout.astro';
const DOC = 'docs/seo/canonical-hreflang-review.md';
const WORKFLOW = '.github/workflows/canonical-hreflang-review.yml';
const TEMPORARY = '.github/workflows/temporary-canonical-hreflang-discovery.yml';
const SITEMAP = 'dist/sitemap.xml';
const UNPAIRED_PATHS = [
  '/major-countries/preview-timetable/',
  '/major-countries/source-health/',
  '/major-countries/timetable/',
];

const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [CONTRACT, AUDIT, LAYOUT, DOC, WORKFLOW, SITEMAP]) expect(fs.existsSync(file), `Missing ${file}`);
expect(!fs.existsSync(TEMPORARY), 'Temporary canonical hreflang discovery workflow remains');

const contract = json(CONTRACT);
const audit = json(AUDIT);
expect(contract.schema_version === 'canonical-hreflang-review-contract-v1' && contract.status === 'complete', 'Canonical hreflang contract identity differs');
expect(contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'Canonical hreflang scope marker differs');
expect(contract.site_origin === SITE_ORIGIN, 'Canonical hreflang origin differs');
expect(exact(contract.unpaired_paths, UNPAIRED_PATHS), 'Canonical hreflang unpaired paths differ');
expect(audit.schema_version === 'canonical-hreflang-review-audit-v1' && audit.status === 'complete', 'Canonical hreflang audit identity differs');
expect(audit.scope_updated_by === contract.scope_updated_by, 'Canonical hreflang audit scope marker differs');
for (const key of [
  'public_pages', 'canonical_links', 'unique_canonical_urls', 'paired_pages', 'bilingual_clusters',
  'english_paired_pages', 'japanese_paired_pages', 'unpaired_pages', 'unpaired_english_pages',
  'unpaired_japanese_pages', 'hreflang_links', 'self_hreflang_links', 'alternate_hreflang_links',
  'x_default_links', 'language_switch_links', 'unpaired_language_switch_home_fallbacks',
  'faq_bilingual_clusters', 'methods_bilingual_clusters',
]) expect(audit.verified[key] === contract.scope[key], `Canonical hreflang historical audit ${key} differs`);
for (const key of [
  'canonical_self_mismatches', 'canonical_origin_errors', 'canonical_query_or_fragment_errors',
  'canonical_trailing_slash_errors', 'missing_self_links', 'missing_alternate_links',
  'missing_x_default_links', 'unexpected_hreflang_links', 'reciprocal_errors', 'cluster_set_errors',
  'language_errors', 'x_default_errors', 'unpaired_hreflang_errors', 'faq_cluster_errors',
  'methods_cluster_errors', 'contract_errors', 'output_errors',
]) expect(audit.verified[key] === 0, `Canonical hreflang historical audit ${key} differs`);
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'Canonical hreflang privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'Canonical hreflang automation boundary differs');

const layout = read(LAYOUT);
for (const marker of ['metadataAlternateHref', 'languageSwitchHref', 'explicitAlternateHref', 'hreflang="x-default"', 'alternatePath', 'site-nav__language']) {
  expect(layout.includes(marker), `BaseLayout canonical/hreflang marker missing: ${marker}`);
}
const doc = read(DOC);
for (const marker of [
  'CANONICAL-HREFLANG-REVIEW-01',
  `${contract.scope.canonical_links} canonical links`,
  `${contract.scope.bilingual_clusters} bilingual clusters`,
  `${contract.scope.hreflang_links.toLocaleString('en-US')} hreflang links`,
  '/faq/', '/ja/faq/', '/methods/', '/ja/methods/',
]) expect(doc.includes(marker), `Canonical hreflang historical documentation marker missing: ${marker}`);

function decode(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const fileFor = (urlString) => {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
};

const urls = [...read(SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
expect(urls.length >= contract.scope.public_pages, `Canonical hreflang current sitemap shrank ${urls.length} < ${contract.scope.public_pages}`);
expect(new Set(urls).size === urls.length, 'Canonical hreflang sitemap contains duplicate URLs');
const currentUnpairedPages = UNPAIRED_PATHS.length;
const currentPairedPages = urls.length - currentUnpairedPages;
expect(currentPairedPages >= contract.scope.paired_pages, `Canonical hreflang paired-page scope shrank ${currentPairedPages}`);
expect(currentPairedPages % 2 === 0, `Canonical hreflang paired-page count is not bilingual ${currentPairedPages}`);
const currentBilingualClusters = currentPairedPages / 2;
const currentEnglishPairedPages = currentBilingualClusters;
const currentJapanesePairedPages = currentBilingualClusters;
const currentHreflangLinks = currentPairedPages * 3;

const pages = new Map();
let canonicalLinks = 0;
let languageSwitchLinks = 0;
for (const url of urls) {
  const file = fileFor(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  expect(['en', 'ja'].includes(lang), `${url}: unsupported language ${lang}`);
  const links = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const canonicals = links.filter((link) => link.rel === 'canonical');
  canonicalLinks += canonicals.length;
  expect(canonicals.length === 1 && canonicals[0].href === url, `${url}: self-canonical differs`);
  const canonical = new URL(canonicals[0].href);
  expect(canonical.origin === SITE_ORIGIN && canonical.protocol === 'https:' && !canonical.search && !canonical.hash, `${url}: canonical origin or state differs`);
  expect(canonical.pathname === '/' || canonical.pathname.endsWith('/'), `${url}: canonical trailing slash differs`);
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const languageItems = [...html.matchAll(/<li\s+[^>]*class="[^"]*site-nav__language[^"]*"[^>]*>([\s\S]*?)<\/li>/g)];
  expect(languageItems.length === 1, `${url}: language-switch item count differs ${languageItems.length}`);
  const anchor = languageItems[0][1].match(/<a\s+[^>]*>/)?.[0];
  const languageSwitch = anchor ? attrs(anchor) : {};
  expect(languageSwitch.href && languageSwitch.hreflang, `${url}: language-switch link is incomplete`);
  languageSwitchLinks += 1;
  pages.set(url, { url, pathname: canonical.pathname, lang, alternates, languageSwitch });
}

let pairedPages = 0;
let englishPaired = 0;
let japanesePaired = 0;
let hreflangLinks = 0;
let selfLinks = 0;
let oppositeLinks = 0;
let xDefaultLinks = 0;
let homeFallbacks = 0;
const clusters = new Set();
for (const page of pages.values()) {
  if (UNPAIRED_PATHS.includes(page.pathname)) {
    expect(page.alternates.length === 0, `${page.url}: unpaired page emits hreflang`);
    expect(page.lang === 'en', `${page.url}: unpaired page language differs`);
    expect(page.languageSwitch.href === '/ja/' && page.languageSwitch.hreflang === 'ja', `${page.url}: unpaired language fallback differs`);
    homeFallbacks += 1;
    continue;
  }
  pairedPages += 1;
  if (page.lang === 'en') englishPaired += 1; else japanesePaired += 1;
  hreflangLinks += page.alternates.length;
  expect(page.alternates.length === 3, `${page.url}: paired hreflang count differs ${page.alternates.length}`);
  const byLang = new Map(page.alternates.map((link) => [link.hreflang, link.href]));
  expect(exact([...byLang.keys()].sort(), ['en', 'ja', 'x-default']), `${page.url}: hreflang language set differs`);
  const oppositeLang = page.lang === 'en' ? 'ja' : 'en';
  const oppositeTarget = byLang.get(oppositeLang);
  expect(byLang.get(page.lang) === page.url, `${page.url}: self hreflang differs`);
  selfLinks += 1;
  expect(oppositeTarget && pages.has(oppositeTarget), `${page.url}: opposite hreflang target is missing`);
  oppositeLinks += 1;
  expect(byLang.get('x-default') === byLang.get('en'), `${page.url}: x-default differs`);
  xDefaultLinks += 1;
  expect(page.languageSwitch.href === new URL(oppositeTarget).pathname && page.languageSwitch.hreflang === oppositeLang, `${page.url}: language switch differs`);
  const oppositePage = pages.get(oppositeTarget);
  const oppositeSet = new Map(oppositePage.alternates.map((link) => [link.hreflang, link.href]));
  expect(exact([...byLang.entries()].sort(), [...oppositeSet.entries()].sort()), `${page.url}: reciprocal cluster set differs`);
  clusters.add([byLang.get('en'), byLang.get('ja')].sort().join('\u0000'));
}

function verifyExplicitPair(pair, label) {
  const enUrl = `${SITE_ORIGIN}${pair.english_path}`;
  const jaUrl = `${SITE_ORIGIN}${pair.japanese_path}`;
  const en = pages.get(enUrl);
  const ja = pages.get(jaUrl);
  expect(en && ja, `${label} bilingual pages are missing`);
  const expected = new Map([['en', enUrl], ['ja', jaUrl], ['x-default', `${SITE_ORIGIN}${pair.x_default_target}`]]);
  for (const page of [en, ja]) {
    const actual = new Map(page.alternates.map((link) => [link.hreflang, link.href]));
    expect(exact([...actual.entries()].sort(), [...expected.entries()].sort()), `${label} hreflang cluster differs`);
  }
}
verifyExplicitPair(contract.faq_pair_contract, 'FAQ');
verifyExplicitPair(contract.methods_pair_contract, 'Methods');

for (const [label, actual, expected] of [
  ['canonical links', canonicalLinks, urls.length],
  ['language switches', languageSwitchLinks, urls.length],
  ['paired pages', pairedPages, currentPairedPages],
  ['English paired pages', englishPaired, currentEnglishPairedPages],
  ['Japanese paired pages', japanesePaired, currentJapanesePairedPages],
  ['bilingual clusters', clusters.size, currentBilingualClusters],
  ['hreflang links', hreflangLinks, currentHreflangLinks],
  ['self links', selfLinks, currentPairedPages],
  ['opposite links', oppositeLinks, currentPairedPages],
  ['x-default links', xDefaultLinks, currentPairedPages],
  ['unpaired fallbacks', homeFallbacks, currentUnpairedPages],
]) expect(actual === expected, `${label} differ ${actual} !== ${expected}`);

expect(currentUnpairedPages === contract.scope.unpaired_pages, 'Canonical hreflang unpaired-page scope changed');
expect(homeFallbacks === contract.scope.unpaired_language_switch_home_fallbacks, 'Canonical hreflang unpaired fallback scope changed');
expect(currentBilingualClusters >= contract.scope.bilingual_clusters, 'Canonical hreflang bilingual cluster scope shrank');

console.log('CANONICAL_HREFLANG_REVIEW: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.scope.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${urls.length}`);
console.log(`HISTORICAL_BILINGUAL_CLUSTERS: ${contract.scope.bilingual_clusters}`);
console.log(`CURRENT_BILINGUAL_CLUSTERS: ${currentBilingualClusters}`);
console.log(`CURRENT_HREFLANG_LINKS: ${currentHreflangLinks}`);
console.log('FAQ_BILINGUAL_CLUSTERS: 1');
console.log('METHODS_BILINGUAL_CLUSTERS: 1');
