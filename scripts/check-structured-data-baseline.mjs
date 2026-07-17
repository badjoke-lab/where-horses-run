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
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

const contractPath = 'data/static/structured-data-baseline-contract-v1.json';
const auditPath = 'data/audits/structured-data-baseline-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const docPath = 'docs/seo/structured-data-baseline.md';
const workflowPath = '.github/workflows/structured-data-baseline.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-structured-data-baseline-discovery.yml';

for (const requiredPath of [contractPath, auditPath, layoutPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);

if (contract.schema_version !== 'structured-data-baseline-contract-v1') fail('structured data contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('structured data Work ID differs');
if (contract.implementation_unit !== 'STRUCTURED-DATA-BASELINE-01') fail('structured data implementation unit differs');
if (contract.status !== 'complete') fail('structured data contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('structured data review date differs');
if (!exact(contract.scope, {
  public_pages: 767,
  english_pages: 385,
  japanese_pages: 382,
  json_ld_scripts: 767,
  graph_nodes: 1534,
  website_nodes: 767,
  webpage_nodes: 767,
  schema_types: 2,
})) fail('structured data scope differs');
if (!exact(contract.website_contract, {
  type: 'WebSite',
  id: WEBSITE_ID,
  url: `${SITE_ORIGIN}/`,
  name: 'Where Horses Run',
  alternate_name: '競馬どこ？',
  languages: ['en', 'ja'],
})) fail('WebSite contract differs');
if (!exact(contract.webpage_contract, {
  type: 'WebPage',
  id_pattern: '{canonical-url}#webpage',
  url_source: 'canonical',
  name_source: 'page-title',
  description_source: 'meta-description',
  language_source: 'html-lang',
  website_relation: WEBSITE_ID,
})) fail('WebPage contract differs');
if (!exact(contract.serialization_contract, {
  context: 'https://schema.org',
  format: 'JSON-LD',
  script_type: 'application/ld+json',
  script_marker: 'data-structured-data-baseline',
  script_marker_value: 'website-webpage-v1',
  scripts_per_page: 1,
  graph_nodes_per_page: 2,
  less_than_characters_escaped: true,
  valid_json_required: true,
})) fail('structured data serialization contract differs');
if (!exact(contract.excluded_claims, {
  organization: true,
  person: true,
  search_action: true,
  event: true,
  sports_event: true,
  place: true,
  country: true,
  defined_term: true,
  breadcrumb_list: true,
})) fail('structured data excluded claims differ');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_website_identity_allowed', 'public_page_identity_allowed', 'canonical_title_description_language_allowed'].includes(key);
  if (value !== expected) fail(`structured data public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('structured data privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('structured data automation boundary differs');
if (contract.previous_implementation_unit !== 'SITEMAP-ROBOTS-01') fail('previous structured data unit differs');
if (contract.next_implementation_unit !== 'COUNTRY-PAGE-METADATA-01') fail('next structured data unit differs');

if (audit.schema_version !== 'structured-data-baseline-audit-v1') fail('structured data audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('structured data audit identity differs');
if (audit.status !== 'complete') fail('structured data audit status differs');
if (!exact(audit.verified, {
  public_pages: 767,
  english_pages: 385,
  japanese_pages: 382,
  json_ld_scripts: 767,
  valid_json_scripts: 767,
  website_nodes: 767,
  webpage_nodes: 767,
  missing_scripts: 0,
  multiple_scripts: 0,
  context_mismatches: 0,
  website_id_mismatches: 0,
  website_field_mismatches: 0,
  webpage_id_mismatches: 0,
  canonical_url_mismatches: 0,
  title_mismatches: 0,
  description_mismatches: 0,
  language_mismatches: 0,
  website_relation_mismatches: 0,
  missing_names: 0,
  missing_descriptions: 0,
  unexpected_types: 0,
  organization_nodes: 0,
  search_action_nodes: 0,
  event_nodes: 0,
  unsafe_less_than_characters: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('structured data audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('structured data audit behavior differs');
if (!exact(audit.public_boundary, contract.public_boundary) || !exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('structured data audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('structured data audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  "const websiteId = `${siteUrl}/#website`",
  'const webpageId = `${canonicalUrl}#webpage`',
  "'@context': 'https://schema.org'",
  "'@type': 'WebSite'",
  "'@type': 'WebPage'",
  "alternateName: '競馬どこ？'",
  "inLanguage: ['en', 'ja']",
  'url: canonicalUrl',
  'name: title',
  'description,',
  'inLanguage: lang',
  "JSON.stringify(structuredData).replace(/</g, '\\u003c')",
  'type="application/ld+json"',
  'data-structured-data-baseline="website-webpage-v1"',
  'set:html={structuredDataJson}',
]) if (!layout.includes(marker)) fail(`structured data layout missing ${marker}`);
for (const forbidden of [
  "'@type': 'Organization'",
  "'@type': 'Person'",
  "'@type': 'SearchAction'",
  "'@type': 'Event'",
  "'@type': 'SportsEvent'",
  "'@type': 'Place'",
  "'@type': 'Country'",
  "'@type': 'DefinedTerm'",
  "'@type': 'BreadcrumbList'",
  'fetch(',
  'localStorage',
  'sessionStorage',
  'document.cookie',
]) if (layout.includes(forbidden)) fail(`structured data layout contains forbidden marker ${forbidden}`);
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary structured data discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'STRUCTURED-DATA-BASELINE-01',
  '767 public pages',
  'English pages: 385',
  'Japanese pages: 382',
  'Total graph nodes: 1,534',
  'data-structured-data-baseline="website-webpage-v1"',
  'https://whr.badjoke-lab.com/#website',
  '{canonical-url}#webpage',
  '`Organization` or `Person`',
  '`SearchAction`',
  '`Event` or `SportsEvent`',
  'scripts/check-structured-data-baseline.mjs',
  '.github/workflows/structured-data-baseline.yml',
  'COUNTRY-PAGE-METADATA-01',
]) if (!doc.includes(marker)) fail(`structured data documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`structured data workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`structured data workflow contains forbidden marker ${forbidden}`);
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

function attribute(html, tagPattern, attributeName) {
  const tag = html.match(tagPattern)?.[0];
  if (!tag) return null;
  const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i));
  return match ? decodeHtml(match[1]) : null;
}

function renderedFileFromUrl(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/'
    ? 'dist/index.html'
    : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
}

if (!fs.existsSync(filePath('dist/sitemap.xml'))) fail('generated sitemap is missing');
let urls = [];
if (fs.existsSync(filePath('dist/sitemap.xml'))) {
  urls = [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}
if (urls.length !== 767) fail(`structured data public page count differs ${urls.length}`);

let scriptCount = 0;
let validJsonCount = 0;
let websiteCount = 0;
let webpageCount = 0;
let englishCount = 0;
let japaneseCount = 0;
let unsafeLessThanCount = 0;

for (const url of urls) {
  const relativeFile = renderedFileFromUrl(url);
  if (!fs.existsSync(filePath(relativeFile))) {
    fail(`structured data rendered page missing: ${url}`);
    continue;
  }
  const html = read(relativeFile);
  const canonical = attribute(html, /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i, 'href');
  const lang = attribute(html, /<html\s+[^>]*>/i, 'lang');
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].replace(/<[^>]*>/g, '').trim()) : null;
  const description = attribute(html, /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i, 'content');
  if (lang === 'en') englishCount += 1;
  else if (lang === 'ja') japaneseCount += 1;
  else fail(`${url}: unsupported html language ${lang}`);

  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*data-structured-data-baseline="website-webpage-v1"[^>]*>([\s\S]*?)<\/script>/g)];
  scriptCount += scripts.length;
  if (scripts.length !== 1) {
    fail(`${url}: structured data script count differs ${scripts.length}`);
    continue;
  }
  const serialized = scripts[0][1];
  if (serialized.includes('<')) {
    unsafeLessThanCount += 1;
    fail(`${url}: unescaped less-than character in JSON-LD`);
  }

  let data;
  try {
    data = JSON.parse(serialized);
    validJsonCount += 1;
  } catch (error) {
    fail(`${url}: invalid JSON-LD ${error.message}`);
    continue;
  }
  if (data['@context'] !== 'https://schema.org') fail(`${url}: schema context differs`);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  if (graph.length !== 2) fail(`${url}: graph node count differs ${graph.length}`);
  const types = graph.map((node) => node['@type']).sort();
  if (!exact(types, ['WebPage', 'WebSite'])) fail(`${url}: graph types differ ${JSON.stringify(types)}`);
  const website = graph.find((node) => node['@type'] === 'WebSite');
  const webpage = graph.find((node) => node['@type'] === 'WebPage');
  if (website) websiteCount += 1;
  if (webpage) webpageCount += 1;
  if (!exact(website, {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: 'Where Horses Run',
    alternateName: '競馬どこ？',
    inLanguage: ['en', 'ja'],
  })) fail(`${url}: WebSite node differs`);
  if (!exact(webpage, {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
  })) fail(`${url}: WebPage node differs`);
  if (canonical !== url) fail(`${url}: rendered canonical differs ${canonical}`);
}

if (scriptCount !== 767) fail(`JSON-LD script total differs ${scriptCount}`);
if (validJsonCount !== 767) fail(`valid JSON-LD total differs ${validJsonCount}`);
if (websiteCount !== 767) fail(`WebSite node total differs ${websiteCount}`);
if (webpageCount !== 767) fail(`WebPage node total differs ${webpageCount}`);
if (englishCount !== 385) fail(`English structured page count differs ${englishCount}`);
if (japaneseCount !== 382) fail(`Japanese structured page count differs ${japaneseCount}`);
if (unsafeLessThanCount !== 0) fail(`unsafe less-than count differs ${unsafeLessThanCount}`);

if (errors.length) {
  console.error(`STRUCTURED_DATA_BASELINE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('STRUCTURED_DATA_BASELINE: pass');
console.log('PUBLIC_PAGES: 767');
console.log('JSON_LD_SCRIPTS: 767');
console.log('WEBSITE_NODES: 767');
console.log('WEBPAGE_NODES: 767');
console.log('UNSUPPORTED_TYPES: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: COUNTRY-PAGE-METADATA-01');
