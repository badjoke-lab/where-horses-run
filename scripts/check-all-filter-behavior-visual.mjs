import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';
const canonicalRanks = ['', 'A+', 'A', 'B+', 'B', 'C'];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
const report = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  systems: [],
  racecourse_pages: [],
  failures: [],
};

const fail = (scope, message) => {
  report.failures.push(`${scope}: ${message}`);
};

const check = (scope, condition, message) => {
  if (!condition) fail(scope, message);
};

const open = async (pathname, width = 1024, height = 900) => {
  await page.setViewportSize({ width, height });
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 30_000 });
  check(pathname, Boolean(response && response.ok()), `navigation failed (${response?.status() ?? 'no response'})`);
  await page.waitForTimeout(150);
};

const valuesFor = async (selector) => page.locator(selector).evaluate((select) =>
  select instanceof HTMLSelectElement ? [...select.options].map((option) => option.value) : []
);

const visibleDatasetValues = async (selector, key) => page.locator(selector).evaluateAll((nodes, datasetKey) =>
  nodes
    .filter((node) => node instanceof HTMLElement && !node.hidden)
    .map((node) => node instanceof HTMLElement ? node.dataset[datasetKey] || '' : '')
    .filter(Boolean), key
);

const visibleCount = async (selector) => page.locator(selector).evaluateAll((nodes) =>
  nodes.filter((node) => node instanceof HTMLElement && !node.hidden).length
);

const firstVisibleDatasetValue = async (selector, key) => {
  const values = await visibleDatasetValues(selector, key);
  return values[0] || '';
};

const clickReset = async (selector) => {
  const button = page.locator(selector);
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(80);
  }
};

const assertAllVisibleEqual = async (scope, rowSelector, datasetKey, expected) => {
  const values = await visibleDatasetValues(rowSelector, datasetKey);
  check(scope, values.length > 0, `filter ${datasetKey}=${expected} produced no visible records`);
  check(scope, values.every((value) => value === expected), `visible records do not all match ${datasetKey}=${expected}: ${[...new Set(values)].join(', ')}`);
};

const auditHome = async (locale) => {
  const scope = `home-${locale}`;
  const pathname = locale === 'ja' ? '/ja/' : '/';
  await open(pathname, 1024, 900);
  await page.waitForSelector('[data-today-controls]');
  await page.waitForFunction(() => document.documentElement.dataset.calendarRuntimePending !== 'true', null, { timeout: 6500 }).catch(() => {});

  const rankValues = await valuesFor('[data-today-filter="rank"]');
  check(scope, JSON.stringify(rankValues) === JSON.stringify(canonicalRanks), `rank options are ${JSON.stringify(rankValues)} instead of ${JSON.stringify(canonicalRanks)}`);

  const countryOptions = await valuesFor('[data-today-filter="country"]');
  const authorityOptions = await valuesFor('[data-today-filter="authority"]');
  const allRowCountries = await page.locator('[data-calendar-meeting-row]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node instanceof HTMLElement ? node.dataset.country || '' : '').filter(Boolean))]);
  const allRowAuthorities = await page.locator('[data-calendar-meeting-row]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node instanceof HTMLElement ? node.dataset.authority || '' : '').filter(Boolean))]);
  check(scope, countryOptions.slice(1).every((value) => allRowCountries.includes(value)), `country option values are not canonical row ids: ${countryOptions.slice(1).filter((value) => !allRowCountries.includes(value)).join(', ')}`);
  check(scope, authorityOptions.slice(1).every((value) => allRowAuthorities.includes(value)), `authority option values are not canonical row ids: ${authorityOptions.slice(1).filter((value) => !allRowAuthorities.includes(value)).join(', ')}`);

  const initialVisible = await visibleCount('[data-calendar-meeting-row]');
  const selectedCountry = await firstVisibleDatasetValue('[data-calendar-meeting-row]', 'country');
  if (selectedCountry && countryOptions.includes(selectedCountry)) {
    await page.selectOption('[data-today-filter="country"]', selectedCountry);
    await page.waitForTimeout(80);
    await assertAllVisibleEqual(scope, '[data-calendar-meeting-row]', 'country', selectedCountry);
    await clickReset('[data-today-filter-reset]');
  } else {
    fail(scope, `could not exercise country filter from currently visible records (value=${selectedCountry})`);
  }

  const selectedAuthority = await firstVisibleDatasetValue('[data-calendar-meeting-row]', 'authority');
  if (selectedAuthority && authorityOptions.includes(selectedAuthority)) {
    await page.selectOption('[data-today-filter="authority"]', selectedAuthority);
    await page.waitForTimeout(80);
    await assertAllVisibleEqual(scope, '[data-calendar-meeting-row]', 'authority', selectedAuthority);
    await clickReset('[data-today-filter-reset]');
  } else {
    fail(scope, `could not exercise authority filter from currently visible records (value=${selectedAuthority})`);
  }

  const selectedRank = await firstVisibleDatasetValue('[data-calendar-meeting-row]', 'rank');
  if (selectedRank && canonicalRanks.includes(selectedRank)) {
    await page.selectOption('[data-today-filter="rank"]', selectedRank);
    await page.waitForTimeout(80);
    await assertAllVisibleEqual(scope, '[data-calendar-meeting-row]', 'rank', selectedRank);
    await clickReset('[data-today-filter-reset]');
  } else {
    fail(scope, `could not exercise rank filter from currently visible records (value=${selectedRank})`);
  }

  const resetState = await page.locator('[data-today-controls]').evaluate((root) => {
    const country = root.querySelector('[data-today-filter="country"]');
    const authority = root.querySelector('[data-today-filter="authority"]');
    const rank = root.querySelector('[data-today-filter="rank"]');
    const reset = root.querySelector('[data-today-filter-reset]');
    const style = reset instanceof HTMLElement ? getComputedStyle(reset) : null;
    const rect = reset instanceof HTMLElement ? reset.getBoundingClientRect() : null;
    return {
      country: country instanceof HTMLSelectElement ? country.value : null,
      authority: authority instanceof HTMLSelectElement ? authority.value : null,
      rank: rank instanceof HTMLSelectElement ? rank.value : null,
      resetWhiteSpace: style?.whiteSpace ?? null,
      resetWidth: rect?.width ?? 0,
      resetHeight: rect?.height ?? 0,
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - innerWidth,
    };
  });
  check(scope, resetState.country === '' && resetState.authority === '' && resetState.rank === '', `reset did not clear Home filters: ${JSON.stringify(resetState)}`);
  check(scope, resetState.resetWhiteSpace === 'nowrap', `reset may wrap; white-space=${resetState.resetWhiteSpace}`);
  check(scope, resetState.resetHeight <= 60, `reset control is too tall (${resetState.resetHeight}px)`);
  check(scope, resetState.overflow <= 2, `desktop horizontal overflow ${resetState.overflow}px`);
  check(scope, await visibleCount('[data-calendar-meeting-row]') === initialVisible, `reset did not restore visible row count (${initialVisible})`);

  await page.locator('[data-today-controls]').screenshot({ path: path.join(outputDir, `${scope}-filters-1024.png`) });

  await open(pathname, 768, 900);
  await page.waitForSelector('[data-today-controls]');
  const compact = await page.locator('[data-today-controls]').evaluate((root) => {
    const reset = root.querySelector('[data-today-filter-reset]');
    const rect = reset instanceof HTMLElement ? reset.getBoundingClientRect() : null;
    return {
      whiteSpace: reset instanceof HTMLElement ? getComputedStyle(reset).whiteSpace : null,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - innerWidth,
    };
  });
  check(scope, compact.whiteSpace === 'nowrap', `768px reset may wrap; white-space=${compact.whiteSpace}`);
  check(scope, compact.height <= 60, `768px reset is too tall (${compact.height}px)`);
  check(scope, compact.overflow <= 2, `768px horizontal overflow ${compact.overflow}px`);
  await page.locator('[data-today-controls]').screenshot({ path: path.join(outputDir, `${scope}-filters-768.png`) });

  report.systems.push({ scope, path: pathname, rankValues, initialVisible, resetState, compact });
};

const auditCalendar = async (locale) => {
  const scope = `calendar-${locale}`;
  const pathname = locale === 'ja' ? '/ja/calendar/?view=list' : '/calendar/?view=list';
  await open(pathname, 1024, 900);
  await page.waitForSelector('[data-calendar-filters]');
  await page.locator('[data-calendar-filters] > summary').click();
  const rankValues = await valuesFor('[data-filter-rank]');
  check(scope, JSON.stringify(rankValues) === JSON.stringify(canonicalRanks), `rank options are ${JSON.stringify(rankValues)} instead of ${JSON.stringify(canonicalRanks)}`);

  const countryOptions = await valuesFor('[data-filter-country]');
  const authorityOptions = await valuesFor('[data-filter-authority]');
  const rowCountries = await page.locator('[data-calendar-meeting-row]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node instanceof HTMLElement ? node.dataset.country || '' : '').filter(Boolean))]);
  const rowAuthorities = await page.locator('[data-calendar-meeting-row]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node instanceof HTMLElement ? node.dataset.authority || '' : '').filter(Boolean))]);
  check(scope, countryOptions.slice(1).every((value) => rowCountries.includes(value)), 'Calendar country options do not use canonical row ids');
  check(scope, authorityOptions.slice(1).every((value) => rowAuthorities.includes(value)), 'Calendar authority options do not use canonical row ids');

  const selectedCountry = countryOptions.slice(1).find((value) => rowCountries.includes(value));
  if (selectedCountry) {
    await page.selectOption('[data-filter-country]', selectedCountry);
    await page.waitForTimeout(80);
    const visible = await visibleDatasetValues('[data-calendar-meeting-row]', 'country');
    check(scope, visible.every((value) => value === selectedCountry), `Calendar country filter leaked values: ${[...new Set(visible)].join(', ')}`);
    await clickReset('[data-filter-reset]');
  }

  const selectedAuthority = authorityOptions.slice(1).find((value) => rowAuthorities.includes(value));
  if (selectedAuthority) {
    await page.selectOption('[data-filter-authority]', selectedAuthority);
    await page.waitForTimeout(80);
    const visible = await visibleDatasetValues('[data-calendar-meeting-row]', 'authority');
    check(scope, visible.every((value) => value === selectedAuthority), `Calendar authority filter leaked values: ${[...new Set(visible)].join(', ')}`);
    await clickReset('[data-filter-reset]');
  }

  const presentRank = await page.locator('[data-calendar-meeting-row]').evaluateAll((nodes) => nodes.find((node) => node instanceof HTMLElement && !node.hidden)?.dataset.rank || '');
  if (presentRank && canonicalRanks.includes(presentRank)) {
    await page.selectOption('[data-filter-rank]', presentRank);
    await page.waitForTimeout(80);
    const visible = await visibleDatasetValues('[data-calendar-meeting-row]', 'rank');
    check(scope, visible.every((value) => value === presentRank), `Calendar rank filter leaked values: ${[...new Set(visible)].join(', ')}`);
    await clickReset('[data-filter-reset]');
  }

  report.systems.push({ scope, path: pathname, rankValues });
};

const auditSimpleSelectFilter = async ({ scope, pathname, select, rows, datasetKey, reset, preferredValue }) => {
  await open(pathname, 1024, 900);
  await page.waitForSelector(select);
  const options = await valuesFor(select);
  const selected = preferredValue && options.includes(preferredValue) ? preferredValue : options.find((value) => value && value !== 'all');
  if (!selected) {
    fail(scope, `no non-All option available for ${select}`);
    report.systems.push({ scope, path: pathname, options, skipped: true });
    return;
  }
  await page.selectOption(select, selected);
  await page.waitForTimeout(80);
  const values = await visibleDatasetValues(rows, datasetKey);
  check(scope, values.length > 0, `${selected} produced no visible records`);
  check(scope, values.every((value) => value.split('|').includes(selected) || value === selected), `visible rows do not all match ${datasetKey}=${selected}: ${[...new Set(values)].join(', ')}`);
  if (reset) await clickReset(reset);
  report.systems.push({ scope, path: pathname, selected, visible: values.length });
};

for (const locale of ['en', 'ja']) {
  await auditHome(locale);
  await auditCalendar(locale);

  const prefix = locale === 'ja' ? '/ja' : '';
  await auditSimpleSelectFilter({
    scope: `countries-${locale}`,
    pathname: `${prefix}/countries/`,
    select: '[data-country-filter-region]',
    rows: '[data-country-record]',
    datasetKey: 'countryRegions',
    reset: '[data-country-filter-reset]',
  });
  await auditSimpleSelectFilter({
    scope: `racecourses-${locale}`,
    pathname: `${prefix}/tracks/`,
    select: '[data-racecourse-filter-country]',
    rows: '[data-racecourse-record]',
    datasetKey: 'racecourseCountry',
    reset: '[data-racecourse-filter-reset]',
  });
  await auditSimpleSelectFilter({
    scope: `sources-${locale}`,
    pathname: `${prefix}/sources/`,
    select: '[data-source-filter-country]',
    rows: '[data-source-record]',
    datasetKey: 'sourceCountry',
    reset: '[data-source-filter-reset]',
  });
  await auditSimpleSelectFilter({
    scope: `glossary-${locale}`,
    pathname: `${prefix}/glossary/`,
    select: '[data-glossary-filter-category]',
    rows: '[data-glossary-record]',
    datasetKey: 'glossaryCategory',
    reset: '[data-glossary-filter-reset]',
  });
  await auditSimpleSelectFilter({
    scope: `search-${locale}`,
    pathname: `${prefix}/search/`,
    select: '[data-search-type]',
    rows: '[data-search-record]',
    datasetKey: 'searchType',
    preferredValue: 'racecourse',
  });
}

for (const locale of ['en', 'ja']) {
  const prefix = locale === 'ja' ? '/ja' : '';
  const scope = `racecourse-detail-${locale}`;
  const pathname = `${prefix}/tracks/tokyo-racecourse/`;
  await open(pathname, 1200, 900);
  await page.waitForSelector('[data-racecourse-detail-v3]');
  const inspection = await page.locator('[data-racecourse-detail-v3]').evaluate((root) => {
    const text = root.textContent || '';
    return {
      hasLocation: Boolean(root.querySelector('[data-racecourse-location-section]')),
      hasMeeting: Boolean(root.querySelector('[data-racecourse-meeting-summary]')),
      hasSourceHeading: [...root.querySelectorAll('h2')].some((heading) => /Official sources|公式ソース/.test(heading.textContent || '')),
      imageCount: root.querySelectorAll('img').length,
      hasNotableRaceSection: /Notable races|主なレース/.test(text),
      hasCourseDiagramText: /Course diagram|コース模式図/.test(text),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - innerWidth,
    };
  });
  check(scope, inspection.hasLocation, 'reviewed location section is missing');
  check(scope, inspection.hasMeeting, 'meeting summary is missing');
  check(scope, inspection.hasSourceHeading, 'official sources panel is missing');
  check(scope, inspection.imageCount === 0, `racecourse V3 introduced ${inspection.imageCount} image(s)`);
  check(scope, !inspection.hasNotableRaceSection, 'notable-race section is exposed before accepted data is ready');
  check(scope, !inspection.hasCourseDiagramText, 'course diagram content is exposed before accepted data is ready');
  check(scope, inspection.overflow <= 2, `horizontal overflow ${inspection.overflow}px`);
  await page.screenshot({ path: path.join(outputDir, `${scope}-1200.png`), fullPage: true });
  report.racecourse_pages.push({ scope, path: pathname, inspection });
}

await browser.close();
await fs.writeFile(path.join(outputDir, 'filter-behavior.json'), `${JSON.stringify(report, null, 2)}\n`);

if (report.failures.length) {
  console.error(`Filter/racecourse behavior audit failed (${report.failures.length}):`);
  report.failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Filter/racecourse behavior audit passed: ${report.systems.length} filter systems checked, ${report.racecourse_pages.length} racecourse pages checked.`);
