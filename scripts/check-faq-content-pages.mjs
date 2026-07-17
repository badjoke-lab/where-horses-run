import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const CONTRACT_PATH = 'data/static/faq-content-pages-contract-v1.json';
const AUDIT_PATH = 'data/audits/faq-content-pages-v1.json';
const COMPONENT_PATH = 'src/components/FaqPage.astro';
const EN_ROUTE_PATH = 'src/pages/faq/index.astro';
const JA_ROUTE_PATH = 'src/pages/ja/faq/index.astro';
const EN_HOME_PATH = 'src/pages/index.astro';
const JA_HOME_PATH = 'src/pages/ja/index.astro';
const DOC_PATH = 'docs/seo/faq-content-pages.md';
const WORKFLOW_PATH = '.github/workflows/faq-content-pages.yml';
const TEMPORARY_WORKFLOW_PATH = '.github/workflows/temporary-faq-content-discovery.yml';
const DIST_DIRECTORY = 'dist';
const SITEMAP_PATH = path.join(DIST_DIRECTORY, 'sitemap.xml');

function fail(message) {
  throw new Error(message);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
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

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function parsePage(url) {
  const file = renderedFile(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  const title = stripTags(one([...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)], 'title', url)[1]);
  const metas = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const description = one(metas.filter((meta) => meta.name === 'description'), 'meta description', url).content ?? '';
  const canonical = one(links.filter((link) => link.rel === 'canonical'), 'canonical', url).href ?? '';
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const questions = [...html.matchAll(/<article\s+[^>]*class="[^"]*faq-item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)].map((match) => ({
    question: stripTags(match[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? ''),
    answer: stripTags(match[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ''),
  }));
  const scripts = [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/gi)];
  const faqScripts = scripts.filter((script) => /data-faq-structured-data="faq-page-v1"/i.test(script[1]));
  const relatedArticle = html.match(/<section\s+[^>]*class="[^"]*faq-related[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const relatedLinks = [...relatedArticle.matchAll(/<a\s+[^>]*>/gi)].map((match) => attrs(match[0]).href).filter(Boolean);
  return { url, file, html, lang, title, description, canonical, alternates, questions, faqScripts, relatedLinks };
}

function verifyContract(contract, audit) {
  expect(contract.schema_version === 'faq-content-pages-contract-v1', 'FAQ contract schema differs');
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'FAQ Work ID differs');
  expect(contract.implementation_unit === 'FAQ-CONTENT-PAGES-01', 'FAQ implementation unit differs');
  expect(contract.status === 'complete', 'FAQ contract status differs');
  expect(contract.reviewed_at === '2026-07-18', 'FAQ review date differs');
  expect(contract.site_origin === SITE_ORIGIN, 'FAQ site origin differs');
  expect(exact(contract.scope, {
    public_pages: 769,
    english_pages: 386,
    japanese_pages: 383,
    faq_pages: 2,
    languages: 2,
    questions_per_page: 12,
    visible_questions: 24,
    visible_answers: 24,
    faqpage_scripts: 2,
    structured_questions: 24,
    structured_answers: 24,
    home_page_faq_links: 2,
    related_page_links: 8,
  }), 'FAQ scope differs');
  expect(contract.routes.en.path === '/faq/' && contract.routes.en.alternate_path === '/ja/faq/', 'English FAQ route contract differs');
  expect(contract.routes.ja.path === '/ja/faq/' && contract.routes.ja.alternate_path === '/faq/', 'Japanese FAQ route contract differs');
  expect(contract.structured_data_contract.type === 'FAQPage', 'FAQ structured-data type differs');
  expect(contract.structured_data_contract.questions_per_script === 12, 'FAQ structured question count differs');
  expect(contract.public_boundary.revenue_or_monetization_discussion_allowed === false, 'FAQ revenue boundary differs');
  expect(contract.public_boundary.budget_discussion_allowed === false, 'FAQ budget boundary differs');
  expect(contract.public_boundary.internal_circumstances_allowed === false, 'FAQ internal-circumstances boundary differs');
  expect(contract.public_boundary.betting_advice_allowed === false, 'FAQ betting-advice boundary differs');
  expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'FAQ privacy boundary differs');
  expect(Object.values(contract.automation_boundary).every((value) => value === false), 'FAQ automation boundary differs');
  expect(contract.next_implementation_unit === 'METHODS-DATA-POLICY-01', 'FAQ next implementation unit differs');

  expect(audit.schema_version === 'faq-content-pages-audit-v1', 'FAQ audit schema differs');
  expect(audit.status === 'complete', 'FAQ audit status differs');
  for (const [key, value] of Object.entries({
    public_pages: 769,
    english_pages: 386,
    japanese_pages: 383,
    faq_pages: 2,
    visible_questions: 24,
    visible_answers: 24,
    faqpage_scripts: 2,
    structured_questions: 24,
    structured_answers: 24,
    home_page_faq_links: 2,
    related_page_links: 8,
  })) expect(audit.verified[key] === value, `FAQ audit ${key} differs`);
  for (const key of [
    'missing_faq_routes',
    'canonical_errors',
    'hreflang_errors',
    'title_errors',
    'description_errors',
    'missing_questions',
    'missing_answers',
    'duplicate_questions',
    'structured_data_errors',
    'visible_structured_mismatches',
    'webpage_relation_errors',
    'home_navigation_errors',
    'related_navigation_errors',
    'forbidden_public_topic_errors',
    'temporary_discovery_workflows',
    'contract_errors',
    'output_errors',
  ]) expect(audit.verified[key] === 0, `FAQ audit ${key} differs`);
}

function verifySourceFiles() {
  for (const file of [COMPONENT_PATH, EN_ROUTE_PATH, JA_ROUTE_PATH, EN_HOME_PATH, JA_HOME_PATH, DOC_PATH, WORKFLOW_PATH]) {
    expect(fs.existsSync(file), `FAQ source file is missing: ${file}`);
  }
  expect(!fs.existsSync(TEMPORARY_WORKFLOW_PATH), 'Temporary FAQ discovery workflow remains');
  const component = read(COMPONENT_PATH);
  for (const marker of [
    "interface Props",
    "locale: 'en' | 'ja'",
    "data-faq-structured-data=\"faq-page-v1\"",
    "'@type': 'FAQPage'",
    "'@type': 'Question'",
    "'@type': 'Answer'",
    "JSON.stringify(faqStructuredData).replace(/</g",
    "canonicalPath={canonicalPath}",
    "alternatePath={alternatePath}",
  ]) expect(component.includes(marker), `FAQ component marker is missing: ${marker}`);
  expect((component.match(/question:/g) ?? []).length === 24, 'FAQ source question count differs');
  expect((component.match(/answer:/g) ?? []).length === 24, 'FAQ source answer count differs');
  const forbiddenVisibleTopics = [
    /revenue/i,
    /monetization/i,
    /budget/i,
    /other project/i,
    /internal circumstances/i,
    /収益/,
    /予算/,
    /他プロジェクト/,
    /内部事情/,
  ];
  for (const pattern of forbiddenVisibleTopics) expect(!pattern.test(component), `FAQ component contains forbidden public topic ${pattern}`);
  expect(read(EN_ROUTE_PATH).includes('<FaqPage locale="en" />'), 'English FAQ route delegation differs');
  expect(read(JA_ROUTE_PATH).includes('<FaqPage locale="ja" />'), 'Japanese FAQ route delegation differs');
  expect(read(EN_HOME_PATH).includes('href="/faq/"'), 'English home page FAQ link is missing');
  expect(read(JA_HOME_PATH).includes('href="/ja/faq/"'), 'Japanese home page FAQ link is missing');
  const doc = read(DOC_PATH);
  for (const marker of ['FAQ-CONTENT-PAGES-01', 'Visible questions: 24', 'Structured questions: 24', 'METHODS-DATA-POLICY-01']) {
    expect(doc.includes(marker), `FAQ documentation marker is missing: ${marker}`);
  }
  const workflow = read(WORKFLOW_PATH);
  for (const marker of [
    'npm run build',
    'node scripts/check-sitemap-robots.mjs',
    'node scripts/check-structured-data-baseline.mjs',
    'node scripts/check-canonical-hreflang-review.mjs',
    'node scripts/check-open-graph-social-cards.mjs',
    'node scripts/check-title-description-normalization.mjs',
    'node scripts/check-faq-content-pages.mjs',
    'git status --porcelain',
  ]) expect(workflow.includes(marker), `FAQ workflow marker is missing: ${marker}`);
}

function verifyFaqPage(page, route) {
  expect(page.lang === route.lang, `${page.url}: language differs`);
  expect(page.title === route.title, `${page.url}: title differs`);
  expect(page.description === route.description, `${page.url}: description differs`);
  expect(page.canonical === page.url, `${page.url}: canonical differs`);
  const expectedAlternateSet = [
    ['en', `${SITE_ORIGIN}/faq/`],
    ['ja', `${SITE_ORIGIN}/ja/faq/`],
    ['x-default', `${SITE_ORIGIN}/faq/`],
  ].sort();
  const actualAlternateSet = page.alternates.map((link) => [link.hreflang, link.href]).sort();
  expect(exact(actualAlternateSet, expectedAlternateSet), `${page.url}: hreflang cluster differs`);
  expect(page.questions.length === 12, `${page.url}: visible question count differs ${page.questions.length}`);
  expect(page.questions.every((item) => item.question && item.answer), `${page.url}: empty visible question or answer`);
  expect(new Set(page.questions.map((item) => item.question)).size === 12, `${page.url}: duplicate visible questions`);
  expect(page.faqScripts.length === 1, `${page.url}: FAQ JSON-LD script count differs ${page.faqScripts.length}`);
  expect(!page.faqScripts[0][2].includes('<'), `${page.url}: FAQ JSON-LD contains unsafe less-than character`);
  let structured;
  try {
    structured = JSON.parse(page.faqScripts[0][2]);
  } catch (error) {
    fail(`${page.url}: invalid FAQ JSON-LD: ${error.message}`);
  }
  expect(structured['@context'] === 'https://schema.org', `${page.url}: FAQ context differs`);
  expect(structured['@type'] === 'FAQPage', `${page.url}: FAQ type differs`);
  expect(structured['@id'] === `${page.url}#faq`, `${page.url}: FAQ ID differs`);
  expect(structured.url === page.url, `${page.url}: FAQ URL differs`);
  expect(structured.name === page.title, `${page.url}: FAQ name differs`);
  expect(structured.description === page.description, `${page.url}: FAQ description differs`);
  expect(structured.inLanguage === page.lang, `${page.url}: FAQ language differs`);
  expect(structured.isPartOf?.['@id'] === `${page.url}#webpage`, `${page.url}: FAQ WebPage relation differs`);
  expect(Array.isArray(structured.mainEntity) && structured.mainEntity.length === 12, `${page.url}: structured question count differs`);
  for (let index = 0; index < 12; index += 1) {
    const visible = page.questions[index];
    const entity = structured.mainEntity[index];
    expect(entity?.['@type'] === 'Question', `${page.url}: question ${index + 1} type differs`);
    expect(entity?.name === visible.question, `${page.url}: question ${index + 1} text differs`);
    expect(entity?.acceptedAnswer?.['@type'] === 'Answer', `${page.url}: answer ${index + 1} type differs`);
    expect(entity?.acceptedAnswer?.text === visible.answer, `${page.url}: answer ${index + 1} text differs`);
  }
  expect(exact(page.relatedLinks.sort(), route.relatedLinks.sort()), `${page.url}: related links differ ${JSON.stringify(page.relatedLinks)}`);
}

function main() {
  for (const file of [CONTRACT_PATH, AUDIT_PATH, SITEMAP_PATH]) expect(fs.existsSync(file), `Missing ${file}`);
  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  verifyContract(contract, audit);
  verifySourceFiles();

  const urls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length === 769, `FAQ checker sitemap count differs ${urls.length}`);
  expect(urls.includes(`${SITE_ORIGIN}/faq/`), 'English FAQ URL is missing from sitemap');
  expect(urls.includes(`${SITE_ORIGIN}/ja/faq/`), 'Japanese FAQ URL is missing from sitemap');

  const en = parsePage(`${SITE_ORIGIN}/faq/`);
  const ja = parsePage(`${SITE_ORIGIN}/ja/faq/`);
  verifyFaqPage(en, {
    lang: 'en',
    title: contract.routes.en.title,
    description: contract.routes.en.description,
    relatedLinks: ['/about/', '/disclaimer/', '/sources/', '/glossary/'],
  });
  verifyFaqPage(ja, {
    lang: 'ja',
    title: contract.routes.ja.title,
    description: contract.routes.ja.description,
    relatedLinks: ['/ja/about/', '/ja/disclaimer/', '/ja/sources/', '/ja/glossary/'],
  });

  console.log('FAQ_CONTENT_PAGES: pass');
  console.log('PUBLIC_PAGES: 769');
  console.log('FAQ_PAGES: 2');
  console.log('VISIBLE_QUESTIONS: 24');
  console.log('VISIBLE_ANSWERS: 24');
  console.log('STRUCTURED_QUESTIONS: 24');
  console.log('STRUCTURED_ANSWERS: 24');
  console.log('HOME_PAGE_FAQ_LINKS: 2');
  console.log('RELATED_PAGE_LINKS: 8');
  console.log('NEXT_IMPLEMENTATION_UNIT: METHODS-DATA-POLICY-01');
}

main();
