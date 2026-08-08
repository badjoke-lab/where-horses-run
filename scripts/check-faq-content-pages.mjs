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
const SITEMAP_PATH = 'dist/sitemap.xml';

const expect = (condition, message) => { if (!condition) throw new Error(message); };
const read = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
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
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const questions = [...html.matchAll(/<article\s+[^>]*class="[^"]*faq-item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)].map((match) => ({
    question: strip(match[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? ''),
    answer: strip(match[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ''),
  }));
  const scripts = [...html.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/gi)];
  const faqScripts = scripts.filter((script) => /data-faq-structured-data="faq-page-v1"/i.test(script[1]));
  const related = html.match(/<section\s+[^>]*class="[^"]*faq-related[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const relatedLinks = [...related.matchAll(/<a\s+[^>]*>/gi)].map((match) => attrs(match[0]).href).filter(Boolean);
  return { url, html, lang, title, description, canonical, alternates, questions, faqScripts, relatedLinks };
}
function verifyHistorical(contract, audit) {
  expect(contract.schema_version === 'faq-content-pages-contract-v1' && contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1' && contract.implementation_unit === 'FAQ-CONTENT-PAGES-01', 'FAQ contract identity differs');
  expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18' && contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'FAQ historical state differs');
  expect(contract.site_origin === SITE_ORIGIN && contract.routes.en.path === '/faq/' && contract.routes.ja.path === '/ja/faq/', 'FAQ route contract differs');
  expect(contract.structured_data_contract.type === 'FAQPage' && contract.structured_data_contract.questions_per_script === contract.scope.questions_per_page, 'FAQ structured contract differs');
  for (const key of ['revenue_or_monetization_discussion_allowed','budget_discussion_allowed','internal_circumstances_allowed','betting_advice_allowed']) expect(contract.public_boundary[key] === false, `FAQ public boundary differs: ${key}`);
  expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'FAQ privacy boundary differs');
  expect(Object.values(contract.automation_boundary).every((value) => value === false), 'FAQ automation boundary differs');
  expect(audit.schema_version === 'faq-content-pages-audit-v1' && audit.status === 'complete' && audit.scope_updated_by === contract.scope_updated_by, 'FAQ historical audit identity differs');
  for (const key of ['public_pages','english_pages','japanese_pages','faq_pages','visible_questions','visible_answers','faqpage_scripts','structured_questions','structured_answers','home_page_faq_links','related_page_links']) expect(audit.verified[key] === contract.scope[key], `FAQ historical audit ${key} differs`);
  for (const key of ['missing_faq_routes','canonical_errors','hreflang_errors','title_errors','description_errors','missing_questions','missing_answers','duplicate_questions','structured_data_errors','visible_structured_mismatches','webpage_relation_errors','home_navigation_errors','related_navigation_errors','forbidden_public_topic_errors','temporary_discovery_workflows','contract_errors','output_errors']) expect(audit.verified[key] === 0, `FAQ historical audit ${key} differs`);
}
function verifySources(contract) {
  for (const file of [COMPONENT_PATH, EN_ROUTE_PATH, JA_ROUTE_PATH, EN_HOME_PATH, JA_HOME_PATH, DOC_PATH, WORKFLOW_PATH]) expect(fs.existsSync(file), `FAQ source file is missing: ${file}`);
  expect(!fs.existsSync(TEMPORARY_WORKFLOW_PATH), 'Temporary FAQ discovery workflow remains');
  const component = read(COMPONENT_PATH);
  for (const marker of ["locale: 'en' | 'ja'", 'data-faq-structured-data="faq-page-v1"', "'@type': 'FAQPage'", "'@type': 'Question'", "'@type': 'Answer'", 'canonicalPath={canonicalPath}', 'alternatePath={alternatePath}']) expect(component.includes(marker), `FAQ component marker is missing: ${marker}`);
  expect((component.match(/question:/g) ?? []).length === contract.scope.visible_questions, 'FAQ source question count differs');
  expect((component.match(/answer:/g) ?? []).length === contract.scope.visible_answers, 'FAQ source answer count differs');
  for (const pattern of [/revenue/i,/monetization/i,/budget/i,/other project/i,/internal circumstances/i,/収益/,/予算/,/他プロジェクト/,/内部事情/]) expect(!pattern.test(component), `FAQ component contains forbidden public topic ${pattern}`);
  expect(read(EN_ROUTE_PATH).includes('<FaqPage locale="en" />') && read(JA_ROUTE_PATH).includes('<FaqPage locale="ja" />'), 'FAQ route wiring differs');
  expect(read(EN_HOME_PATH).includes('href="/faq/"') && read(JA_HOME_PATH).includes('href="/ja/faq/"'), 'Home FAQ navigation differs');
  const doc = read(DOC_PATH);
  for (const marker of ['FAQ-CONTENT-PAGES-01', `Public pages: ${contract.scope.public_pages}`, 'Visible questions: 24', 'Structured questions: 24', 'METHODS-DATA-POLICY-01']) expect(doc.includes(marker), `FAQ historical documentation marker is missing: ${marker}`);
  const workflow = read(WORKFLOW_PATH);
  for (const marker of ['npm run build','node scripts/check-sitemap-robots.mjs','node scripts/check-structured-data-baseline.mjs','node scripts/check-canonical-hreflang-review.mjs','node scripts/check-open-graph-social-cards.mjs','node scripts/check-title-description-normalization.mjs','node scripts/check-faq-content-pages.mjs','git status --porcelain']) expect(workflow.includes(marker), `FAQ workflow marker is missing: ${marker}`);
}
function verifyPage(page, route, contract) {
  expect(page.lang === route.lang && page.title === route.title && page.description === route.description, `${page.url}: visible metadata differs`);
  expect(page.canonical === page.url, `${page.url}: canonical differs`);
  const expectedAlternates = [['en', `${SITE_ORIGIN}/faq/`], ['ja', `${SITE_ORIGIN}/ja/faq/`], ['x-default', `${SITE_ORIGIN}/faq/`]].sort();
  expect(exact(page.alternates.map((link) => [link.hreflang, link.href]).sort(), expectedAlternates), `${page.url}: hreflang cluster differs`);
  expect(page.questions.length === contract.scope.questions_per_page && page.questions.every((item) => item.question && item.answer), `${page.url}: visible FAQ content differs`);
  expect(new Set(page.questions.map((item) => item.question)).size === contract.scope.questions_per_page, `${page.url}: duplicate questions`);
  expect(page.faqScripts.length === contract.structured_data_contract.scripts_per_faq_page, `${page.url}: FAQ script count differs`);
  expect(!page.faqScripts[0][2].includes('<'), `${page.url}: unsafe FAQ JSON-LD`);
  const structured = JSON.parse(page.faqScripts[0][2]);
  expect(structured['@context'] === 'https://schema.org' && structured['@type'] === 'FAQPage' && structured['@id'] === `${page.url}#faq` && structured.url === page.url, `${page.url}: FAQ JSON-LD identity differs`);
  expect(structured.name === page.title && structured.description === page.description && structured.inLanguage === page.lang && structured.isPartOf?.['@id'] === `${page.url}#webpage`, `${page.url}: FAQ JSON-LD page fields differ`);
  expect(Array.isArray(structured.mainEntity) && structured.mainEntity.length === contract.scope.questions_per_page, `${page.url}: structured question count differs`);
  for (let index = 0; index < contract.scope.questions_per_page; index += 1) {
    const visible = page.questions[index];
    const entity = structured.mainEntity[index];
    expect(entity?.['@type'] === 'Question' && entity?.name === visible.question, `${page.url}: structured question ${index + 1} differs`);
    expect(entity?.acceptedAnswer?.['@type'] === 'Answer' && entity?.acceptedAnswer?.text === visible.answer, `${page.url}: structured answer ${index + 1} differs`);
  }
  expect(exact(page.relatedLinks.sort(), route.relatedLinks.sort()), `${page.url}: related links differ`);
}
function main() {
  for (const file of [CONTRACT_PATH, AUDIT_PATH, SITEMAP_PATH]) expect(fs.existsSync(file), `Missing ${file}`);
  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  verifyHistorical(contract, audit);
  verifySources(contract);
  const urls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length >= contract.scope.public_pages, `FAQ current sitemap shrank ${urls.length}`);
  expect(urls.includes(`${SITE_ORIGIN}/faq/`) && urls.includes(`${SITE_ORIGIN}/ja/faq/`), 'FAQ routes are missing from sitemap');
  verifyPage(parsePage(`${SITE_ORIGIN}/faq/`), { lang: 'en', title: contract.routes.en.title, description: contract.routes.en.description, relatedLinks: ['/about/', '/disclaimer/', '/sources/', '/glossary/'] }, contract);
  verifyPage(parsePage(`${SITE_ORIGIN}/ja/faq/`), { lang: 'ja', title: contract.routes.ja.title, description: contract.routes.ja.description, relatedLinks: ['/ja/about/', '/ja/disclaimer/', '/ja/sources/', '/ja/glossary/'] }, contract);
  console.log('FAQ_CONTENT_PAGES: pass');
  console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.scope.public_pages}`);
  console.log(`CURRENT_PUBLIC_PAGES: ${urls.length}`);
  console.log(`FAQ_PAGES: ${contract.scope.faq_pages}`);
  console.log(`VISIBLE_QUESTIONS: ${contract.scope.visible_questions}`);
  console.log(`STRUCTURED_QUESTIONS: ${contract.scope.structured_questions}`);
  console.log('NEXT_IMPLEMENTATION_UNIT: METHODS-DATA-POLICY-01');
}
main();
