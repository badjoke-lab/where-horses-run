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

for (const requiredPath of [contractPath, auditPath, layoutPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  public_pages: 767,
  canonical_links: 767,
  unique_canonical_urls: 767,
  paired_pages: 764,
  bilingual_clusters: 382,
  english_paired_pages: 382,
  japanese_paired_pages: 382,
  unpaired_pages: 3,
  unpaired_english_pages: 3,
  unpaired_japanese_pages: 0,
  hreflang_links: 2292,
  self_hreflang_links: 764,
  alternate_hreflang_links: 764,
  x_default_links: 764,
  language_switch_links: 767,
  unpaired_language_switch_home_fallbacks: 3,
};
const expectedVerified = {
  public_pages: 767,
  canonical_links: 767,
  unique_canonical_urls: 767,
  canonical_self_mismatches: 0,
  canonical_origin_errors: 0,
  canonical_query_or_fragment_errors: 0,
  canonical_trailing_slash_errors: 0,
  paired_pages: 764,
  bilingual_clusters: 382,
  english_paired_pages: 382,
  japanese_paired_pages: 382,
  unpaired_pages: 3,
  unpaired_english_pages: 3,
  unpaired_japanese_pages: 0,
  hreflang_links: 2292,
  self_hreflang_links: 764,
  alternate_hreflang_links: 764,
  x_default_links: 764,
  missing_self_links: 0,
  missing_alternate_links: 0,
  missing_x_default_links: 0,
  unexpected_hreflang_links: 0,
  reciprocal_errors: 0,
  cluster_set_errors: 0,
  language_errors: 0,
  x_default_errors: 0,
  unpaired_hreflang_errors: 0,
  language_switch_links: 767,
  unpaired_language_switch_home_fallbacks: 3,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
};
const expectedUnpairedPaths = [
  '/major-countries/preview-timetable/',
  '/major-countries/source-health/',
  '/major-countries/timetable/',
];
const expectedPublicBoundary = {
  public_canonical_metadata_allowed: true,
  verified_localized_pair_metadata_allowed: true,
  x_default_to_english_version_allowed: true,
  false_localized_equivalence_allowed: false,
  query_state_canonical_allowed: false,
  cross_origin_canonical_allowed: false,
  automatic_redirect_added: false,
};
const expectedPrivacyBoundary = {
  visitor_language_detection_enabled: false,
  visitor_identifiers_enabled: false,
  interaction_logging_enabled: false,
  cookies_enabled: false,
  client_storage_enabled: false,
  analytics_added: false,
};
const expectedAutomationBoundary = {
  external_seo_service_enabled: false,
  automatic_route_inference_enabled: false,
  automatic_translation_enabled: false,
  automatic_publication_enabled: false,
  deployment_enabled: false,
};

if (contract.schema_version !== 'canonical-hreflang-review-contract-v1') fail('canonical hreflang contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('canonical hreflang Work ID differs');
if (contract.implementation_unit !== 'CANONICAL-HREFLANG-REVIEW-01') fail('canonical hreflang implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('canonical hreflang release state differs');
if (contract.site_origin !== SITE_ORIGIN) fail('canonical hreflang site origin differs');
if (!exact(contract.scope, expectedScope)) fail('canonical hreflang scope differs');
if (!exact(contract.canonical_contract, {
  one_canonical_per_public_page: true,
  canonical_is_self_referencing: true,
  canonical_matches_sitemap_url: true,
  https_required: true,
  same_origin_required: true,
  query_parameters_allowed: false,
  fragments_allowed: false,
  trailing_slash_required: true,
  duplicate_canonicals_allowed: false,
})) fail('canonical contract differs');
if (!exact(contract.hreflang_contract, {
  languages: ['en', 'ja'],
  paired_pages_only: true,
  links_per_paired_page: 3,
  self_reference_required: true,
  opposite_locale_reference_required: true,
  reciprocal_reference_required: true,
  identical_cluster_sets_required: true,
  x_default_required: true,
  x_default_target: 'english-version',
  fully_qualified_urls_required: true,
  unpaired_pages_must_omit_hreflang: true,
  explicit_alternate_path_may_define_pair: true,
})) fail('hreflang contract differs');
if (!exact(contract.navigation_separation_contract, {
  language_switch_remains_on_every_public_page: true,
  paired_page_switch_targets_counterpart: true,
  unpaired_english_switch_targets_japanese_home: true,
  unpaired_japanese_switch_targets_english_home: true,
  navigation_fallback_must_not_create_hreflang_equivalence: true,
})) fail('canonical navigation separation contract differs');
if (!exact(contract.unpaired_paths, expectedUnpairedPaths)) fail('canonical unpaired paths differ');
if (!exact(contract.public_boundary, expectedPublicBoundary)) fail('canonical hreflang public boundary differs');
if (!exact(contract.privacy_boundary, expectedPrivacyBoundary)) fail('canonical hreflang privacy boundary differs');
if (!exact(contract.automation_boundary, expectedAutomationBoundary)) fail('canonical hreflang automation boundary differs');
if (contract.previous_implementation_unit !== 'GLOSSARY-PAGE-METADATA-01' || contract.next_implementation_unit !== 'OPEN-GRAPH-SOCIAL-CARDS-01') fail('canonical hreflang roadmap differs');

if (audit.schema_version !== 'canonical-hreflang-review-audit-v1') fail('canonical hreflang audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('canonical hreflang audit identity differs');
if (audit.status !== 'complete' || !exact(audit.verified, expectedVerified)) fail('canonical hreflang audit measurements differ');
if (!Object.values(audit.behavior ?? {}).every((value) => value === true)) fail('canonical hreflang audit behavior differs');
if (!exact(audit.unpaired_paths, expectedUnpairedPaths)) fail('canonical hreflang audit unpaired paths differ');
if (!exact(audit.public_boundary, expectedPublicBoundary) || !exact(audit.privacy_boundary, expectedPrivacyBoundary) || !exact(audit.automation_boundary, expectedAutomationBoundary)) fail('canonical hreflang audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('canonical hreflang audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  'const explicitAlternateHref = alternatePath ?? null',
  'const metadataAlternateHref = explicitAlternateHref ?? (hasBilingualCounterpart ? inferredAlternateHref : null)',
  'const defaultLanguageSwitchHref = hasBilingualCounterpart',
  'const languageSwitchHref = explicitAlternateHref ?? defaultLanguageSwitchHref',
  'const alternateUrl = metadataAlternateHref ?',
  'const xDefaultUrl = metadataAlternateHref',
  '{alternateUrl && xDefaultUrl && (',
  '<link rel="canonical" href={canonicalUrl} />',
  '<link rel="alternate" hreflang={isJapanese ? \'en\' : \'ja\'} href={alternateUrl} />',
  '<link rel="alternate" hreflang={lang} href={canonicalUrl} />',
  '<link rel="alternate" hreflang="x-default" href={xDefaultUrl} />',
  '<a href={languageSwitchHref} hreflang={isJapanese ? \'en\' : \'ja\'}>{alternateLabel}</a>',
]) if (!layout.includes(marker)) fail(`BaseLayout canonical hreflang implementation missing ${marker}`);
for (const forbidden of [
  'const alternateUrl = `${siteUrl}${languageSwitchHref}`',
  'const xDefaultUrl = `${siteUrl}${isJapanese ? languageSwitchHref : canonicalPathname}`',
  'location.href',
  'navigator.language',
  'Accept-Language',
  'document.cookie',
  'localStorage',
  'sessionStorage',
]) if (layout.includes(forbidden)) fail(`BaseLayout canonical hreflang implementation contains forbidden marker ${forbidden}`);
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary canonical hreflang discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'CANONICAL-HREFLANG-REVIEW-01',
  '767 public pages',
  '382 English/Japanese clusters',
  'Hreflang links: 2,292',
  '/major-countries/preview-timetable/',
  '/major-countries/source-health/',
  '/major-countries/timetable/',
  'metadataAlternateHref',
  'languageSwitchHref',
  'scripts/check-canonical-hreflang-review.mjs',
  '.github/workflows/canonical-hreflang-review.yml',
  'OPEN-GRAPH-SOCIAL-CARDS-01',
]) if (!doc.includes(marker)) fail(`canonical hreflang documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'node scripts/check-country-page-metadata.mjs',
  'node scripts/check-racecourse-page-metadata.mjs',
  'node scripts/check-glossary-page-metadata.mjs',
  'node scripts/check-mobile-navigation-improvement.mjs',
  'node scripts/check-canonical-hreflang-review.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`canonical hreflang workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`canonical hreflang workflow contains forbidden marker ${forbidden}`);
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

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
}

if (!fs.existsSync(filePath('dist/sitemap.xml'))) fail('generated sitemap is missing');
const sitemapUrls = fs.existsSync(filePath('dist/sitemap.xml'))
  ? [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  : [];
if (sitemapUrls.length !== 767) fail(`canonical hreflang sitemap count differs ${sitemapUrls.length}`);
if (new Set(sitemapUrls).size !== 767) fail('canonical hreflang sitemap contains duplicate URLs');

const records = new Map();
let canonicalCount = 0;
let hreflangCount = 0;
let languageSwitchCount = 0;

for (const url of sitemapUrls) {
  const file = renderedFile(url);
  if (!fs.existsSync(filePath(file))) {
    fail(`${url}: rendered page missing`);
    continue;
  }
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? null;
  const linkTags = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attributes(match[0]));
  const canonicals = linkTags.filter((link) => link.rel === 'canonical');
  const alternates = linkTags.filter((link) => link.rel === 'alternate' && link.hreflang);
  const switchTag = html.match(/<li[^>]*class="site-nav__language"[^>]*>[\s\S]*?<a\s+([^>]*)>/)?.[1];
  const languageSwitch = switchTag ? attributes(`<a ${switchTag}>`) : {};
  canonicalCount += canonicals.length;
  hreflangCount += alternates.length;
  if (languageSwitch.href) languageSwitchCount += 1;
  if (canonicals.length !== 1 || canonicals[0].href !== url) fail(`${url}: self canonical differs`);
  const canonical = canonicals[0]?.href;
  if (canonical) {
    const parsed = new URL(canonical);
    if (parsed.protocol !== 'https:' || parsed.origin !== SITE_ORIGIN) fail(`${url}: canonical origin or protocol differs`);
    if (parsed.search || parsed.hash) fail(`${url}: canonical contains query or fragment`);
    if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) fail(`${url}: canonical lacks trailing slash`);
  }
  if (!['en', 'ja'].includes(lang)) fail(`${url}: rendered language differs ${lang}`);
  records.set(url, { url, file, html, lang, alternates, languageSwitch });
}

if (canonicalCount !== 767) fail(`canonical link total differs ${canonicalCount}`);
if (languageSwitchCount !== 767) fail(`language-switch link total differs ${languageSwitchCount}`);

let pairedPageCount = 0;
let englishPairedCount = 0;
let japanesePairedCount = 0;
let unpairedPageCount = 0;
let unpairedEnglishCount = 0;
let unpairedJapaneseCount = 0;
let selfLinkCount = 0;
let oppositeLinkCount = 0;
let xDefaultCount = 0;
let unpairedFallbackCount = 0;
const clusterKeys = new Set();
const unpairedPaths = [];

for (const record of records.values()) {
  const oppositeCode = record.lang === 'ja' ? 'en' : 'ja';
  const selfLinks = record.alternates.filter((link) => link.hreflang === record.lang);
  const oppositeLinks = record.alternates.filter((link) => link.hreflang === oppositeCode);
  const xDefaultLinks = record.alternates.filter((link) => link.hreflang === 'x-default');
  const unexpected = record.alternates.filter((link) => ![record.lang, oppositeCode, 'x-default'].includes(link.hreflang));
  const counterpartUrl = oppositeLinks[0]?.href;
  const counterpart = counterpartUrl ? records.get(counterpartUrl) : null;

  if (counterpart) {
    pairedPageCount += 1;
    if (record.lang === 'en') englishPairedCount += 1;
    else japanesePairedCount += 1;
    if (record.alternates.length !== 3 || unexpected.length) fail(`${record.url}: hreflang set size or codes differ`);
    if (selfLinks.length !== 1 || selfLinks[0].href !== record.url) fail(`${record.url}: self hreflang differs`);
    else selfLinkCount += 1;
    if (oppositeLinks.length !== 1) fail(`${record.url}: opposite-locale hreflang differs`);
    else oppositeLinkCount += 1;
    const expectedDefault = record.lang === 'en' ? record.url : counterpartUrl;
    if (xDefaultLinks.length !== 1 || xDefaultLinks[0].href !== expectedDefault) fail(`${record.url}: x-default differs`);
    else xDefaultCount += 1;
    const returnLink = counterpart.alternates.find((link) => link.hreflang === record.lang);
    if (!returnLink || returnLink.href !== record.url) fail(`${record.url}: reciprocal hreflang missing`);
    const leftSet = record.alternates.map((link) => `${link.hreflang}:${link.href}`).sort();
    const rightSet = counterpart.alternates.map((link) => `${link.hreflang}:${link.href}`).sort();
    if (!exact(leftSet, rightSet)) fail(`${record.url}: bilingual cluster link sets differ`);
    const expectedSwitch = new URL(counterpartUrl).pathname;
    if (record.languageSwitch.href !== expectedSwitch || record.languageSwitch.hreflang !== oppositeCode) fail(`${record.url}: paired language switch differs`);
    clusterKeys.add([record.url, counterpartUrl].sort().join('::'));
  } else {
    unpairedPageCount += 1;
    if (record.lang === 'en') unpairedEnglishCount += 1;
    else unpairedJapaneseCount += 1;
    const pathname = new URL(record.url).pathname;
    unpairedPaths.push(pathname);
    if (record.alternates.length !== 0) fail(`${record.url}: unpaired page contains hreflang links`);
    const expectedFallback = record.lang === 'ja' ? '/' : '/ja/';
    if (record.languageSwitch.href !== expectedFallback || record.languageSwitch.hreflang !== oppositeCode) fail(`${record.url}: unpaired language-switch fallback differs`);
    else unpairedFallbackCount += 1;
  }
}

unpairedPaths.sort();
if (hreflangCount !== 2292) fail(`hreflang link total differs ${hreflangCount}`);
if (pairedPageCount !== 764) fail(`paired page total differs ${pairedPageCount}`);
if (clusterKeys.size !== 382) fail(`bilingual cluster total differs ${clusterKeys.size}`);
if (englishPairedCount !== 382 || japanesePairedCount !== 382) fail('paired locale totals differ');
if (unpairedPageCount !== 3 || unpairedEnglishCount !== 3 || unpairedJapaneseCount !== 0) fail('unpaired page totals differ');
if (!exact(unpairedPaths, expectedUnpairedPaths)) fail(`rendered unpaired paths differ ${JSON.stringify(unpairedPaths)}`);
if (selfLinkCount !== 764) fail(`self hreflang total differs ${selfLinkCount}`);
if (oppositeLinkCount !== 764) fail(`opposite hreflang total differs ${oppositeLinkCount}`);
if (xDefaultCount !== 764) fail(`x-default total differs ${xDefaultCount}`);
if (unpairedFallbackCount !== 3) fail(`unpaired language-switch fallback total differs ${unpairedFallbackCount}`);

if (errors.length) {
  console.error(`CANONICAL_HREFLANG_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CANONICAL_HREFLANG_REVIEW: pass');
console.log('PUBLIC_PAGES: 767');
console.log('CANONICAL_LINKS: 767');
console.log('BILINGUAL_CLUSTERS: 382');
console.log('PAIRED_PAGES: 764');
console.log('HREFLANG_LINKS: 2292');
console.log('UNPAIRED_PAGES: 3');
console.log('RECIPROCAL_ERRORS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: OPEN-GRAPH-SOCIAL-CARDS-01');
