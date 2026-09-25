import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/calendar-row-layout-visual';

const pages = [
  { id: 'home-en', path: '/?range=today' },
  { id: 'calendar-en', path: '/calendar/?view=list' },
  { id: 'home-ja', path: '/ja/?range=today' },
  { id: 'calendar-ja', path: '/ja/calendar/?view=list' },
];

const viewports = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 393, height: 852 },
];

const tolerance = 2;
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  schema_version: 'calendar-row-layout-visual-v1',
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  results: [],
  failures: [],
};

const spread = (values) => values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    for (const spec of pages) {
      const entry = {
        id: spec.id,
        viewport: viewport.id,
        url: `${baseUrl}${spec.path}`,
        screenshot: `${viewport.id}-${spec.id}.png`,
        checks: {},
        failures: [],
      };

      try {
        const response = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response?.ok()) entry.failures.push(`navigation failed: ${response?.status() ?? 'no response'}`);

        await page.waitForFunction(() => {
          const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')];
          return rows.some((row) => row instanceof HTMLElement && !row.hidden && getComputedStyle(row).display !== 'none');
        }, null, { timeout: 10000 });
        await page.waitForTimeout(900);

        const inspected = await page.evaluate(({ desktop, tolerance }) => {
          const visible = (node) => {
            if (!(node instanceof HTMLElement)) return false;
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const spread = (values) => values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
          const rows = [...document.querySelectorAll('[data-calendar-meeting-row]')].filter(visible).slice(0, 12);
          const failures = [];
          const checks = {
            visible_rows: rows.length,
            horizontal_overflow_px: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - innerWidth,
          };
          if (!rows.length) failures.push('no visible meeting rows');
          if (checks.horizontal_overflow_px > tolerance) failures.push(`horizontal overflow ${checks.horizontal_overflow_px}px`);

          const rectLeft = (row, selector) => {
            const node = row.querySelector(selector);
            return node instanceof HTMLElement && visible(node) ? node.getBoundingClientRect().left : null;
          };
          const positions = (selector) => rows.map((row) => rectLeft(row, selector)).filter((value) => typeof value === 'number');

          if (desktop) {
            const headers = [...document.querySelectorAll('.meeting-list__columns')].filter(visible);
            checks.visible_column_headers = headers.length;
            if (!headers.length) failures.push('desktop column header is not visible');

            const columnSelectors = {
              racecourse: '.meeting-row__identity',
              system: '.meeting-row__system',
              time: '.meeting-row__time',
              rank: '.meeting-row__rank',
              status: '.meeting-row__status',
              actions: '.meeting-row__links',
            };
            checks.column_spread_px = {};
            for (const [name, selector] of Object.entries(columnSelectors)) {
              const value = spread(positions(selector));
              checks.column_spread_px[name] = value;
              if (value > tolerance) failures.push(`${name} column varies by ${value.toFixed(2)}px`);
            }

            const actionSelectors = {
              stream: '.meeting-row__links > .meeting-row__stream--single, .meeting-row__links > .meeting-row__watch-menu',
              details: '.meeting-row__links > .meeting-row__detail-link',
              map: '.meeting-row__links > .meeting-row__map-focus',
              source: '.meeting-row__links > .meeting-row__official-link',
            };
            checks.action_spread_px = {};
            for (const [name, selector] of Object.entries(actionSelectors)) {
              const value = spread(positions(selector));
              checks.action_spread_px[name] = value;
              if (value > tolerance) failures.push(`${name} action varies by ${value.toFixed(2)}px`);
            }

            const firstHeader = headers[0];
            const firstRow = rows[0];
            if (firstHeader instanceof HTMLElement && firstRow instanceof HTMLElement) {
              const headerChildren = [...firstHeader.children];
              const rowSelectors = ['.meeting-row__identity', '.meeting-row__system', '.meeting-row__time', '.meeting-row__rank', '.meeting-row__status', '.meeting-row__links'];
              const offsets = rowSelectors.map((selector, index) => {
                const rowNode = firstRow.querySelector(selector);
                const headerNode = headerChildren[index];
                if (!(rowNode instanceof HTMLElement) || !(headerNode instanceof HTMLElement)) return null;
                return Math.abs(rowNode.getBoundingClientRect().left - headerNode.getBoundingClientRect().left);
              }).filter((value) => typeof value === 'number');
              checks.header_alignment_max_px = offsets.length ? Math.max(...offsets) : null;
              if (offsets.some((value) => value > tolerance)) failures.push(`header/row alignment exceeds ${tolerance}px`);
            }
          } else {
            const headers = [...document.querySelectorAll('.meeting-list__columns')].filter(visible);
            checks.visible_column_headers = headers.length;
            if (headers.length) failures.push('mobile column header should be hidden');

            const first = rows[0];
            if (first instanceof HTMLElement) {
              const identity = first.querySelector('.meeting-row__identity');
              const system = first.querySelector('.meeting-row__system');
              const time = first.querySelector('.meeting-row__time');
              const status = first.querySelector('.meeting-row__status');
              const actions = first.querySelector('.meeting-row__links');
              if ([identity, system, time, status, actions].every((node) => node instanceof HTMLElement)) {
                const identityRect = identity.getBoundingClientRect();
                const systemRect = system.getBoundingClientRect();
                const timeRect = time.getBoundingClientRect();
                const statusRect = status.getBoundingClientRect();
                const actionsRect = actions.getBoundingClientRect();
                checks.mobile_card_order = {
                  identity_top: identityRect.top,
                  system_top: systemRect.top,
                  time_top: timeRect.top,
                  status_top: statusRect.top,
                  actions_top: actionsRect.top,
                };
                if (systemRect.top + tolerance < identityRect.bottom) failures.push('mobile system row overlaps identity row');
                if (Math.abs(timeRect.top - statusRect.top) > 8) failures.push('mobile time and status are not on the same row');
                if (actionsRect.top + tolerance < Math.max(timeRect.bottom, statusRect.bottom)) failures.push('mobile actions overlap time/status row');
                const mapAction = first.querySelector('.meeting-row__links > .meeting-row__map-focus');
                if (!(mapAction instanceof HTMLElement)) failures.push('mobile Map action is not in the action row');
                const timeEmptyRows = rows.filter((row) => row instanceof HTMLElement && row.querySelector('.meeting-row__time[data-time-empty="true"]'));
                if (timeEmptyRows.some((row) => (row.querySelector('.meeting-row__time')?.textContent || '').trim() === '—')) {
                  failures.push('time-empty rows must not render a dash placeholder');
                }
              }
            }
          }

          const first = rows[0];
          if (first instanceof HTMLElement) {
            const identity = first.querySelector('.meeting-row__identity');
            const strong = identity?.querySelector('strong');
            if (identity instanceof HTMLElement && strong instanceof HTMLElement) {
              const original = strong.innerHTML;
              const before = {
                system: rectLeft(first, '.meeting-row__system'),
                time: rectLeft(first, '.meeting-row__time'),
                rank: rectLeft(first, '.meeting-row__rank'),
                status: rectLeft(first, '.meeting-row__status'),
                actions: rectLeft(first, '.meeting-row__links'),
              };
              strong.textContent = 'International Championship and Regional Heritage Racecourse of an Extremely Long Official Name';
              const after = {
                system: rectLeft(first, '.meeting-row__system'),
                time: rectLeft(first, '.meeting-row__time'),
                rank: rectLeft(first, '.meeting-row__rank'),
                status: rectLeft(first, '.meeting-row__status'),
                actions: rectLeft(first, '.meeting-row__links'),
              };
              const longNameOverflow = identity.scrollWidth - identity.clientWidth;
              checks.long_name_overflow_px = longNameOverflow;
              checks.long_name_column_shift_px = Object.fromEntries(Object.keys(before).map((key) => [
                key,
                before[key] === null || after[key] === null ? null : Math.abs(after[key] - before[key]),
              ]));
              if (longNameOverflow > tolerance) failures.push(`long racecourse name overflows identity cell by ${longNameOverflow}px`);
              if (desktop && Object.values(checks.long_name_column_shift_px).some((value) => typeof value === 'number' && value > tolerance)) {
                failures.push('long racecourse name shifts desktop columns');
              }
              strong.innerHTML = original;
            }
          }

          return { checks, failures };
        }, { desktop: viewport.id === 'desktop', tolerance });

        entry.checks = inspected.checks;
        entry.failures.push(...inspected.failures);

        await page.screenshot({
          path: path.join(outputDir, entry.screenshot),
          fullPage: true,
          animations: 'disabled',
        });
      } catch (error) {
        entry.failures.push(error instanceof Error ? error.message : String(error));
      }

      report.results.push(entry);
      if (entry.failures.length) report.failures.push({ id: entry.id, viewport: entry.viewport, failures: entry.failures });
      console.log(`${entry.failures.length ? 'FAIL' : 'PASS'} ${viewport.id} ${spec.id}`);
      entry.failures.forEach((failure) => console.log(`  - ${failure}`));
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Calendar row layout visual evidence: ${outputDir}`);
if (report.failures.length) process.exitCode = 1;
