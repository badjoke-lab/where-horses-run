import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const CONTRACT_PATH = 'data/static/methods-data-policy-contract-v1.json';
const AUDIT_PATH = 'data/audits/methods-data-policy-v1.json';
const COMPONENT_PATH = 'src/components/MethodsPage.astro';
const EN_ROUTE_PATH = 'src/pages/methods/index.astro';
const JA_ROUTE_PATH = 'src/pages/ja/methods/index.astro';
const EN_ABOUT_PATH = 'src/pages/about/index.astro';
const JA_ABOUT_PATH = 'src/pages/ja/about/index.astro';
const DOC_PATH = 'docs/seo/methods-data-policy.md';
const WORKFLOW_PATH = '.github/workflows/methods-data-policy.yml';
const TEMPORARY_WORKFLOW_PATH = '.github/workflows/temporary-methods-data-policy-discovery.yml';
const SITEMAP_PATH = 'dist/sitemap.xml';

const read = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(read(file));
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function decode(value) {
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

function strip(value) {
  return decode(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
}

function fileFor(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
}

function parsePage(url) {
  const file = fileFor(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metas = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => attrs(match[0]));
  const description = metas.filter((meta) => meta.name === 'description');
  const canonical = links.filter((link) => link.rel === 'canonical');
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const sections = [...html.matchAll(/<section\s+[^>]*class="[^"]*methods-section[^"]*"[^>]*>([\s\S]*?)<\/section>/gi)].map((match) => ({
    heading: strip(match[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? ''),
    paragraphs: [...match[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((paragraph) => strip(paragraph[1])),
  }));
  const related = html.match(/<section\s+[^>]*class="[^"]*methods-related[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const relatedLinks = [...related.matchAll(/<a\s+[^>]*>/gi)].map((match) => attrs(match[0]).href).filter(Boolean);
  return {
    url,
    html,
    lang,
    title,
    description: description.length === 1 ? description[0].content ?? '' : '',
    descriptionCount: description.length,
    canonical: canonical.length === 1 ? canonical[0].href ?? '' : '',
    canonicalCount: canonical.length,
    alternates,
    sections,
    relatedLinks,
  };
}

function verifyContract(contract, audit) {
  expect(contract.schema_version === 'methods-data-policy-contract-v1', 'Methods contract schema differs');
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'Methods Work ID differs');
  expect(contract.implementation_unit === 'METHODS-DATA-POLICY-01', 'Methods implementation unit differs');
  expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'Methods contract status or date differs');
  expect(exact(contract.scope, {
    public_pages: 771,
    english_pages: 387,
    japanese_pages: 384,
    methods_pages: 2,
    languages: 2,
    sections_per_page: 9,
    visible_sections: 18,
    paragraphs_per_page: 18,
    visible_paragraphs: 36,
    about_page_method_links: 2,
    related_page_links: 8,
  }), 'Methods scope differs');
  expect(contract.public_boundary.revenue_or_monetization_discussion_allowed === false, 'Methods revenue boundary differs');
  expect(contract.public_boundary.source_specific_internal_risk_posture_allowed === false, 'Methods internal-risk boundary differs');
  expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'Methods privacy boundary differs');
  expect(Object.values(contract.automation_boundary).every((value) => value === false), 'Methods automation boundary differs');
  expect(contract.next_implementation_unit === 'SEO-QA-RELEASE-01', 'Methods next unit differs');

  expect(audit.schema_version === 'methods-data-policy-audit-v1' && audit.status === 'complete', 'Methods audit identity differs');
  for (const [key, value] of Object.entries({ public_pages: 771, english_pages: 387, japanese_pages: 384, methods_pages: 2, visible_sections: 18, visible_paragraphs: 36, about_page_method_links: 2, related_page_links: 8 })) {
    expect(audit.verified[key] === value, `Methods audit ${key} differs`);
  }
  for (const key of ['missing_methods_routes', 'canonical_errors', 'hreflang_errors', 'title_errors', 'description_errors', 'section_count_errors', 'paragraph_count_errors', 'empty_section_errors', 'empty_paragraph_errors', 'topic_coverage_errors', 'topic_parity_errors', 'about_navigation_errors', 'related_navigation_errors', 'forbidden_public_topic_errors', 'temporary_discovery_workflows', 'contract_errors', 'output_errors']) {
    expect(audit.verified[key] === 0, `Methods audit ${key} differs`);
  }
}

function verifySources() {
  for (const file of [COMPONENT_PATH, EN_ROUTE_PATH, JA_ROUTE_PATH, EN_ABOUT_PATH, JA_ABOUT_PATH, DOC_PATH, WORKFLOW_PATH]) expect(fs.existsSync(file), `Methods source file missing: ${file}`);
  expect(!fs.existsSync(TEMPORARY_WORKFLOW_PATH), 'Temporary methods discovery workflow remains');
  const component = read(COMPONENT_PATH);
  for (const marker of ["locale: 'en' | 'ja'", "canonicalPath = isJa ? '/ja/methods/' : '/methods/'", 'class="card methods-section"', 'class="card methods-related"']) {
    expect(component.includes(marker), `Methods component marker missing: ${marker}`);
  }
  const forbidden = [/revenue/i, /monetization/i, /budget/i, /other project/i, /internal circumstances/i, /収益/, /予算/, /他プロジェクト/, /内部事情/];
  for (const pattern of forbidden) expect(!pattern.test(component), `Methods component contains forbidden public topic ${pattern}`);
  expect(read(EN_ROUTE_PATH).includes('<MethodsPage locale="en" />'), 'English methods route differs');
  expect(read(JA_ROUTE_PATH).includes('<MethodsPage locale="ja" />'), 'Japanese methods route differs');
  expect(read(EN_ABOUT_PATH).includes('href="/methods/"'), 'English About methods link is missing');
  expect(read(JA_ABOUT_PATH).includes('href="/ja/methods/"'), 'Japanese About methods link is missing');
  const doc = read(DOC_PATH);
  for (const marker of ['METHODS-DATA-POLICY-01', 'Public pages: 771', 'Visible sections: 18', 'Visible paragraphs: 36', 'SEO-QA-RELEASE-01']) expect(doc.includes(marker), `Methods documentation marker missing: ${marker}`);
  const workflow = read(WORKFLOW_PATH);
  for (const marker of ['npm run build', 'node scripts/check-sitemap-robots.mjs', 'node scripts/check-faq-content-pages.mjs', 'node scripts/check-methods-data-policy.mjs', 'git status --porcelain']) expect(workflow.includes(marker), `Methods workflow marker missing: ${marker}`);
}

function verifyPage(page, route) {
  expect(page.lang === route.lang, `${page.url}: language differs`);
  expect(page.title === route.title, `${page.url}: title differs`);
  expect(page.descriptionCount === 1 && page.description === route.description, `${page.url}: description differs`);
  expect(page.canonicalCount === 1 && page.canonical === page.url, `${page.url}: canonical differs`);
  const expectedAlternates = [['en', `${SITE_ORIGIN}/methods/`], ['ja', `${SITE_ORIGIN}/ja/methods/`], ['x-default', `${SITE_ORIGIN}/methods/`]].sort();
  const actualAlternates = page.alternates.map((link) => [link.hreflang, link.href]).sort();
  expect(exact(actualAlternates, expectedAlternates), `${page.url}: hreflang cluster differs`);
  expect(page.sections.length === 9, `${page.url}: section count differs ${page.sections.length}`);
  expect(page.sections.every((section) => section.heading && section.paragraphs.length === 2), `${page.url}: section structure differs`);
  expect(page.sections.flatMap((section) => section.paragraphs).length === 18, `${page.url}: paragraph count differs`);
  expect(page.sections.flatMap((section) => section.paragraphs).every(Boolean), `${page.url}: empty paragraph remains`);
  expect(exact(page.relatedLinks.sort(), route.relatedLinks.sort()), `${page.url}: related links differ`);
  for (const phrase of route.requiredPhrases) expect(page.html.includes(phrase), `${page.url}: required topic marker missing: ${phrase}`);
}

function main() {
  for (const file of [CONTRACT_PATH, AUDIT_PATH, SITEMAP_PATH]) expect(fs.existsSync(file), `Missing ${file}`);
  const contract = readJson(CONTRACT_PATH);
  const audit = readJson(AUDIT_PATH);
  verifyContract(contract, audit);
  verifySources();
  const urls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length === 771, `Methods sitemap count differs ${urls.length}`);
  const en = parsePage(`${SITE_ORIGIN}/methods/`);
  const ja = parsePage(`${SITE_ORIGIN}/ja/methods/`);
  verifyPage(en, {
    lang: 'en', title: contract.routes.en.title, description: contract.routes.en.description,
    relatedLinks: ['/about/', '/faq/', '/disclaimer/', '/sources/'],
    requiredPhrases: ['Official sources', 'Reference sources', 'Review before publication', 'Dates, times, and timezones', 'Publication ranks', 'Last checked', 'Corrections, reduction, and removal', 'Excluded information and limitations'],
  });
  verifyPage(ja, {
    lang: 'ja', title: contract.routes.ja.title, description: contract.routes.ja.description,
    relatedLinks: ['/ja/about/', '/ja/faq/', '/ja/disclaimer/', '/ja/sources/'],
    requiredPhrases: ['公式ソース', '参考ソース', 'レビューから公開まで', '日付・時刻・タイムゾーン', '公開ランク', '確認日と更新', '訂正・縮小・削除', '掲載しない情報と制限事項'],
  });
  console.log('METHODS_DATA_POLICY: pass');
  console.log('PUBLIC_PAGES: 771');
  console.log('METHODS_PAGES: 2');
  console.log('VISIBLE_SECTIONS: 18');
  console.log('VISIBLE_PARAGRAPHS: 36');
  console.log('ABOUT_PAGE_METHOD_LINKS: 2');
  console.log('RELATED_PAGE_LINKS: 8');
  console.log('NEXT_IMPLEMENTATION_UNIT: SEO-QA-RELEASE-01');
}

main();
