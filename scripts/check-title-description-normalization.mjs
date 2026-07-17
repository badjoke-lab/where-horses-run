import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = 'data/static/title-description-normalization-contract-v1.json';
const AUDIT_PATH = 'data/audits/title-description-normalization-v1.json';
const INTEGRATION_PATH = 'scripts/title-description-normalization-integration.mjs';
const ASTRO_CONFIG_PATH = 'astro.config.mjs';
const DIST_DIRECTORY = 'dist';
const SITEMAP_PATH = path.join(DIST_DIRECTORY, 'sitemap.xml');
const TEMPORARY_WORKFLOWS = [
  '.github/workflows/temporary-title-description-normalization-discovery.yml',
  '.github/workflows/temporary-title-description-build-diagnostic.yml',
];

function fail(message) {
  throw new Error(message);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? path.join(DIST_DIRECTORY, 'index.html') : path.join(DIST_DIRECTORY, pathname.replace(/^\//, ''), 'index.html');
}

function one(values, label, url) {
  expect(values.length === 1, `${url}: expected one ${label}, found ${values.length}`);
  return values[0];
}

function readText(html, pattern, label, url) {
  const value = html.match(pattern)?.[1];
  expect(value !== undefined, `${url}: missing ${label}`);
  return stripTags(value);
}

function duplicateGroups(records, field) {
  const groups = new Map();
  for (const record of records) {
    const value = record[field];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record.url);
  }
  return [...groups.entries()].filter(([, urls]) => urls.length > 1);
}

function pageFamily(pathname) {
  const normalized = pathname.replace(/^\/ja\//, '/');
  if (/^\/timetable\/meetings\/[^/]+\/$/.test(normalized)) return 'meeting-detail';
  if (/^\/countries\/[^/]+\/$/.test(normalized)) return 'country-detail';
  if (normalized === '/faq/') return 'faq';
  return 'other';
}

function parseJsonLd(html, url) {
  return [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/gi)].map((match) => {
    try { return { attributes: match[1], data: JSON.parse(match[2]) }; }
    catch (error) { fail(`${url}: invalid JSON-LD: ${error.message}`); }
  });
}

function parsePage(url) {
  const file = renderedFile(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing (${file})`);
  const html = fs.readFileSync(file, 'utf8');
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  expect(['en', 'ja'].includes(lang), `${url}: unsupported html lang ${lang}`);
  const title = stripTags(one([...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)], 'title tag', url)[1]);
  const metas = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const description = one(metas.filter((meta) => meta.name === 'description'), 'meta description', url).content ?? '';
  const canonical = one(links.filter((link) => link.rel === 'canonical'), 'canonical link', url).href ?? '';
  expect(canonical === url, `${url}: canonical differs (${canonical})`);
  const metaValue = (key, attribute = 'name') => one(metas.filter((meta) => meta[attribute] === key), `${key} metadata`, url).content ?? '';
  const jsonLd = parseJsonLd(html, url);
  const pageNodes = jsonLd.flatMap(({ data }) => {
    const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [];
    return graph.filter((node) => node?.['@id'] === `${url}#webpage` && ['WebPage', 'CollectionPage'].includes(node?.['@type']));
  });
  expect(pageNodes.length >= 1, `${url}: matching WebPage or CollectionPage JSON-LD node is missing`);
  return {
    url,
    pathname: new URL(url).pathname,
    family: pageFamily(new URL(url).pathname),
    file,
    html,
    lang,
    title,
    description,
    ogTitle: metaValue('og:title', 'property'),
    ogDescription: metaValue('og:description', 'property'),
    twitterTitle: metaValue('twitter:title'),
    twitterDescription: metaValue('twitter:description'),
    pageNodes,
  };
}

function verifyContract(contract, audit) {
  expect(contract.schema_version === 'title-description-normalization-contract-v1', 'Unexpected title-description contract schema');
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'Unexpected title-description Work ID');
  expect(contract.implementation_unit === 'TITLE-DESCRIPTION-NORMALIZATION-01', 'Unexpected title-description implementation unit');
  expect(contract.status === 'complete', 'Title-description contract is not complete');
  expect(contract.reviewed_at === '2026-07-18', 'Title-description review date differs');
  expect(contract.scope_updated_by === 'FAQ-CONTENT-PAGES-01', 'Title-description scope update marker differs');
  expect(contract.scope.public_pages === 769, 'Contract public-page count differs');
  expect(contract.scope.english_pages === 386, 'Contract English-page count differs');
  expect(contract.scope.japanese_pages === 383, 'Contract Japanese-page count differs');
  expect(contract.scope.meeting_detail_pages === 158, 'Contract meeting-page count differs');
  expect(contract.scope.normalized_country_description_pages === 4, 'Contract country-normalization count differs');
  expect(contract.scope.faq_pages === 2, 'Contract FAQ-page count differs');
  expect(contract.normalization_contract.duplicate_titles_allowed === false, 'Duplicate titles must remain disallowed');
  expect(contract.normalization_contract.duplicate_descriptions_allowed === false, 'Duplicate descriptions must remain disallowed');
  expect(contract.normalization_contract.arbitrary_character_limit_enforced === false, 'Arbitrary length limits must remain disabled');
  expect(contract.faq_contract.unique_titles_required === true && contract.faq_contract.unique_descriptions_required === true, 'FAQ uniqueness contract differs');
  expect(contract.automation_boundary.automatic_publication_enabled === false, 'Automatic publication must remain disabled');

  expect(audit.schema_version === 'title-description-normalization-audit-v1', 'Unexpected title-description audit schema');
  expect(audit.status === 'complete', 'Title-description audit is not complete');
  expect(audit.reviewed_at === contract.reviewed_at && audit.scope_updated_by === contract.scope_updated_by, 'Title-description audit scope identity differs');
  for (const [key, value] of Object.entries({ public_pages: 769, english_pages: 386, japanese_pages: 383, meeting_detail_pages: 158, country_detail_pages: 196, normalized_country_description_pages: 4, faq_pages: 2 })) {
    expect(audit.verified[key] === value, `Title-description audit ${key} differs`);
  }
  for (const key of ['missing_titles', 'missing_descriptions', 'duplicate_title_tag_pages', 'duplicate_description_meta_pages', 'duplicate_title_groups', 'duplicate_description_groups', 'open_graph_title_errors', 'open_graph_description_errors', 'twitter_title_errors', 'twitter_description_errors', 'jsonld_title_errors', 'jsonld_description_errors', 'faq_title_errors', 'faq_description_errors', 'whitespace_errors', 'newline_errors', 'contract_errors', 'output_errors']) {
    expect(audit.verified[key] === 0, `Title-description audit ${key} differs`);
  }
  expect(audit.before.duplicate_title_groups === 36 && audit.before.duplicate_description_groups === 4, 'Initial duplicate measurements differ');
}

function verifySourceWiring() {
  for (const workflow of TEMPORARY_WORKFLOWS) expect(!fs.existsSync(workflow), `Temporary workflow remains: ${workflow}`);
  const config = fs.readFileSync(ASTRO_CONFIG_PATH, 'utf8');
  const integration = fs.readFileSync(INTEGRATION_PATH, 'utf8');
  expect(config.includes("import titleDescriptionNormalizationIntegration from './scripts/title-description-normalization-integration.mjs';"), 'Astro config does not import normalization integration');
  expect(config.includes('titleDescriptionNormalizationIntegration()'), 'Astro config does not register normalization integration');
  expect(integration.includes("name: 'where-horses-run-title-description-normalization'"), 'Normalization integration name marker is missing');
  expect(integration.includes("'astro:build:done'"), 'Normalization integration build hook is missing');
  expect(integration.includes('meetingMetadata(page)'), 'Meeting metadata normalization marker is missing');
  expect(integration.includes('duplicatedCountryDescriptions'), 'Country duplicate-description marker is missing');
}

function verifyPageBasics(pages) {
  expect(pages.length === 769, `Expected 769 public pages, found ${pages.length}`);
  expect(pages.filter((page) => page.lang === 'en').length === 386, 'English page count differs');
  expect(pages.filter((page) => page.lang === 'ja').length === 383, 'Japanese page count differs');
  for (const page of pages) {
    expect(page.title.length > 0, `${page.url}: empty title`);
    expect(page.description.length > 0, `${page.url}: empty description`);
    expect(!/^\s|\s$|\s{2,}/.test(page.title), `${page.url}: title whitespace defect`);
    expect(!/^\s|\s$|\s{2,}/.test(page.description), `${page.url}: description whitespace defect`);
    expect(!/[\r\n]/.test(page.title), `${page.url}: title contains newline`);
    expect(!/[\r\n]/.test(page.description), `${page.url}: description contains newline`);
    expect(page.ogTitle === page.title, `${page.url}: og:title differs`);
    expect(page.ogDescription === page.description, `${page.url}: og:description differs`);
    expect(page.twitterTitle === page.title, `${page.url}: twitter:title differs`);
    expect(page.twitterDescription === page.description, `${page.url}: twitter:description differs`);
    for (const node of page.pageNodes) {
      expect(node.name === page.title, `${page.url}: JSON-LD name differs for ${node['@type']}`);
      expect(node.description === page.description, `${page.url}: JSON-LD description differs for ${node['@type']}`);
    }
  }
  expect(duplicateGroups(pages, 'title').length === 0, 'Duplicate title groups remain');
  expect(duplicateGroups(pages, 'description').length === 0, 'Duplicate description groups remain');
}

function verifyMeetingPages(pages) {
  const meetings = pages.filter((page) => page.family === 'meeting-detail');
  expect(meetings.length === 158, `Expected 158 meeting pages, found ${meetings.length}`);
  expect(meetings.filter((page) => page.lang === 'en').length === 79, 'English meeting-page count differs');
  expect(meetings.filter((page) => page.lang === 'ja').length === 79, 'Japanese meeting-page count differs');
  for (const page of meetings) {
    const racecourse = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'meeting racecourse heading', page.url);
    const pageKind = readText(page.html, /<p[^>]*class="[^"]*eyebrow[^"]*"[^>]*>([\s\S]*?)<\/p>/i, 'meeting page kind', page.url);
    const date = page.html.match(/<p[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1] ?? '';
    expect(/^\d{4}-\d{2}-\d{2}$/.test(date), `${page.url}: visible meeting date is missing`);
    expect(page.title.includes(racecourse) && page.title.includes(date) && page.title.includes(pageKind), `${page.url}: meeting title identity differs`);
    expect(page.description.includes(racecourse) && page.description.includes(date), `${page.url}: meeting description identity differs`);
  }
}

function verifyCountryDescriptions(pages, contract) {
  const expectedPaths = new Set(contract.country_duplicate_resolution.paths);
  const affected = pages.filter((page) => expectedPaths.has(page.pathname));
  expect(affected.length === 4, `Expected four normalized country descriptions, found ${affected.length}`);
  for (const page of affected) {
    const heading = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'country heading', page.url);
    const suffix = page.lang === 'ja' ? 'の競馬カレンダー・競馬場ガイド' : ' Horse Racing Calendar & Racecourses';
    expect(heading.endsWith(suffix), `${page.url}: country heading suffix differs`);
    const area = heading.slice(0, -suffix.length).trim();
    const heroSummary = readText(page.html, /<p[^>]*class="[^"]*hero__summary[^"]*"[^>]*>([\s\S]*?)<\/p>/i, 'country hero summary', page.url);
    expect(page.description === `${area} — ${heroSummary}`, `${page.url}: normalized country description differs`);
  }
}

function verifyFaqPages(pages) {
  const expected = new Map([
    ['/faq/', {
      title: 'Frequently Asked Questions | Where Horses Run',
      description: 'Frequently asked questions about Where Horses Run data scope, official sources, update policy, publication ranks, and limitations.',
    }],
    ['/ja/faq/', {
      title: 'よくある質問 | 競馬どこ？',
      description: '競馬どこ？のデータ範囲、公式ソース、更新方針、公開ランク、制限事項に関するよくある質問です。',
    }],
  ]);
  const faqPages = pages.filter((page) => page.family === 'faq');
  expect(faqPages.length === 2, `Expected two FAQ pages, found ${faqPages.length}`);
  for (const page of faqPages) {
    const expectedMetadata = expected.get(page.pathname);
    expect(expectedMetadata !== undefined, `${page.url}: unexpected FAQ path`);
    expect(page.title === expectedMetadata.title, `${page.url}: FAQ title differs`);
    expect(page.description === expectedMetadata.description, `${page.url}: FAQ description differs`);
  }
}

function main() {
  for (const file of [CONTRACT_PATH, AUDIT_PATH, INTEGRATION_PATH, ASTRO_CONFIG_PATH, SITEMAP_PATH]) expect(fs.existsSync(file), `Missing ${file}`);
  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  verifyContract(contract, audit);
  verifySourceWiring();
  const urls = [...fs.readFileSync(SITEMAP_PATH, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pages = urls.map(parsePage);
  verifyPageBasics(pages);
  verifyMeetingPages(pages);
  verifyCountryDescriptions(pages, contract);
  verifyFaqPages(pages);
  console.log('Title and description normalization contract passed.');
  console.log('Public pages: 769');
  console.log('English / Japanese: 386 / 383');
  console.log('Meeting details: 158');
  console.log('FAQ pages: 2');
  console.log('Duplicate titles / descriptions: 0 / 0');
  console.log('Open Graph, Twitter, and JSON-LD alignment errors: 0');
}

main();
