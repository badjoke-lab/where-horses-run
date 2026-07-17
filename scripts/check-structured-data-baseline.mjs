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
const componentPath = 'src/components/StructuredDataBaseline.astro';
const docPath = 'docs/seo/structured-data-baseline.md';
const workflowPath = '.github/workflows/structured-data-baseline.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-structured-data-baseline-discovery.yml';

for (const required of [contractPath, auditPath, layoutPath, componentPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary structured-data discovery workflow remains');

const contract = fs.existsSync(filePath(contractPath)) ? parse(contractPath) : {};
const audit = fs.existsSync(filePath(auditPath)) ? parse(auditPath) : {};
const expectedScope = {
  public_pages: 769,
  english_pages: 386,
  japanese_pages: 383,
  json_ld_scripts: 769,
  graph_nodes: 1538,
  website_nodes: 769,
  webpage_nodes: 769,
  schema_types: 2,
};
if (contract.schema_version !== 'structured-data-baseline-contract-v1') fail('structured-data contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('structured-data Work ID differs');
if (contract.implementation_unit !== 'STRUCTURED-DATA-BASELINE-01') fail('structured-data implementation unit differs');
if (contract.status !== 'complete') fail('structured-data contract status differs');
if (contract.reviewed_at !== '2026-07-18') fail('structured-data review date differs');
if (contract.scope_updated_by !== 'FAQ-CONTENT-PAGES-01') fail('structured-data scope update marker differs');
if (!exact(contract.scope, expectedScope)) fail('structured-data scope differs');
if (contract.website_contract?.id !== WEBSITE_ID || contract.website_contract?.url !== `${SITE_ORIGIN}/`) fail('WebSite identity contract differs');
if (contract.serialization_contract?.scripts_per_page !== 1 || contract.serialization_contract?.graph_nodes_per_page !== 2) fail('baseline serialization count differs');
if (contract.page_specific_script_boundary?.faq_page_scripts !== 2 || contract.page_specific_script_boundary?.faq_question_nodes !== 24) fail('FAQ page-specific script boundary differs');
if (Object.values(contract.privacy_boundary ?? {}).some((value) => value !== false)) fail('structured-data privacy boundary differs');
if (Object.values(contract.automation_boundary ?? {}).some((value) => value !== false)) fail('structured-data automation boundary differs');

if (audit.schema_version !== 'structured-data-baseline-audit-v1') fail('structured-data audit schema differs');
if (audit.status !== 'complete') fail('structured-data audit status differs');
if (audit.reviewed_at !== contract.reviewed_at || audit.scope_updated_by !== contract.scope_updated_by) fail('structured-data audit scope identity differs');
for (const [key, value] of Object.entries({
  public_pages: 769,
  english_pages: 386,
  japanese_pages: 383,
  json_ld_scripts: 769,
  valid_json_scripts: 769,
  website_nodes: 769,
  webpage_nodes: 769,
  faq_page_scripts_outside_baseline: 2,
  faq_question_nodes_outside_baseline: 24,
})) if (audit.verified?.[key] !== value) fail(`structured-data audit ${key} differs`);
for (const key of ['missing_scripts', 'multiple_scripts', 'context_mismatches', 'website_id_mismatches', 'website_field_mismatches', 'webpage_id_mismatches', 'canonical_url_mismatches', 'title_mismatches', 'description_mismatches', 'language_mismatches', 'website_relation_mismatches', 'unexpected_baseline_types', 'unsafe_less_than_characters', 'contract_errors', 'rendered_marker_errors']) {
  if (audit.verified?.[key] !== 0) fail(`structured-data audit ${key} differs`);
}

const layout = fs.existsSync(filePath(layoutPath)) ? read(layoutPath) : '';
for (const marker of [
  "import StructuredDataBaseline from '../components/StructuredDataBaseline.astro'",
  '<StructuredDataBaseline',
  'title={title}',
  'description={description}',
  'canonicalUrl={canonicalUrl}',
  'siteUrl={siteUrl}',
]) if (!layout.includes(marker)) fail(`BaseLayout structured-data delegation missing ${marker}`);

const component = fs.existsSync(filePath(componentPath)) ? read(componentPath) : '';
for (const marker of [
  "'@context': 'https://schema.org'",
  "'@type': 'WebSite'",
  "'@type': 'WebPage'",
  "name: 'Where Horses Run'",
  "alternateName: '競馬どこ？'",
  "data-structured-data-baseline=\"website-webpage-v1\"",
  'JSON.stringify(structuredData).replace(/</g',
]) if (!component.includes(marker)) fail(`structured-data component missing ${marker}`);
for (const forbidden of ['Organization', 'SearchAction', 'SportsEvent', 'Person', 'BreadcrumbList', 'FAQPage']) {
  if (component.includes(forbidden)) fail(`baseline component contains page-specific or unsupported type ${forbidden}`);
}

const doc = fs.existsSync(filePath(docPath)) ? read(docPath) : '';
for (const marker of ['STRUCTURED-DATA-BASELINE-01', '769 public pages', 'English pages: 386', 'Japanese pages: 383', 'FAQPage scripts: 2']) {
  if (!doc.includes(marker)) fail(`structured-data documentation missing ${marker}`);
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

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? filePath('dist/index.html') : filePath(path.join('dist', pathname.replace(/^\//, ''), 'index.html'));
}

const sitemapPath = filePath('dist/sitemap.xml');
if (!fs.existsSync(sitemapPath)) fail('dist/sitemap.xml is missing; run npm run build first');
const urls = fs.existsSync(sitemapPath) ? [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]) : [];
if (urls.length !== 769) fail(`structured data public page count differs ${urls.length}`);

let englishPages = 0;
let japanesePages = 0;
let baselineScripts = 0;
let validJsonScripts = 0;
let websiteNodes = 0;
let webpageNodes = 0;
let faqScripts = 0;
let faqQuestionNodes = 0;

for (const url of urls) {
  const file = renderedFile(url);
  if (!fs.existsSync(file)) {
    fail(`${url}: rendered file missing`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  if (lang === 'en') englishPages += 1;
  else if (lang === 'ja') japanesePages += 1;
  else fail(`${url}: unsupported html lang ${lang}`);

  const canonicalTags = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attrs(match[0])).filter((link) => link.rel === 'canonical');
  if (canonicalTags.length !== 1 || canonicalTags[0].href !== url) fail(`${url}: canonical differs`);
  const title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metaDescription = [...html.matchAll(/<meta\s+[^>]*>/g)].map((match) => attrs(match[0])).filter((meta) => meta.name === 'description');
  const description = metaDescription.length === 1 ? metaDescription[0].content ?? '' : '';

  const scripts = [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g)];
  const baseline = scripts.filter((script) => /data-structured-data-baseline="website-webpage-v1"/.test(script[1]));
  if (baseline.length !== 1) {
    fail(`${url}: expected one baseline script, found ${baseline.length}`);
    continue;
  }
  baselineScripts += 1;
  if (baseline[0][2].includes('<')) fail(`${url}: unsafe less-than character in baseline JSON-LD`);
  let data;
  try { data = JSON.parse(baseline[0][2]); validJsonScripts += 1; }
  catch (error) { fail(`${url}: invalid baseline JSON-LD ${error.message}`); continue; }
  if (data['@context'] !== 'https://schema.org') fail(`${url}: baseline context differs`);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  if (graph.length !== 2) fail(`${url}: baseline graph node count differs ${graph.length}`);
  const websites = graph.filter((node) => node['@type'] === 'WebSite');
  const webpages = graph.filter((node) => node['@type'] === 'WebPage');
  websiteNodes += websites.length;
  webpageNodes += webpages.length;
  if (graph.some((node) => !['WebSite', 'WebPage'].includes(node['@type']))) fail(`${url}: unexpected baseline type`);
  const website = websites[0];
  const webpage = webpages[0];
  if (websites.length !== 1 || website?.['@id'] !== WEBSITE_ID || website?.url !== `${SITE_ORIGIN}/` || website?.name !== 'Where Horses Run' || website?.alternateName !== '競馬どこ？' || !exact(website?.inLanguage, ['en', 'ja'])) fail(`${url}: WebSite node differs`);
  if (webpages.length !== 1 || webpage?.['@id'] !== `${url}#webpage` || webpage?.url !== url || webpage?.name !== title || webpage?.description !== description || webpage?.inLanguage !== lang || webpage?.isPartOf?.['@id'] !== WEBSITE_ID) fail(`${url}: WebPage node differs`);

  const pageFaqScripts = scripts.filter((script) => /data-faq-structured-data="faq-page-v1"/.test(script[1]));
  faqScripts += pageFaqScripts.length;
  for (const script of pageFaqScripts) {
    try {
      const faq = JSON.parse(script[2]);
      if (faq['@type'] !== 'FAQPage') fail(`${url}: FAQ script type differs`);
      faqQuestionNodes += Array.isArray(faq.mainEntity) ? faq.mainEntity.length : 0;
    } catch (error) { fail(`${url}: invalid FAQ JSON-LD ${error.message}`); }
  }
}

for (const [label, actual, expected] of [
  ['English pages', englishPages, 386],
  ['Japanese pages', japanesePages, 383],
  ['baseline scripts', baselineScripts, 769],
  ['valid baseline scripts', validJsonScripts, 769],
  ['WebSite nodes', websiteNodes, 769],
  ['WebPage nodes', webpageNodes, 769],
  ['FAQPage scripts', faqScripts, 2],
  ['FAQ Question nodes', faqQuestionNodes, 24],
]) if (actual !== expected) fail(`${label} differ ${actual}`);

if (errors.length) {
  console.error(`STRUCTURED_DATA_BASELINE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('STRUCTURED_DATA_BASELINE: pass');
console.log('PUBLIC_PAGES: 769');
console.log('BASELINE_JSON_LD_SCRIPTS: 769');
console.log('WEBSITE_NODES: 769');
console.log('WEBPAGE_NODES: 769');
console.log('FAQPAGE_SCRIPTS_OUTSIDE_BASELINE: 2');
console.log('FAQ_QUESTION_NODES_OUTSIDE_BASELINE: 24');
console.log('NEXT_IMPLEMENTATION_UNIT: COUNTRY-PAGE-METADATA-01');
