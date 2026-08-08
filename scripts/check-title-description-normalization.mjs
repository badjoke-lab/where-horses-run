import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = 'data/static/title-description-normalization-contract-v1.json';
const AUDIT_PATH = 'data/audits/title-description-normalization-v1.json';
const METHODS_CONTRACT_PATH = 'data/static/methods-data-policy-contract-v1.json';
const INTEGRATION_PATH = 'scripts/title-description-normalization-integration.mjs';
const ASTRO_CONFIG_PATH = 'astro.config.mjs';
const SITEMAP_PATH = 'dist/sitemap.xml';
const TEMPORARY_WORKFLOWS = [
  '.github/workflows/temporary-title-description-normalization-discovery.yml',
  '.github/workflows/temporary-title-description-build-diagnostic.yml',
];

const expect = (condition, message) => { if (!condition) throw new Error(message); };
const read = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(read(file));
function decode(value) {
  return value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
const strip = (value) => decode(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const fileFor = (urlString) => {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
};
const one = (values, label, url) => {
  expect(values.length === 1, `${url}: expected one ${label}, found ${values.length}`);
  return values[0];
};
function family(pathname) {
  const normalized = pathname.replace(/^\/ja\//, '/');
  if (/^\/timetable\/meetings\/[^/]+\/$/.test(normalized)) return 'meeting';
  if (/^\/countries\/[^/]+\/$/.test(normalized)) return 'country';
  if (normalized === '/faq/') return 'faq';
  if (normalized === '/methods/') return 'methods';
  return 'other';
}
function parsePage(url) {
  const file = fileFor(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  const title = strip(one([...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)], 'title', url)[1]);
  const metas = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const description = one(metas.filter((meta) => meta.name === 'description'), 'description', url).content ?? '';
  const canonical = one(links.filter((link) => link.rel === 'canonical'), 'canonical', url).href ?? '';
  expect(canonical === url, `${url}: canonical differs`);
  const meta = (key, attribute = 'name') => one(metas.filter((item) => item[attribute] === key), key, url).content ?? '';
  const pageNodes = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      let data;
      try { data = JSON.parse(match[1]); } catch (error) { throw new Error(`${url}: invalid JSON-LD: ${error.message}`); }
      return Array.isArray(data?.['@graph']) ? data['@graph'] : [];
    })
    .filter((node) => node?.['@id'] === `${url}#webpage` && ['WebPage', 'CollectionPage'].includes(node?.['@type']));
  expect(pageNodes.length >= 1, `${url}: page identity JSON-LD is missing`);
  return { url, pathname: new URL(url).pathname, family: family(new URL(url).pathname), html, lang, title, description, ogTitle: meta('og:title', 'property'), ogDescription: meta('og:description', 'property'), twitterTitle: meta('twitter:title'), twitterDescription: meta('twitter:description'), pageNodes };
}
function duplicates(pages, key) {
  const groups = new Map();
  for (const page of pages) {
    if (!groups.has(page[key])) groups.set(page[key], []);
    groups.get(page[key]).push(page.url);
  }
  return [...groups.values()].filter((urls) => urls.length > 1);
}

function verifyHistorical(contract, audit) {
  expect(contract.schema_version === 'title-description-normalization-contract-v1', 'Title-description contract schema differs');
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1' && contract.implementation_unit === 'TITLE-DESCRIPTION-NORMALIZATION-01', 'Title-description contract identity differs');
  expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18' && contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'Title-description historical state differs');
  expect(contract.normalization_contract.duplicate_titles_allowed === false && contract.normalization_contract.duplicate_descriptions_allowed === false, 'Duplicate metadata must remain disallowed');
  expect(contract.normalization_contract.arbitrary_character_limit_enforced === false, 'Arbitrary title limits must remain disabled');
  expect(contract.methods_contract.paths.join('|') === '/methods/|/ja/methods/', 'Methods metadata contract differs');
  expect(audit.schema_version === 'title-description-normalization-audit-v1' && audit.status === 'complete' && audit.scope_updated_by === contract.scope_updated_by, 'Title-description historical audit identity differs');
  for (const key of ['public_pages','english_pages','japanese_pages','meeting_detail_pages','country_detail_pages','normalized_country_description_pages','faq_pages','methods_pages']) expect(audit.verified[key] === contract.scope[key], `Title-description historical audit ${key} differs`);
  for (const key of ['missing_titles','missing_descriptions','duplicate_title_tag_pages','duplicate_description_meta_pages','duplicate_title_groups','duplicate_description_groups','open_graph_title_errors','open_graph_description_errors','twitter_title_errors','twitter_description_errors','jsonld_title_errors','jsonld_description_errors','faq_title_errors','faq_description_errors','methods_title_errors','methods_description_errors','whitespace_errors','newline_errors','contract_errors','output_errors']) expect(audit.verified[key] === 0, `Title-description historical audit ${key} differs`);
}
function verifyWiring() {
  for (const workflow of TEMPORARY_WORKFLOWS) expect(!fs.existsSync(workflow), `Temporary workflow remains: ${workflow}`);
  const config = read(ASTRO_CONFIG_PATH);
  const integration = read(INTEGRATION_PATH);
  expect(config.includes("import titleDescriptionNormalizationIntegration from './scripts/title-description-normalization-integration.mjs';") && config.includes('titleDescriptionNormalizationIntegration()'), 'Astro normalization wiring is missing');
  for (const marker of ["name: 'where-horses-run-title-description-normalization'", "'astro:build:done'", 'meetingMetadata(page)', 'duplicatedCountryDescriptions']) expect(integration.includes(marker), `Normalization marker is missing: ${marker}`);
}
function verifyPages(pages, contract, methodsContract) {
  const english = pages.filter((page) => page.lang === 'en').length;
  const japanese = pages.filter((page) => page.lang === 'ja').length;
  expect(pages.length >= contract.scope.public_pages, `Public page inventory shrank ${pages.length}`);
  expect(english >= contract.scope.english_pages && japanese >= contract.scope.japanese_pages, `Language inventory shrank en=${english} ja=${japanese}`);
  expect(english - contract.scope.english_pages === japanese - contract.scope.japanese_pages, `Reviewed bilingual page growth is unbalanced en=${english} ja=${japanese}`);
  expect(english - japanese === contract.scope.english_pages - contract.scope.japanese_pages, `Historical unpaired-language delta changed en=${english} ja=${japanese}`);
  for (const page of pages) {
    expect(['en','ja'].includes(page.lang), `${page.url}: unsupported language ${page.lang}`);
    expect(page.title && page.description, `${page.url}: empty title or description`);
    expect(!/^\s|\s$|\s{2,}|[\r\n]/.test(page.title), `${page.url}: title whitespace differs`);
    expect(!/^\s|\s$|\s{2,}|[\r\n]/.test(page.description), `${page.url}: description whitespace differs`);
    expect(page.ogTitle === page.title && page.twitterTitle === page.title, `${page.url}: social title differs`);
    expect(page.ogDescription === page.description && page.twitterDescription === page.description, `${page.url}: social description differs`);
    for (const node of page.pageNodes) {
      expect(node.name === page.title, `${page.url}: JSON-LD name differs`);
      expect(node.description === page.description, `${page.url}: JSON-LD description differs`);
    }
  }
  expect(duplicates(pages, 'title').length === 0, 'Duplicate title groups remain');
  expect(duplicates(pages, 'description').length === 0, 'Duplicate description groups remain');

  const meetings = pages.filter((page) => page.family === 'meeting');
  expect(meetings.length === contract.scope.meeting_detail_pages, `Meeting page count differs ${meetings.length}`);
  for (const page of meetings) {
    const racecourse = strip(page.html.match(/<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
    const pageKind = strip(page.html.match(/<p[^>]*class="[^"]*eyebrow[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
    const date = page.html.match(/<p[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1] ?? '';
    expect(racecourse && pageKind && date, `${page.url}: meeting identity is incomplete`);
    expect(page.title.includes(racecourse) && page.title.includes(pageKind) && page.title.includes(date), `${page.url}: meeting title differs`);
    expect(page.description.includes(racecourse) && page.description.includes(date), `${page.url}: meeting description differs`);
  }
  const affected = pages.filter((page) => contract.country_duplicate_resolution.paths.includes(page.pathname));
  expect(affected.length === contract.scope.normalized_country_description_pages, 'Country normalization count differs');
  for (const page of affected) {
    const heading = strip(page.html.match(/<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
    const suffix = page.lang === 'ja' ? 'の競馬カレンダー・競馬場ガイド' : ' Horse Racing Calendar & Racecourses';
    const area = heading.slice(0, -suffix.length).trim();
    const summary = strip(page.html.match(/<p[^>]*class="[^"]*hero__summary[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
    expect(heading.endsWith(suffix) && page.description === `${area} — ${summary}`, `${page.url}: normalized country description differs`);
  }
  const expected = new Map([
    ['/faq/', ['Frequently Asked Questions | Where Horses Run', 'Frequently asked questions about Where Horses Run data scope, official sources, update policy, publication ranks, and limitations.']],
    ['/ja/faq/', ['よくある質問 | 競馬どこ？', '競馬どこ？のデータ範囲、公式ソース、更新方針、公開ランク、制限事項に関するよくある質問です。']],
    [methodsContract.routes.en.path, [methodsContract.routes.en.title, methodsContract.routes.en.description]],
    [methodsContract.routes.ja.path, [methodsContract.routes.ja.title, methodsContract.routes.ja.description]],
  ]);
  for (const [pathname, [title, description]] of expected) {
    const page = pages.find((item) => item.pathname === pathname);
    expect(page && page.title === title && page.description === description, `${pathname}: exact metadata differs`);
  }
  expect(pages.filter((page) => page.family === 'faq').length === contract.scope.faq_pages, 'FAQ page count differs');
  expect(pages.filter((page) => page.family === 'methods').length === contract.scope.methods_pages, 'Methods page count differs');
  return { english, japanese };
}

function main() {
  for (const file of [CONTRACT_PATH, AUDIT_PATH, METHODS_CONTRACT_PATH, INTEGRATION_PATH, ASTRO_CONFIG_PATH, SITEMAP_PATH]) expect(fs.existsSync(file), `Missing ${file}`);
  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  const methodsContract = readJson(METHODS_CONTRACT_PATH);
  verifyHistorical(contract, audit);
  verifyWiring();
  const urls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pages = urls.map(parsePage);
  const { english, japanese } = verifyPages(pages, contract, methodsContract);
  console.log('TITLE_DESCRIPTION_NORMALIZATION: pass');
  console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.scope.public_pages}`);
  console.log(`CURRENT_PUBLIC_PAGES: ${pages.length}`);
  console.log(`CURRENT_ENGLISH_PAGES: ${english}`);
  console.log(`CURRENT_JAPANESE_PAGES: ${japanese}`);
  console.log(`MEETING_DETAILS: ${contract.scope.meeting_detail_pages}`);
  console.log(`FAQ_PAGES: ${contract.scope.faq_pages}`);
  console.log(`METHODS_PAGES: ${contract.scope.methods_pages}`);
  console.log('DUPLICATE_TITLES: 0');
  console.log('DUPLICATE_DESCRIPTIONS: 0');
}
main();
