import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';
const evidencePath = path.join(outputDir, 'calendar-context-semantic.json');

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  scenarios: [],
  failures: [],
};

const record = (id, checks, failures) => {
  const entry = { id, checks, failures };
  evidence.scenarios.push(entry);
  if (failures.length) evidence.failures.push(entry);
  console.log(`${failures.length ? 'FAIL' : 'PASS'} ${id}`);
  failures.forEach((failure) => console.log(`  - ${failure}`));
};

const visible = async (locator) => locator.isVisible().catch(() => false);
const waitForState = async (page) => {
  await page.waitForFunction(() => {
    const row = document.querySelector('[data-calendar-meeting-row]');
    return !row || (row instanceof HTMLElement && row.dataset.meetingPresentationState !== 'unknown');
  }, null, { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(250);
};

const inspectToday = async (page, lang) => {
  const failures = [];
  const checks = {};
  const isJa = lang === 'ja';
  const pathName = isJa ? '/ja/?range=today' : '/?range=today';
  await page.goto(`${baseUrl}${pathName}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForState(page);

  const current = await page.evaluate(() => {
    const stateItems = [...document.querySelectorAll('[data-today-summary-state]')]
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => node.getAttribute('data-today-summary-state'));
    const dividerStates = [...document.querySelectorAll('[data-today-state-divider]')]
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => node.getAttribute('data-today-state-divider'));
    const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
      .map((row) => ({ date: row.dataset.date || '', state: row.dataset.meetingPresentationState || 'unknown' }));
    return { stateItems, dividerStates, rows };
  });

  const validToday = new Set(['running', 'upcoming', 'today', 'ended']);
  const invalidSummary = current.stateItems.filter((state) => !validToday.has(state));
  const invalidDividers = current.dividerStates.filter((state) => !validToday.has(state));
  checks.today_visible_summary_states = current.stateItems;
  checks.today_visible_divider_states = current.dividerStates;
  checks.today_visible_rows = current.rows.length;
  if (invalidSummary.length) failures.push(`Today summary exposes invalid state(s): ${invalidSummary.join(', ')}`);
  if (invalidDividers.length) failures.push(`Today List exposes invalid divider state(s): ${invalidDividers.join(', ')}`);

  const forbiddenCombined = isJa ? '開催前・本日開催' : 'Upcoming / racing today';
  const combinedVisible = await page.getByText(forbiddenCombined, { exact: false }).isVisible().catch(() => false);
  checks.forbidden_combined_heading_visible = combinedVisible;
  if (combinedVisible) failures.push(`combined Today heading is visible: ${forbiddenCombined}`);

  const todayMapTitle = await page.locator('#today-map-title').textContent().then((value) => value?.trim() || '');
  const todayMapAria = await page.locator('[data-today-map-sync] [data-map-canvas]').getAttribute('aria-label');
  checks.today_map_title = todayMapTitle;
  checks.today_map_aria = todayMapAria;
  if (!todayMapTitle.includes(isJa ? '今日' : 'Today')) failures.push(`Today map title is not current-range specific: ${todayMapTitle}`);
  if (!(todayMapAria || '').includes(isJa ? '今日' : 'today')) failures.push(`Today map aria-label is not current-range specific: ${todayMapAria}`);

  await page.click('[data-meeting-range="tomorrow"]');
  await page.waitForTimeout(300);
  const tomorrow = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
      .map((row) => row.dataset.meetingPresentationState || 'unknown'),
    summary: [...document.querySelectorAll('[data-today-summary-state]')]
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => node.getAttribute('data-today-summary-state')),
  }));
  const tomorrowTitle = await page.locator('#today-map-title').textContent().then((value) => value?.trim() || '');
  const tomorrowAria = await page.locator('[data-today-map-sync] [data-map-canvas]').getAttribute('aria-label');
  checks.tomorrow_visible_row_states = tomorrow.rows;
  checks.tomorrow_visible_summary_states = tomorrow.summary;
  checks.tomorrow_map_title = tomorrowTitle;
  checks.tomorrow_map_aria = tomorrowAria;
  if (tomorrow.rows.some((state) => state !== 'future')) failures.push(`Tomorrow contains non-Scheduled presentation state(s): ${tomorrow.rows.join(', ')}`);
  if (tomorrow.summary.some((state) => state !== 'future')) failures.push(`Tomorrow summary contains non-Scheduled state(s): ${tomorrow.summary.join(', ')}`);
  if (!tomorrowTitle.includes(isJa ? '明日' : 'Tomorrow')) failures.push(`Tomorrow map title did not update: ${tomorrowTitle}`);
  if (!(tomorrowAria || '').includes(isJa ? '明日' : 'tomorrow')) failures.push(`Tomorrow map aria-label did not update: ${tomorrowAria}`);

  await page.click('[data-meeting-range="next7"]');
  await page.waitForTimeout(300);
  const next7 = await page.evaluate(() => {
    const timeZoneSelect = document.querySelector('[data-today-timezone]');
    const timeZone = timeZoneSelect instanceof HTMLSelectElement ? timeZoneSelect.value : 'Asia/Tokyo';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
      .map((row) => ({ date: row.dataset.date || '', state: row.dataset.meetingPresentationState || 'unknown' }));
    return { today, rows };
  });
  const next7Title = await page.locator('#today-map-title').textContent().then((value) => value?.trim() || '');
  const next7Aria = await page.locator('[data-today-map-sync] [data-map-canvas]').getAttribute('aria-label');
  checks.next7_rows = next7.rows;
  checks.next7_map_title = next7Title;
  checks.next7_map_aria = next7Aria;
  const badFutureRows = next7.rows.filter((row) => row.date > next7.today && row.state !== 'future');
  if (badFutureRows.length) failures.push(`7-day future rows are not Scheduled: ${JSON.stringify(badFutureRows)}`);
  if (!next7Title.includes(isJa ? '7日間' : '7-day')) failures.push(`7-day map title did not update: ${next7Title}`);
  if (!(next7Aria || '').includes(isJa ? '7日間' : 'next 7 days')) failures.push(`7-day map aria-label did not update: ${next7Aria}`);

  record(`today-context-${lang}`, checks, failures);
};

const inspectCalendar = async (page, lang) => {
  const failures = [];
  const checks = {};
  const isJa = lang === 'ja';
  const pathName = isJa ? '/ja/calendar/?view=list' : '/calendar/?view=list';
  await page.goto(`${baseUrl}${pathName}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForState(page);

  const todayState = await page.evaluate(() => {
    const nav = document.querySelector('[data-calendar-date-nav]');
    const select = document.querySelector('[data-filter-date]');
    const selected = select instanceof HTMLSelectElement ? select.value : '';
    const today = nav instanceof HTMLElement ? nav.dataset.today || '' : '';
    const states = [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
      .map((row) => row.dataset.meetingPresentationState || 'unknown');
    return { selected, today, states };
  });
  checks.calendar_today_selected = todayState.selected;
  checks.calendar_today_reference = todayState.today;
  checks.calendar_today_row_states = todayState.states;
  if (todayState.selected !== todayState.today) failures.push(`Calendar did not initialize on today: ${todayState.selected} vs ${todayState.today}`);
  if (todayState.states.includes('future')) failures.push(`Calendar selected-today List exposes Scheduled/future: ${todayState.states.join(', ')}`);

  await page.click('[data-calendar-view-control="map"]');
  await page.waitForTimeout(900);
  const todayLegend = await page.evaluate(() => [...document.querySelectorAll('[data-map-legend-state]')]
    .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
    .map((node) => node.getAttribute('data-map-legend-state')));
  checks.calendar_today_map_legend = todayLegend;
  if (todayLegend.includes('future')) failures.push(`Calendar selected-today Map legend exposes Scheduled/future: ${todayLegend.join(', ')}`);

  await page.click('[data-calendar-view-control="list"]');
  await page.evaluate(() => {
    const select = document.querySelector('[data-filter-date]');
    if (!(select instanceof HTMLSelectElement) || select.selectedIndex >= select.options.length - 1) return;
    select.selectedIndex += 1;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(350);
  const futureState = await page.evaluate(() => ({
    selected: document.querySelector('[data-filter-date]') instanceof HTMLSelectElement
      ? document.querySelector('[data-filter-date]').value
      : '',
    states: [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none')
      .map((row) => row.dataset.meetingPresentationState || 'unknown'),
  }));
  checks.calendar_future_selected = futureState.selected;
  checks.calendar_future_row_states = futureState.states;
  if (futureState.states.some((state) => state !== 'future')) failures.push(`Calendar future List exposes non-Scheduled state(s): ${futureState.states.join(', ')}`);

  await page.click('[data-calendar-view-control="map"]');
  await page.waitForTimeout(900);
  const futureLegend = await page.evaluate(() => [...document.querySelectorAll('[data-map-legend-state]')]
    .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
    .map((node) => node.getAttribute('data-map-legend-state')));
  checks.calendar_future_map_legend = futureLegend;
  const invalidFutureLegend = futureLegend.filter((state) => state !== 'future');
  if (invalidFutureLegend.length) failures.push(`Calendar future Map legend exposes current-day state(s): ${invalidFutureLegend.join(', ')}`);

  record(`calendar-context-${lang}`, checks, failures);
};

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await inspectToday(page, 'en');
  await inspectToday(page, 'ja');
  await inspectCalendar(page, 'en');
  await inspectCalendar(page, 'ja');
  await context.close();
} finally {
  await browser.close();
}

await fs.writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`Calendar context semantic evidence: ${evidencePath}`);
if (evidence.failures.length) process.exitCode = 1;
