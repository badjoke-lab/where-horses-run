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
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]),
  );
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/'
    ? path.join(DIST_DIRECTORY, 'index.html')
    : path.join(DIST_DIRECTORY, pathname.replace(/^\//, ''), 'index.html');
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
  return 'other';
}

function parseJsonLd(html, url) {
  const scripts = [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/gi)];
  return scripts.map((match) => {
    try {
      return { attributes: match[1], data: JSON.parse(match[2]) };
    } catch (error) {
      fail(`${url}: invalid JSON-LD: ${error.message}`);
    }
  });
}

function parsePage(url) {
  const file = renderedFile(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing (${file})`);
  const html = fs.readFileSync(file, 'utf8');
  const htmlLang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  expect(['en', 'ja'].includes(htmlLang), `${url}: unsupported html lang ${htmlLang}`);

  const titleTags = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const title = stripTags(one(titleTags, 'title tag', url)[1]);
  const metaTags = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const linkTags = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const description = one(metaTags.filter((meta) => meta.name === 'description'), 'meta description', url).content ?? '';
  const canonical = one(linkTags.filter((link) => link.rel === 'canonical'), 'canonical link', url).href ?? '';
  expect(canonical === url, `${url}: canonical differs (${canonical})`);

  const getMeta = (key, attribute = 'name') =>
    one(metaTags.filter((meta) => meta[attribute] === key), `${key} metadata`, url).content ?? '';

  const ogTitle = getMeta('og:title', 'property');
  const ogDescription = getMeta('og:description', 'property');
  const twitterTitle = getMeta('twitter:title');
  const twitterDescription = getMeta('twitter:description');

  const jsonLd = parseJsonLd(html, url);
  const baselineScripts = jsonLd.filter(({ attributes }) =>
    /data-structured-data-baseline="website-webpage-v1"/i.test(attributes),
  );
  expect(baselineScripts.length === 1, `${url}: expected one baseline JSON-LD script, found ${baselineScripts.length}`);

  const canonicalId = `${url}#webpage`;
  const pageNodes = jsonLd.flatMap(({ data }) => {
    const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [];
    return graph.filter((node) =>
      node?.['@id'] === canonicalId && ['WebPage', 'CollectionPage'].includes(node?.['@type']),
    );
  });
  expect(pageNodes.length >= 1, `${url}: no WebPage or CollectionPage node matches ${canonicalId}`);

  return {
    url,
    pathname: new URL(url).pathname,
    file,
    html,
    lang: htmlLang,
    family: pageFamily(new URL(url).pathname),
    title,
    description,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    pageNodes,
  };
}

function verifyContract(contract, audit) {
  expect(contract.schema_version === 'title-description-normalization-contract-v1', 'Unexpected contract schema');
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'Unexpected contract work ID');
  expect(contract.implementation_unit === 'TITLE-DESCRIPTION-NORMALIZATION-01', 'Unexpected implementation unit');
  expect(contract.status === 'complete', 'Contract is not complete');
  expect(contract.scope.public_pages === 767, 'Contract public-page count differs');
  expect(contract.scope.english_pages === 385, 'Contract English-page count differs');
  expect(contract.scope.japanese_pages === 382, 'Contract Japanese-page count differs');
  expect(contract.scope.meeting_detail_pages === 158, 'Contract meeting-page count differs');
  expect(contract.scope.normalized_country_description_pages === 4, 'Contract country-normalization count differs');
  expect(contract.normalization_contract.duplicate_titles_allowed === false, 'Duplicate titles must remain disallowed');
  expect(contract.normalization_contract.duplicate_descriptions_allowed === false, 'Duplicate descriptions must remain disallowed');
  expect(contract.normalization_contract.arbitrary_character_limit_enforced === false, 'Arbitrary length limits must remain disabled');
  expect(contract.public_boundary.visible_body_copy_changed === false, 'Visible-body boundary differs');
  expect(contract.automation_boundary.automatic_publication_enabled === false, 'Automatic publication must remain disabled');
  expect(contract.next_implementation_unit === 'FAQ-CONTENT-PAGES-01', 'Unexpected next implementation unit');

  expect(audit.schema_version === 'title-description-normalization-audit-v1', 'Unexpected audit schema');
  expect(audit.status === 'complete', 'Audit is not complete');
  expect(audit.verified.public_pages === 767, 'Audit public-page count differs');
  expect(audit.verified.duplicate_title_groups === 0, 'Audit retains duplicate title groups');
  expect(audit.verified.duplicate_description_groups === 0, 'Audit retains duplicate description groups');
  expect(audit.before.duplicate_title_groups === 36, 'Audit initial duplicate title count differs');
  expect(audit.before.duplicate_description_groups === 4, 'Audit initial duplicate description count differs');
}

function verifySourceWiring() {
  for (const workflow of TEMPORARY_WORKFLOWS) {
    expect(!fs.existsSync(workflow), `Temporary workflow remains: ${workflow}`);
  }
  const config = fs.readFileSync(ASTRO_CONFIG_PATH, 'utf8');
  const integration = fs.readFileSync(INTEGRATION_PATH, 'utf8');
  expect(config.includes("import titleDescriptionNormalizationIntegration from './scripts/title-description-normalization-integration.mjs';"), 'Astro config does not import normalization integration');
  expect(config.includes('titleDescriptionNormalizationIntegration()'), 'Astro config does not register normalization integration');
  expect(integration.includes("name: 'where-horses-run-title-description-normalization'"), 'Integration name marker is missing');
  expect(integration.includes("'astro:build:done'"), 'Integration build hook is missing');
  expect(integration.includes('meetingPages !== 158'), 'Integration meeting-scope assertion is missing');
  expect(integration.includes('countryDescriptionPages !== 4'), 'Integration country-scope assertion is missing');
}

function verifyPageBasics(pages) {
  expect(pages.length === 767, `Expected 767 public pages, found ${pages.length}`);
  expect(pages.filter((page) => page.lang === 'en').length === 385, 'English page count differs');
  expect(pages.filter((page) => page.lang === 'ja').length === 382, 'Japanese page count differs');

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

  const duplicateTitles = duplicateGroups(pages, 'title');
  const duplicateDescriptions = duplicateGroups(pages, 'description');
  expect(duplicateTitles.length === 0, `Duplicate title groups remain: ${JSON.stringify(duplicateTitles.slice(0, 5))}`);
  expect(duplicateDescriptions.length === 0, `Duplicate description groups remain: ${JSON.stringify(duplicateDescriptions.slice(0, 5))}`);
}

function verifyMeetingPages(pages) {
  const meetings = pages.filter((page) => page.family === 'meeting-detail');
  expect(meetings.length === 158, `Expected 158 meeting pages, found ${meetings.length}`);
  expect(meetings.filter((page) => page.lang === 'en').length === 79, 'English meeting-page count differs');
  expect(meetings.filter((page) => page.lang === 'ja').length === 79, 'Japanese meeting-page count differs');

  for (const page of meetings) {
    const racecourse = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'meeting racecourse heading', page.url);
    const pageKind = readText(page.html, /<p[^>]*class="eyebrow"[^>]*>([\s\S]*?)<\/p>/i, 'meeting page kind', page.url);
    const date = page.html.match(/<p[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1] ?? '';
    expect(/^\d{4}-\d{2}-\d{2}$/.test(date), `${page.url}: visible meeting date is missing`);
    expect(page.title.includes(racecourse), `${page.url}: title omits visible racecourse name`);
    expect(page.title.includes(date), `${page.url}: title omits visible date`);
    expect(page.title.includes(pageKind), `${page.url}: title omits visible page kind`);
    expect(page.description.includes(racecourse), `${page.url}: description omits visible racecourse name`);
    expect(page.description.includes(date), `${page.url}: description omits visible date`);
    if (page.lang === 'ja') {
      expect(page.description.includes('公式ソース'), `${page.url}: Japanese description omits official-source context`);
      expect(page.description.includes('公開ポリシー'), `${page.url}: Japanese description omits publication-policy context`);
    } else {
      expect(page.description.includes('Official-source'), `${page.url}: English description omits official-source context`);
      expect(page.description.includes('public-policy-controlled'), `${page.url}: English description omits publication-policy context`);
    }
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
    const heroSummary = readText(page.html, /<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i, 'country hero summary', page.url);
    expect(page.description === `${area} — ${heroSummary}`, `${page.url}: normalized country description differs from visible area plus reviewed summary`);
  }
}

function main() {
  expect(fs.existsSync(CONTRACT_PATH), `Missing ${CONTRACT_PATH}`);
  expect(fs.existsSync(AUDIT_PATH), `Missing ${AUDIT_PATH}`);
  expect(fs.existsSync(INTEGRATION_PATH), `Missing ${INTEGRATION_PATH}`);
  expect(fs.existsSync(SITEMAP_PATH), `Missing ${SITEMAP_PATH}; run npm run build first`);

  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  verifyContract(contract, audit);
  verifySourceWiring();

  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pages = urls.map(parsePage);

  verifyPageBasics(pages);
  verifyMeetingPages(pages);
  verifyCountryDescriptions(pages, contract);

  console.log('Title and description normalization contract passed.');
  console.log(`Public pages: ${pages.length}`);
  console.log(`English / Japanese: ${pages.filter((page) => page.lang === 'en').length} / ${pages.filter((page) => page.lang === 'ja').length}`);
  console.log(`Meeting details: ${pages.filter((page) => page.family === 'meeting-detail').length}`);
  console.log('Duplicate titles / descriptions: 0 / 0');
  console.log('Open Graph, Twitter, and JSON-LD alignment errors: 0');
}

main();
