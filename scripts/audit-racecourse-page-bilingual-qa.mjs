import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const stripTags = (value) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const attr = (html, tagPattern, name) => html.match(new RegExp(`<${tagPattern}[^>]*\\s${name}="([^"]*)"`, 'i'))?.[1] ?? null;
const metaContent = (html, selector) => html.match(new RegExp(`<meta[^>]*${selector}[^>]*content="([^"]*)"[^>]*>`, 'i'))?.[1]
  ?? html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${selector}[^>]*>`, 'i'))?.[1]
  ?? null;
const linkHref = (html, relation, hreflang = null) => {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const link = links.find((tag) => new RegExp(`\\brel="${relation}"`, 'i').test(tag) && (!hreflang || new RegExp(`\\bhreflang="${hreflang}"`, 'i').test(tag)));
  return link?.match(/\bhref="([^"]+)"/i)?.[1] ?? null;
};
const countTags = (html, tag) => (html.match(new RegExp(`<${tag}\\b`, 'gi')) ?? []).length;
const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
const imageAlts = (html) => [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => ({
  tag: match[0],
  alt: match[0].match(/\balt="([^"]*)"/i)?.[1] ?? null,
}));
const headingTexts = (html) => [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({ level: Number(match[1]), text: stripTags(match[2]) }));
const links = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: match[1], text: stripTags(match[2]) }));
const extractTitle = (html) => stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
const extractH1 = (html) => stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
const sourceFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const records = sourceFiles.flatMap((file) => readJson(file)).sort((left, right) => left.slug.localeCompare(right.slug));
if (!fs.existsSync(path.join(root, 'dist'))) throw new Error('dist is missing; run npm run build first');

const expectedSectionPairs = [
  ['Quick facts', '基本情報'],
  ['Reviewed meeting state', '確認済み開催情報'],
  ['Racing types', '競馬種別'],
  ['Race conditions', 'レース条件'],
  ['Course layout', 'コース形状'],
  ['Notable races', '主なレース'],
  ['Seasonality', '開催時期'],
  ['Official and visitor links', '公式・来場者向けリンク'],
  ['Related learning', '関連用語'],
  ['Related sources', '関連ソース'],
  ['Data status', 'データ状態'],
];
const prohibitedRenderedPatterns = [
  /\bhorse name\b/i,
  /\bjockey name\b/i,
  /\btrainer name\b/i,
  /\bodds\b/i,
  /\bpayouts?\b/i,
  /\bpredictions?\b/i,
  /出走馬一覧/,
  /騎手名/,
  /調教師名/,
  /オッズ/,
  /払戻/,
  /予想/,
];
const permittedBoundaryPhrases = [
  'does not display entries, odds, results, payouts, predictions',
  'does not republish full entries, odds, results, payouts, predictions',
  '出走馬、オッズ、結果、払戻、予想、内部キュー情報は表示しません',
  '出走表、オッズ、結果、払戻、予想、完全なレースカードは再掲載しません',
];
const pageResults = [];
const errors = [];
const countPass = {};
const increment = (key, passed) => { countPass[key] = (countPass[key] ?? 0) + Number(Boolean(passed)); };

for (const record of records) {
  const enRoute = `/tracks/${record.slug}/`;
  const jaRoute = `/ja/tracks/${record.slug}/`;
  const en = read(`dist/tracks/${record.slug}/index.html`);
  const ja = read(`dist/ja/tracks/${record.slug}/index.html`);
  const pair = [
    { lang: 'en', route: enRoute, html: en, expectedLang: 'en', expectedCanonical: `https://whr.badjoke-lab.com${enRoute}`, expectedAlternate: `https://whr.badjoke-lab.com${jaRoute}`, expectedSwitch: jaRoute, name: record.name_en },
    { lang: 'ja', route: jaRoute, html: ja, expectedLang: 'ja', expectedCanonical: `https://whr.badjoke-lab.com${jaRoute}`, expectedAlternate: `https://whr.badjoke-lab.com${enRoute}`, expectedSwitch: enRoute, name: record.name_ja },
  ];
  const enHeadings = headingTexts(en);
  const jaHeadings = headingTexts(ja);
  const pairErrors = [];

  for (const page of pair) {
    const title = extractTitle(page.html);
    const description = metaContent(page.html, 'name="description"');
    const canonical = linkHref(page.html, 'canonical');
    const selfAlternate = linkHref(page.html, 'alternate', page.lang);
    const counterpartAlternate = linkHref(page.html, 'alternate', page.lang === 'en' ? 'ja' : 'en');
    const xDefault = linkHref(page.html, 'alternate', 'x-default');
    const pageIds = ids(page.html);
    const duplicateIds = [...new Set(pageIds.filter((id, index) => pageIds.indexOf(id) !== index))];
    const imgs = imageAlts(page.html);
    const pageLinks = links(page.html);
    const emptyLinks = pageLinks.filter((link) => !link.href || link.href === '#');
    const switchLinked = pageLinks.some((link) => link.href === page.expectedSwitch && (page.lang === 'en' ? link.text === '日本語' : link.text === 'English'));
    const skipLinked = pageLinks.some((link) => link.href === '#main-content' && Boolean(link.text));
    const mainPresent = /<main\b[^>]*id="main-content"/i.test(page.html);
    const headerLabel = attr(page.html, 'header', 'aria-label');
    const navLabel = attr(page.html, 'nav', 'aria-label');
    const panelLabelTarget = page.html.match(/<section\b[^>]*data-racecourse-public-meeting-state[^>]*aria-labelledby="([^"]+)"/i)?.[1] ?? null;
    const panelLabelValid = panelLabelTarget ? pageIds.includes(panelLabelTarget) : false;
    const referenceDateVisible = /data-reference-date="2026-07-14"/.test(page.html) && page.html.includes('2026-07-14');
    const titleValid = title.length >= 10 && title.includes(page.name);
    const descriptionValid = Boolean(description && description.length >= 50 && description.includes(page.name));
    const h1Valid = countTags(page.html, 'h1') === 1 && extractH1(page.html).includes(page.name);
    const metadataValid = canonical === page.expectedCanonical
      && selfAlternate === page.expectedCanonical
      && counterpartAlternate === page.expectedAlternate
      && xDefault === `https://whr.badjoke-lab.com${enRoute}`;
    const accessibilityValid = duplicateIds.length === 0
      && imgs.every((image) => image.alt !== null && image.alt.trim().length > 0)
      && emptyLinks.length === 0
      && skipLinked
      && mainPresent
      && Boolean(headerLabel)
      && Boolean(navLabel)
      && panelLabelValid;
    const boundaryNormalized = page.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const prohibitedHits = prohibitedRenderedPatterns.filter((pattern) => pattern.test(boundaryNormalized));
    const boundaryStatementPresent = permittedBoundaryPhrases.some((phrase) => boundaryNormalized.includes(phrase));
    const boundaryValid = prohibitedHits.length === 0 || boundaryStatementPresent;

    const checks = {
      lang_attribute: attr(page.html, 'html', 'lang') === page.expectedLang,
      title: titleValid,
      description: descriptionValid,
      canonical_hreflang: metadataValid,
      language_switch: switchLinked,
      single_h1: h1Valid,
      accessibility: accessibilityValid,
      reference_date: referenceDateVisible,
      public_boundary: boundaryValid,
    };
    for (const [key, value] of Object.entries(checks)) {
      increment(key, value);
      if (!value) pairErrors.push(`${page.route}: ${key}`);
    }
    if (duplicateIds.length) pairErrors.push(`${page.route}: duplicate IDs ${duplicateIds.join(', ')}`);
    if (imgs.some((image) => !image.alt?.trim())) pairErrors.push(`${page.route}: missing image alt`);
    if (emptyLinks.length) pairErrors.push(`${page.route}: empty anchors`);
  }

  for (const [enHeading, jaHeading] of expectedSectionPairs) {
    const enPresent = enHeadings.some((heading) => heading.text === enHeading);
    const jaPresent = jaHeadings.some((heading) => heading.text === jaHeading);
    increment('section_parity', enPresent && jaPresent);
    if (!enPresent || !jaPresent) pairErrors.push(`${record.slug}: section pair missing ${enHeading} / ${jaHeading}`);
  }
  const headingLevelParity = enHeadings.map((heading) => heading.level).join(',') === jaHeadings.map((heading) => heading.level).join(',');
  increment('heading_level_parity', headingLevelParity);
  if (!headingLevelParity) pairErrors.push(`${record.slug}: heading level sequence differs`);
  const routePairComplete = fs.existsSync(path.join(root, `dist/tracks/${record.slug}/index.html`)) && fs.existsSync(path.join(root, `dist/ja/tracks/${record.slug}/index.html`));
  increment('route_pair', routePairComplete);
  if (!routePairComplete) pairErrors.push(`${record.slug}: route pair incomplete`);

  pageResults.push({
    racecourse_id: record.id,
    slug: record.slug,
    english_route: enRoute,
    japanese_route: jaRoute,
    english_heading_count: enHeadings.length,
    japanese_heading_count: jaHeadings.length,
    errors: pairErrors,
  });
  errors.push(...pairErrors);
}

const baseLayout = read('src/layouts/BaseLayout.astro');
const enPageSource = read('src/pages/tracks/[slug].astro');
const jaPageSource = read('src/pages/ja/tracks/[slug].astro');
const panelSource = read('src/components/RacecoursePublicMeetingPanel.astro');
const cssSources = [
  read('src/styles/base.css'),
  read('src/styles/layout.css'),
  read('src/styles/components.css'),
  read('src/styles/utilities.css'),
  enPageSource,
  jaPageSource,
  panelSource,
].join('\n');
const sourceContracts = {
  base_layout_metadata: ['rel="canonical"', 'hreflang="x-default"', 'og:locale', 'twitter:description', 'skip-link', 'id="main-content"'].every((marker) => baseLayout.includes(marker)),
  localized_page_binding: enPageSource.includes('canonicalPath={`/tracks/${track.slug}/`}') && enPageSource.includes('alternatePath={`/ja/tracks/${track.slug}/`}') && jaPageSource.includes('canonicalPath={`/ja/tracks/${track.slug}/`}') && jaPageSource.includes('alternatePath={`/tracks/${track.slug}/`}'),
  responsive_contract: /@media\s*\(max-width:\s*40rem\)/.test(cssSources) && /repeat\(auto-fit,\s*minmax\(/.test(cssSources),
  panel_accessibility_contract: panelSource.includes('aria-labelledby="reviewed-meeting-state-title"') && panelSource.includes('data-racecourse-public-meeting-state'),
  no_horizontal_fixed_layout: !/(?:width|min-width):\s*(?:[8-9]\d{2}|\d{4,})px/.test(`${enPageSource}\n${jaPageSource}\n${panelSource}`),
};
for (const [key, value] of Object.entries(sourceContracts)) if (!value) errors.push(`source contract: ${key}`);

const audit = {
  schema_version: 'racecourse-page-bilingual-qa-discovery-v1',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-BILINGUAL-QA-01',
  fixture: {
    reference_date: '2026-07-14',
    timezone: 'Asia/Tokyo',
  },
  counts: {
    racecourses: records.length,
    bilingual_pages: records.length * 2,
    route_pairs_complete: countPass.route_pair ?? 0,
    language_attributes_valid: countPass.lang_attribute ?? 0,
    localized_titles_valid: countPass.title ?? 0,
    localized_descriptions_valid: countPass.description ?? 0,
    canonical_hreflang_valid: countPass.canonical_hreflang ?? 0,
    language_switches_valid: countPass.language_switch ?? 0,
    single_h1_valid: countPass.single_h1 ?? 0,
    accessibility_valid: countPass.accessibility ?? 0,
    reference_dates_valid: countPass.reference_date ?? 0,
    public_boundaries_valid: countPass.public_boundary ?? 0,
    section_pairs_valid: countPass.section_parity ?? 0,
    heading_level_pairs_valid: countPass.heading_level_parity ?? 0,
    errors: errors.length,
  },
  source_contracts: sourceContracts,
  page_results: pageResults,
  errors,
  boundaries: {
    repository_write: false,
    network_fetch: false,
    public_data_write: false,
    participant_data_display: false,
    betting_data_display: false,
    result_or_payout_display: false,
    prediction_display: false,
    publication: false,
    deployment: false,
  },
};
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}
console.log(JSON.stringify(audit, null, 2));
if (errors.length) process.exitCode = 1;
