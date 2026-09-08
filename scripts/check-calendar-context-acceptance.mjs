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
    await page.waitForTimeout(450);
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
  await page.waitForTimeout(500);
  const mapPanel = page.locator('[data-calendar-map-panel]');
  if (await visible(mapPanel)) {
    await mapPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    checks.today_map_screenshot = await screenshot(page, `${prefix}-today-map`);
  } else failures.push('Calendar selected-today Map panel is not visible');

  const todayLegend = await page.evaluate(() => [...document.querySelectorAll('[data-map-legend-state]')]
    .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
    .map((node) => node.dataset.mapLegendState));
  checks.today_map_legend = todayLegend;
  if (todayLegend.includes('future')) failures.push(`Calendar selected-today Map legend exposes Scheduled: ${todayLegend.join(', ')}`);

  await page.click('[data-calendar-view-control="list"]');
  await setFutureCalendarDate(page);
  checks.future_list_screenshot = await screenshot(page, `${prefix}-future-list`);
  const futureStates = await page.evaluate(() => [...document.querySelectorAll('[data-calendar-meeting-row]')]
    .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
    .map((row) => row.dataset.meetingPresentationState || 'unknown'));
  checks.future_list_states = futureStates;
  if (futureStates.some((state) => state !== 'future')) failures.push(`Calendar future List exposes non-Scheduled state: ${futureStates.join(', ')}`);

  await page.click('[data-calendar-view-control="map"]');
  await page.waitForTimeout(500);
  if (await visible(mapPanel)) {
    await mapPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    checks.future_map_screenshot = await screenshot(page, `${prefix}-future-map`);
  } else failures.push('Calendar future Map panel is not visible');

  const futureLegend = await page.evaluate(() => [...document.querySelectorAll('[data-map-legend-state]')]
    .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
    .map((node) => node.dataset.mapLegendState));
  checks.future_map_legend = futureLegend;
  if (futureLegend.some((state) => state !== 'future')) failures.push(`Calendar future Map legend exposes current-day state: ${futureLegend.join(', ')}`);

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
