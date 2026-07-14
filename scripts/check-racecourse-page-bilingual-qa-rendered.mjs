import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const stripTags = (value) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const tagList = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
const tagAttr = (tag, name) => tag?.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
const firstTagAttr = (html, tagName, attrName) => tagAttr(tagList(html, tagName)[0], attrName);
const metaContent = (html, selector) => {
  const tag = tagList(html, 'meta').find((value) => new RegExp(selector, 'i').test(value));
  return tagAttr(tag, 'content');
};
const linkHref = (html, rel, hreflang = null) => {
  const tag = tagList(html, 'link').find((value) => tagAttr(value, 'rel') === rel && (!hreflang || tagAttr(value, 'hreflang') === hreflang));
  return tagAttr(tag, 'href');
};
const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
const headings = (html) => [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({ level: Number(match[1]), text: stripTags(match[2]) }));
const anchors = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({ href: match[1], text: stripTags(match[2]) }));
const title = (html) => stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
const h1 = (html) => stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
const count = (html, tag) => (html.match(new RegExp(`<${tag}\\b`, 'gi')) ?? []).length;
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

const alwaysSectionPairs = [
  ['Quick facts', '基本情報'],
  ['Reviewed meeting state', '確認済み開催情報'],
  ['Racing types', '競馬種別'],
  ['Course layout', 'コース構造'],
  ['Notable races', '代表レース'],
  ['Seasonality', '開催シーズン'],
  ['Official and visitor links', '公式・来場関連リンク'],
  ['Related learning', '関連学習'],
  ['Related sources', '関連ソース'],
  ['Data status', 'データ状態'],
];
const optionalSectionPairs = [
  ['Venue scale', '規模感'],
  ['Upcoming race conditions', '直近開催のレース条件'],
  ['Race distances', '実施レース距離'],
];
const prohibitedFieldAccess = /\b(?:meeting|track)\.(?:horse_name|jockey_name|trainer_name|odds|payout|prediction|raw_html|source_body|stream_url)\b/i;
const counts = Object.create(null);
const add = (key, value) => { counts[key] = (counts[key] ?? 0) + Number(Boolean(value)); };
const errors = [];
const results = [];

for (const record of records) {
  const enRoute = `/tracks/${record.slug}/`;
  const jaRoute = `/ja/tracks/${record.slug}/`;
  const enFile = path.join(root, `dist/tracks/${record.slug}/index.html`);
  const jaFile = path.join(root, `dist/ja/tracks/${record.slug}/index.html`);
  const routePair = fs.existsSync(enFile) && fs.existsSync(jaFile);
  add('route_pairs', routePair);
  if (!routePair) {
    errors.push(`${record.slug}: route pair missing`);
    continue;
  }
  const en = fs.readFileSync(enFile, 'utf8');
  const ja = fs.readFileSync(jaFile, 'utf8');
  const pairErrors = [];
  const pages = [
    { lang: 'en', html: en, route: enRoute, counterpart: jaRoute, name: record.name_en, descriptionMinimum: 40 },
    { lang: 'ja', html: ja, route: jaRoute, counterpart: enRoute, name: record.name_ja, descriptionMinimum: 18 },
  ];

  for (const page of pages) {
    const canonical = `https://whr.badjoke-lab.com${page.route}`;
    const alternate = `https://whr.badjoke-lab.com${page.counterpart}`;
    const pageIds = ids(page.html);
    const duplicates = [...new Set(pageIds.filter((id, index) => pageIds.indexOf(id) !== index))];
    const pageAnchors = anchors(page.html);
    const imageTags = tagList(page.html, 'img');
    const panelTag = tagList(page.html, 'section').find((tag) => /\bdata-racecourse-public-meeting-state(?:\s|>|=)/i.test(tag));
    const panelLabelId = tagAttr(panelTag, 'aria-labelledby');
    const description = metaContent(page.html, 'name="description"');
    const switchText = page.lang === 'en' ? '日本語' : 'English';
    const checks = {
      language: firstTagAttr(page.html, 'html', 'lang') === page.lang,
      title: title(page.html).includes(page.name) && title(page.html).length >= 8,
      description: Boolean(description && description.includes(page.name) && description.length >= page.descriptionMinimum),
      canonical: linkHref(page.html, 'canonical') === canonical,
      self_hreflang: linkHref(page.html, 'alternate', page.lang) === canonical,
      counterpart_hreflang: linkHref(page.html, 'alternate', page.lang === 'en' ? 'ja' : 'en') === alternate,
      x_default: linkHref(page.html, 'alternate', 'x-default') === `https://whr.badjoke-lab.com${enRoute}`,
      language_switch: pageAnchors.some((link) => link.href === page.counterpart && link.text === switchText),
      one_h1: count(page.html, 'h1') === 1 && h1(page.html).includes(page.name),
      unique_ids: duplicates.length === 0,
      image_alt: imageTags.every((tag) => tagAttr(tag, 'alt')?.trim()),
      nonempty_anchors: pageAnchors.every((link) => link.href && link.href !== '#' && link.text),
      skip_link: pageAnchors.some((link) => link.href === '#main-content' && link.text),
      main_landmark: tagList(page.html, 'main').some((tag) => tagAttr(tag, 'id') === 'main-content'),
      labeled_header: tagList(page.html, 'header').some((tag) => Boolean(tagAttr(tag, 'aria-label'))),
      labeled_nav: tagList(page.html, 'nav').some((tag) => Boolean(tagAttr(tag, 'aria-label'))),
      panel_label: Boolean(panelLabelId && pageIds.includes(panelLabelId)),
      reference_date: /data-reference-date="2026-07-14"/.test(page.html) && page.html.includes('2026-07-14'),
      public_boundary_notice: page.lang === 'en'
        ? page.html.includes('does not display entries, odds, results, payouts, predictions') && page.html.includes('does not republish full entries, odds, results, payouts, predictions')
        : page.html.includes('出走馬、オッズ、結果、払戻、予想、内部キュー情報は表示しません') && page.html.includes('出走表・オッズ・結果・払戻・予想・完全なレースカードは掲載しません'),
    };
    for (const [key, passed] of Object.entries(checks)) {
      add(key, passed);
      if (!passed) pairErrors.push(`${page.route}: ${key}`);
    }
  }

  const enHeadings = headings(en);
  const jaHeadings = headings(ja);
  for (const [enHeading, jaHeading] of alwaysSectionPairs) {
    const passed = enHeadings.some((heading) => heading.text === enHeading) && jaHeadings.some((heading) => heading.text === jaHeading);
    add('required_section_pairs', passed);
    if (!passed) pairErrors.push(`${record.slug}: required section ${enHeading} / ${jaHeading}`);
  }
  for (const [enHeading, jaHeading] of optionalSectionPairs) {
    const enPresent = enHeadings.some((heading) => heading.text === enHeading);
    const jaPresent = jaHeadings.some((heading) => heading.text === jaHeading);
    const passed = enPresent === jaPresent;
    add('optional_section_pairs', passed);
    if (!passed) pairErrors.push(`${record.slug}: optional section parity ${enHeading} / ${jaHeading}`);
  }
  const headingLevelsMatch = enHeadings.map((heading) => heading.level).join(',') === jaHeadings.map((heading) => heading.level).join(',');
  add('heading_level_pairs', headingLevelsMatch);
  if (!headingLevelsMatch) pairErrors.push(`${record.slug}: heading level sequence`);
  results.push({ racecourse_id: record.id, slug: record.slug, errors: pairErrors });
  errors.push(...pairErrors);
}

const baseLayout = read('src/layouts/BaseLayout.astro');
const enSource = read('src/pages/tracks/[slug].astro');
const jaSource = read('src/pages/ja/tracks/[slug].astro');
const panelSource = read('src/components/RacecoursePublicMeetingPanel.astro');
const cssSource = [read('src/styles/base.css'), read('src/styles/layout.css'), read('src/styles/components.css'), read('src/styles/utilities.css'), enSource, jaSource, panelSource].join('\n');
const sourceContracts = {
  metadata: ['rel="canonical"', 'hreflang="x-default"', 'og:locale', 'twitter:description'].every((marker) => baseLayout.includes(marker)),
  inferred_bilingual_routes: baseLayout.includes('bilingualPathPatterns') && baseLayout.includes('inferredAlternateHref') && /tracks/.test(baseLayout),
  accessibility: ['skip-link', 'id="main-content"', 'aria-label'].every((marker) => baseLayout.includes(marker)) && panelSource.includes('aria-labelledby="reviewed-meeting-state-title"'),
  responsive: /@media\s*\(max-width:\s*40rem\)/.test(cssSource) && /repeat\(auto-fit,\s*minmax\(/.test(cssSource),
  no_large_fixed_width: !/(?:width|min-width):\s*(?:[8-9]\d{2}|\d{4,})px/.test(`${enSource}\n${jaSource}\n${panelSource}`),
  prohibited_field_access: !prohibitedFieldAccess.test(`${enSource}\n${jaSource}\n${panelSource}`),
};
for (const [key, passed] of Object.entries(sourceContracts)) if (!passed) errors.push(`source contract: ${key}`);

const audit = {
  schema_version: 'racecourse-page-bilingual-qa-rendered-v1',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-BILINGUAL-QA-01',
  fixture: { reference_date: '2026-07-14', timezone: 'Asia/Tokyo' },
  counts: {
    racecourses: records.length,
    bilingual_pages: records.length * 2,
    route_pairs_complete: counts.route_pairs ?? 0,
    language_valid: counts.language ?? 0,
    titles_valid: counts.title ?? 0,
    descriptions_valid: counts.description ?? 0,
    canonical_valid: counts.canonical ?? 0,
    self_hreflang_valid: counts.self_hreflang ?? 0,
    counterpart_hreflang_valid: counts.counterpart_hreflang ?? 0,
    x_default_valid: counts.x_default ?? 0,
    language_switch_valid: counts.language_switch ?? 0,
    one_h1_valid: counts.one_h1 ?? 0,
    unique_ids_valid: counts.unique_ids ?? 0,
    image_alt_valid: counts.image_alt ?? 0,
    nonempty_anchors_valid: counts.nonempty_anchors ?? 0,
    skip_links_valid: counts.skip_link ?? 0,
    main_landmarks_valid: counts.main_landmark ?? 0,
    labeled_headers_valid: counts.labeled_header ?? 0,
    labeled_navs_valid: counts.labeled_nav ?? 0,
    panel_labels_valid: counts.panel_label ?? 0,
    reference_dates_valid: counts.reference_date ?? 0,
    public_boundary_notices_valid: counts.public_boundary_notice ?? 0,
    required_section_pairs_valid: counts.required_section_pairs ?? 0,
    optional_section_pairs_valid: counts.optional_section_pairs ?? 0,
    heading_level_pairs_valid: counts.heading_level_pairs ?? 0,
    errors: errors.length,
  },
  source_contracts: sourceContracts,
  page_results: results,
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
