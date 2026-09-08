import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';
const reportPath = path.join(outputDir, 'calendar-context-acceptance.json');

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { generated_at: new Date().toISOString(), base_url: baseUrl, scenarios: [], failures: [] };

const visible = async (locator) => locator.isVisible().catch(() => false);
const waitForPresentation = async (page) => {
  await page.waitForFunction(() => {
    const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')];
    if (!rows.length) return true;
    return rows.some((row) => row instanceof HTMLElement && row.dataset.meetingPresentationState !== 'unknown');
  }, null, { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(350);
};

const screenshot = async (page, name) => {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(outputDir, file), fullPage: false, animations: 'disabled' });
  return file;
};

const record = (id, checks, failures) => {
  const entry = { id, checks, failures };
  report.scenarios.push(entry);
  if (failures.length) report.failures.push(entry);
  console.log(`${failures.length ? 'FAIL' : 'PASS'} ${id}`);
  failures.forEach((failure) => console.log(`  - ${failure}`));
};

const firstVisibleMeetingInViewport = async (page) => page.evaluate(() => {
  const nav = document.querySelector('.mobile-bottom-nav');
  const bottom = nav instanceof HTMLElement ? nav.getBoundingClientRect().top : innerHeight;
  const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')]
    .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none');
  return {
    rowCount: rows.length,
    inViewport: rows.some((row) => {
      const rect = row.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < bottom;
    }),
    firstTop: rows[0] instanceof HTMLElement ? Math.round(rows[0].getBoundingClientRect().top) : null,
    contentBottom: Math.round(bottom),
  };
});

const legendSnapshot = async (page) => page.evaluate(() => {
  const items = [...document.querySelectorAll('[data-map-legend-state]')]
    .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none');
  return {
    states: items.map((node) => node.dataset.mapLegendState || ''),
    labels: items.map((node) => {
      const en = node.querySelector('.racecourse-map__legend-label--en');
      const ja = node.querySelector('.racecourse-map__legend-label--ja');
      const label = document.documentElement.lang === 'ja' ? ja : en;
      return label?.textContent?.replace(/\s+/g, ' ').trim() || '';
    }),
    pageText: document.body.innerText.replace(/\s+/g, ' '),
  };
});

const assertLegend = (snapshot, expectedStates, expectedLabels, context, failures) => {
  if (JSON.stringify(snapshot.states) !== JSON.stringify(expectedStates)) {
    failures.push(`${context} legend states mismatch: ${snapshot.states.join(', ')}`);
  }
  if (JSON.stringify(snapshot.labels) !== JSON.stringify(expectedLabels)) {
    failures.push(`${context} legend labels mismatch: ${snapshot.labels.join(' | ')}`);
  }
  if (snapshot.pageText.includes('Upcoming / racing today') || snapshot.pageText.includes('開催前・本日開催')) {
    failures.push(`${context} still exposes a combined Upcoming/Today label`);
  }
};

const todayUnmappedSnapshot = async (page) => page.evaluate(() => {
  const root = document.querySelector('[data-today-map-sync]');
  const dataNode = root?.querySelector('[data-today-map-meeting-map]');
  const meta = root?.querySelector('.racecourse-map__meta');
  let entries = [];
  try { entries = JSON.parse(dataNode?.textContent || '[]'); } catch { entries = []; }
  const byMeeting = new Map(Array.isArray(entries) ? entries.map((entry) => [entry.meetingId, entry]) : []);
  const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')]
    .filter((row) => row instanceof HTMLElement && !row.hidden && row.dataset.timezoneScopeHidden !== 'true' && getComputedStyle(row).display !== 'none');
  const expected = rows.filter((row) => {
    const entry = byMeeting.get(row.dataset.meetingId || '');
    return entry && !entry.hasReviewedLocation;
  }).length;
  return {
    expected,
    text: meta instanceof HTMLElement && !meta.hidden ? meta.textContent?.replace(/\s+/g, ' ').trim() || '' : '',
  };
});

const captureToday = async (page, viewport, lang) => {
  const failures = [];
  const checks = {};
  const prefix = `accept-${viewport.id}-today-${lang}`;
  const url = lang === 'ja' ? '/ja/?range=today' : '/?range=today';
  await page.goto(`${baseUrl}${url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForPresentation(page);

  checks.list_screenshot = await screenshot(page, `${prefix}-list`);
  if (viewport.mobile) {
    const first = await firstVisibleMeetingInViewport(page);
    checks.mobile_first_meeting = first;
    if (first.rowCount > 0 && !first.inViewport) failures.push(`Today mobile first viewport has ${first.rowCount} meetings but no actual meeting row; firstTop=${first.firstTop}, contentBottom=${first.contentBottom}`);
  }

  const invalid = await page.evaluate(() => ({
    summary: [...document.querySelectorAll('[data-today-summary-state]')]
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => node.dataset.todaySummaryState),
    dividers: [...document.querySelectorAll('[data-today-state-divider]')]
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => node.dataset.todayStateDivider),
  }));
  checks.visible_summary_states = invalid.summary;
  checks.visible_divider_states = invalid.dividers;
  const valid = new Set(['running', 'upcoming', 'today', 'ended']);
  if (invalid.summary.some((state) => !valid.has(state))) failures.push(`Today summary exposes invalid state: ${invalid.summary.join(', ')}`);
  if (invalid.dividers.some((state) => !valid.has(state))) failures.push(`Today List exposes invalid divider: ${invalid.dividers.join(', ')}`);

  const mapSection = page.locator('[data-today-map-sync]');
  if (await visible(mapSection)) {
    await mapSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const legend = await legendSnapshot(page);
    checks.map_legend_states = legend.states;
    checks.map_legend_labels = legend.labels;
    assertLegend(
      legend,
      ['running', 'upcoming', 'today', 'ended'],
      lang === 'ja' ? ['開催中', '開催前', '本日開催', '終了'] : ['Racing now', 'Upcoming', 'Today meeting', 'Finished'],
      'Today Map',
      failures,
    );
    const unmapped = await todayUnmappedSnapshot(page);
    checks.unmapped = unmapped;
    if (unmapped.expected > 0 && !unmapped.text.includes(String(unmapped.expected))) {
      failures.push(`Today Map unmapped count is stale: expected ${unmapped.expected}, text=${unmapped.text}`);
    }
    if (unmapped.expected === 0 && unmapped.text) failures.push(`Today Map shows an unmapped warning when expected count is 0: ${unmapped.text}`);
    checks.map_screenshot = await screenshot(page, `${prefix}-map`);
  } else {
    failures.push('Today Map section is not visible');
  }
  record(prefix, checks, failures);
};

const setFutureCalendarDate = async (page) => {
  await page.evaluate(() => {
    const select = document.querySelector('[data-filter-date]');
    if (!(select instanceof HTMLSelectElement) || select.options.length < 2) return;
    const next = Math.min(select.options.length - 1, select.selectedIndex + 1);
    select.selectedIndex = next;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(350);
};

const captureCalendar = async (page, viewport, lang) => {
  const failures = [];
  const checks = {};
  const prefix = `accept-${viewport.id}-calendar-${lang}`;
  const url = lang === 'ja' ? '/ja/calendar/?view=list' : '/calendar/?view=list';
  await page.goto(`${baseUrl}${url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForPresentation(page);

  checks.today_list_screenshot = await screenshot(page, `${prefix}-today-list`);
  if (viewport.mobile) {
    const first = await firstVisibleMeetingInViewport(page);
    checks.today_mobile_first_meeting = first;
    if (first.rowCount > 0 && !first.inViewport) failures.push(`Calendar today mobile List has no actual meeting row in first viewport; firstTop=${first.firstTop}, contentBottom=${first.contentBottom}`);
  }

  await page.click('[data-calendar-view-control="map"]');
  await page.waitForTimeout(650);
  const mapPanel = page.locator('[data-calendar-map-panel]');
  if (await visible(mapPanel)) {
    await mapPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    checks.today_map_screenshot = await screenshot(page, `${prefix}-today-map`);
  } else failures.push('Calendar selected-today Map panel is not visible');

  const todayLegend = await legendSnapshot(page);
  checks.today_map_legend = todayLegend.states;
  checks.today_map_legend_labels = todayLegend.labels;
  assertLegend(
    todayLegend,
    ['running', 'upcoming', 'today', 'ended'],
    lang === 'ja' ? ['開催中', '開催前', '本日開催', '終了'] : ['Racing now', 'Upcoming', 'Today meeting', 'Finished'],
    'Calendar selected-today Map',
    failures,
  );

  await page.click('[data-calendar-view-control="list"]');
  await setFutureCalendarDate(page);
  checks.future_list_screenshot = await screenshot(page, `${prefix}-future-list`);
  const futureStates = await page.evaluate(() => [...document.querySelectorAll('[data-calendar-meeting-row]')]
    .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
    .map((row) => row.dataset.meetingPresentationState || 'unknown'));
  checks.future_list_states = futureStates;
  if (futureStates.some((state) => state !== 'future')) failures.push(`Calendar future List exposes non-Scheduled state: ${futureStates.join(', ')}`);

  await page.click('[data-calendar-view-control="map"]');
  await page.waitForTimeout(650);
  if (await visible(mapPanel)) {
    await mapPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    checks.future_map_screenshot = await screenshot(page, `${prefix}-future-map`);
  } else failures.push('Calendar future Map panel is not visible');

  const futureLegend = await legendSnapshot(page);
  checks.future_map_legend = futureLegend.states;
  checks.future_map_legend_labels = futureLegend.labels;
  assertLegend(
    futureLegend,
    ['future'],
    [lang === 'ja' ? '開催予定' : 'Scheduled'],
    'Calendar future Map',
    failures,
  );

  record(prefix, checks, failures);
};

try {
  for (const viewport of [
    { id: 'desktop', width: 1440, height: 900, mobile: false },
    { id: 'mobile', width: 393, height: 852, mobile: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const lang of ['en', 'ja']) {
      await captureToday(page, viewport, lang);
      await captureCalendar(page, viewport, lang);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Calendar context acceptance evidence: ${reportPath}`);
if (report.failures.length) process.exitCode = 1;
