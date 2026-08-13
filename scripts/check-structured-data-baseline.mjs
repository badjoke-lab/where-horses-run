import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const CONTRACT = 'data/static/structured-data-baseline-contract-v1.json';
const AUDIT = 'data/audits/structured-data-baseline-v1.json';
const SITEMAP_CONTRACT = 'data/static/sitemap-robots-contract-v1.json';
const PUBLIC_MEETING_DETAILS = 'data/generated/timetable/public/meeting-details.json';
const LAYOUT = 'src/layouts/BaseLayout.astro';
const COMPONENT = 'src/components/StructuredDataBaseline.astro';
const DOC = 'docs/seo/structured-data-baseline.md';
const WORKFLOW = '.github/workflows/structured-data-baseline.yml';
const TEMPORARY = '.github/workflows/temporary-structured-data-baseline-discovery.yml';
const SITEMAP = 'dist/sitemap.xml';

const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [CONTRACT, AUDIT, SITEMAP_CONTRACT, PUBLIC_MEETING_DETAILS, LAYOUT, COMPONENT, DOC, WORKFLOW, SITEMAP]) expect(fs.existsSync(file), `Missing ${file}`);
expect(!fs.existsSync(TEMPORARY), 'Temporary structured-data discovery workflow remains');
const contract = json(CONTRACT);
const audit = json(AUDIT);
const sitemapContract = json(SITEMAP_CONTRACT);
const publicMeetingDetails = json(PUBLIC_MEETING_DETAILS);
expect(contract.schema_version === 'structured-data-baseline-contract-v1' && contract.status === 'complete', 'Structured-data contract identity differs');
expect(contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'Structured-data scope marker differs');
expect(audit.schema_version === 'structured-data-baseline-audit-v1' && audit.status === 'complete', 'Structured-data audit identity differs');
expect(audit.scope_updated_by === contract.scope_updated_by, 'Structured-data audit scope marker differs');
for (const [auditKey, scopeKey] of [['public_pages','public_pages'],['english_pages','english_pages'],['japanese_pages','japanese_pages'],['json_ld_scripts','json_ld_scripts'],['website_nodes','website_nodes'],['webpage_nodes','webpage_nodes']]) {
  expect(audit.verified[auditKey] === contract.scope[scopeKey], `Structured-data audit ${auditKey} differs`);
}
expect(audit.verified.valid_json_scripts === contract.scope.json_ld_scripts, 'Structured-data valid JSON count differs');
expect(audit.verified.faq_page_scripts_outside_baseline === contract.page_specific_script_boundary.faq_page_scripts, 'FAQ script boundary differs');
expect(audit.verified.faq_question_nodes_outside_baseline === contract.page_specific_script_boundary.faq_question_nodes, 'FAQ question boundary differs');
expect(audit.verified.methods_page_specific_scripts === contract.page_specific_script_boundary.methods_page_specific_scripts, 'Methods script boundary differs');
for (const key of ['missing_scripts','multiple_scripts','context_mismatches','website_id_mismatches','website_field_mismatches','webpage_id_mismatches','canonical_url_mismatches','title_mismatches','description_mismatches','language_mismatches','website_relation_mismatches','unexpected_baseline_types','unsafe_less_than_characters','contract_errors','rendered_marker_errors']) expect(audit.verified[key] === 0, `Structured-data audit ${key} differs`);
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'Structured-data privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'Structured-data automation boundary differs');
expect(sitemapContract.schema_version === 'sitemap-robots-contract-v1', 'Sitemap contract identity differs');
expect(Array.isArray(publicMeetingDetails.details), 'Public meeting-detail projection differs');

const layout = read(LAYOUT);
for (const marker of ["import StructuredDataBaseline from '../components/StructuredDataBaseline.astro'", '<StructuredDataBaseline', 'canonicalUrl={canonicalUrl}', 'siteUrl={siteUrl}']) expect(layout.includes(marker), `BaseLayout structured-data marker missing: ${marker}`);
const component = read(COMPONENT);
for (const marker of ["'@context': 'https://schema.org'", "'@type': 'WebSite'", "'@type': 'WebPage'", "name: 'Where Horses Run'", "alternateName: '競馬どこ？'", 'data-structured-data-baseline="website-webpage-v1"', 'JSON.stringify(structuredData).replace(/</g']) expect(component.includes(marker), `Structured-data component marker missing: ${marker}`);
for (const forbidden of ['Organization','SearchAction','SportsEvent','Person','BreadcrumbList','FAQPage']) expect(!component.includes(forbidden), `Baseline component contains unsupported type ${forbidden}`);
const doc = read(DOC);
for (const marker of ['STRUCTURED-DATA-BASELINE-01', `${contract.scope.public_pages} public pages`, `English pages: ${contract.scope.english_pages}`, `Japanese pages: ${contract.scope.japanese_pages}`, 'Methods page-specific scripts: 0']) expect(doc.includes(marker), `Structured-data documentation marker missing: ${marker}`);

function decode(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const strip = (value) => decode(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
const fileFor = (urlString) => {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
};

const urls = [...read(SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const paths = urls.map((url) => new URL(url).pathname);
const currentRacecourseDetails = paths.filter((pathname) => /^\/(?:ja\/)?tracks\/[^/]+\/$/.test(pathname)).length;
const currentMeetingDetails = paths.filter((pathname) => /^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/.test(pathname)).length;
const historicalRacecourseDetails = sitemapContract.detail_route_counts.racecourse_detail_routes;
const historicalMeetingDetails = sitemapContract.detail_route_counts.meeting_detail_routes;
const racecourseDetailDelta = currentRacecourseDetails - historicalRacecourseDetails;
const meetingDetailDelta = currentMeetingDetails - historicalMeetingDetails;
expect(racecourseDetailDelta >= 0, `Structured-data racecourse route count regressed ${currentRacecourseDetails}`);
expect(meetingDetailDelta >= 0, `Structured-data meeting-detail route count regressed ${currentMeetingDetails}`);
expect(racecourseDetailDelta % 2 === 0, `Structured-data racecourse growth must be bilingual ${racecourseDetailDelta}`);
expect(meetingDetailDelta % 2 === 0, `Structured-data meeting-detail growth must be bilingual ${meetingDetailDelta}`);
expect(currentMeetingDetails === publicMeetingDetails.details.length * 2, `Structured-data meeting-detail routes are not backed by public projection ${currentMeetingDetails}`);
const perLanguageDelta = (racecourseDetailDelta + meetingDetailDelta) / 2;
const totalDetailDelta = racecourseDetailDelta + meetingDetailDelta;
const expectedCurrent = {
  public_pages: contract.scope.public_pages + totalDetailDelta,
  english_pages: contract.scope.english_pages + perLanguageDelta,
  japanese_pages: contract.scope.japanese_pages + perLanguageDelta,
  json_ld_scripts: contract.scope.json_ld_scripts + totalDetailDelta,
  website_nodes: contract.scope.website_nodes + totalDetailDelta,
  webpage_nodes: contract.scope.webpage_nodes + totalDetailDelta,
};
expect(urls.length === expectedCurrent.public_pages, `Structured-data public page count differs ${urls.length}`);

let english = 0;
let japanese = 0;
let baselineScripts = 0;
let validScripts = 0;
let websiteNodes = 0;
let webpageNodes = 0;
let faqScripts = 0;
let faqQuestions = 0;
let methodsSpecificScripts = 0;
for (const url of urls) {
  const file = fileFor(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  if (lang === 'en') english += 1; else if (lang === 'ja') japanese += 1; else expect(false, `${url}: unsupported language ${lang}`);
  const links = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const canonicals = links.filter((link) => link.rel === 'canonical');
  expect(canonicals.length === 1 && canonicals[0].href === url, `${url}: canonical differs`);
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metas = [...html.matchAll(/<meta\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const descriptions = metas.filter((meta) => meta.name === 'description');
  expect(descriptions.length === 1, `${url}: meta description count differs`);
  const description = descriptions[0].content ?? '';
  const scripts = [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g)];
  const baseline = scripts.filter((script) => /data-structured-data-baseline="website-webpage-v1"/.test(script[1]));
  expect(baseline.length === 1, `${url}: baseline script count differs ${baseline.length}`);
  baselineScripts += baseline.length;
  expect(!baseline[0][2].includes('<'), `${url}: unsafe less-than in baseline JSON-LD`);
  let data;
  try { data = JSON.parse(baseline[0][2]); validScripts += 1; } catch (error) { expect(false, `${url}: invalid baseline JSON-LD ${error.message}`); }
  expect(data['@context'] === 'https://schema.org', `${url}: baseline context differs`);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  expect(graph.length === contract.serialization_contract.graph_nodes_per_page, `${url}: graph size differs`);
  const websites = graph.filter((node) => node['@type'] === 'WebSite');
  const webpages = graph.filter((node) => node['@type'] === 'WebPage');
  websiteNodes += websites.length;
  webpageNodes += webpages.length;
  expect(graph.every((node) => ['WebSite','WebPage'].includes(node['@type'])), `${url}: unexpected baseline type`);
  const website = websites[0];
  const webpage = webpages[0];
  expect(websites.length === 1 && website['@id'] === WEBSITE_ID && website.url === `${SITE_ORIGIN}/` && website.name === 'Where Horses Run' && website.alternateName === '競馬どこ？' && exact(website.inLanguage, ['en','ja']), `${url}: WebSite node differs`);
  expect(webpages.length === 1 && webpage['@id'] === `${url}#webpage` && webpage.url === url && webpage.name === title && webpage.description === description && webpage.inLanguage === lang && webpage.isPartOf?.['@id'] === WEBSITE_ID, `${url}: WebPage node differs`);
  const pageFaqScripts = scripts.filter((script) => /data-faq-structured-data="faq-page-v1"/.test(script[1]));
  faqScripts += pageFaqScripts.length;
  for (const script of pageFaqScripts) {
    const faq = JSON.parse(script[2]);
    expect(faq['@type'] === 'FAQPage', `${url}: FAQ script type differs`);
    faqQuestions += Array.isArray(faq.mainEntity) ? faq.mainEntity.length : 0;
  }
  if (new URL(url).pathname === '/methods/' || new URL(url).pathname === '/ja/methods/') {
    methodsSpecificScripts += scripts.length - baseline.length;
  }
}
expect(english === expectedCurrent.english_pages, `English page count differs ${english}`);
expect(japanese === expectedCurrent.japanese_pages, `Japanese page count differs ${japanese}`);
expect(baselineScripts === expectedCurrent.json_ld_scripts, `Baseline script total differs ${baselineScripts}`);
expect(validScripts === expectedCurrent.json_ld_scripts, `Valid baseline script total differs ${validScripts}`);
expect(websiteNodes === expectedCurrent.website_nodes, `WebSite node total differs ${websiteNodes}`);
expect(webpageNodes === expectedCurrent.webpage_nodes, `WebPage node total differs ${webpageNodes}`);
expect(faqScripts === contract.page_specific_script_boundary.faq_page_scripts, `FAQ script total differs ${faqScripts}`);
expect(faqQuestions === contract.page_specific_script_boundary.faq_question_nodes, `FAQ question total differs ${faqQuestions}`);
expect(methodsSpecificScripts === contract.page_specific_script_boundary.methods_page_specific_scripts, `Methods page-specific script total differs ${methodsSpecificScripts}`);

console.log('STRUCTURED_DATA_BASELINE: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.scope.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${expectedCurrent.public_pages}`);
console.log(`CURRENT_BASELINE_JSON_LD_SCRIPTS: ${baselineScripts}`);
console.log(`CURRENT_RACECOURSE_DETAIL_ROUTES: ${currentRacecourseDetails}`);
console.log(`CURRENT_MEETING_DETAIL_ROUTES: ${currentMeetingDetails}`);
console.log('FAQPAGE_SCRIPTS_OUTSIDE_BASELINE: 2');
console.log('METHODS_PAGE_SPECIFIC_SCRIPTS: 0');