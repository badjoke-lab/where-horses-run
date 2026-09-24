import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.MEETING_DETAIL_VISUAL_OUTPUT || 'artifacts/meeting-detail-layout-visual';
const publicDetails = JSON.parse(await fs.readFile('data/generated/timetable/public/meeting-details.json', 'utf8'));
const details = Array.isArray(publicDetails.details) ? publicDetails.details : [];
const preferredMeetingId = 'nar-sonoda-racecourse-2026-09-25';
const detail = details.find((item) => item.meeting_id === preferredMeetingId)
  ?? details.find((item) => Array.isArray(item.timetable_rows) && item.timetable_rows.length >= 5);

if (!detail) throw new Error('No public meeting detail with race rows is available for visual validation.');

const expectedRows = detail.timetable_rows.length;
const pages = [
  { id: 'meeting-en', path: `/timetable/meetings/${detail.meeting_id}/`, trackPrefix: '/tracks/' },
  { id: 'meeting-ja', path: `/ja/timetable/meetings/${detail.meeting_id}/`, trackPrefix: '/ja/tracks/' },
];
const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'mobile', width: 393, height: 852 },
];
const forbidden = [
  'Capability rank',
  'Public rank',
  'Publication policy',
  'Source status',
  '取得ランク',
  '公開ランク',
  '公開ポリシー',
  'ソース状態',
  'nar-reviewed-a-plus',
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  schema_version: 'meeting-detail-layout-visual-v1',
  generated_at: new Date().toISOString(),
  meeting_id: detail.meeting_id,
  expected_rows: expectedRows,
  results: [],
  failures: [],
};

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
        await page.waitForTimeout(500);

        const inspected = await page.evaluate(({ expectedRows, mobile, forbidden, trackPrefix }) => {
          const visible = (node) => {
            if (!(node instanceof HTMLElement)) return false;
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const failures = [];
          const bodyText = document.body.innerText;
          const pageTitle = document.title;
          const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
          const headingText = document.querySelector('#page-title')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          const meetingDate = document.querySelector('[data-meeting-projected-date]')?.textContent?.trim() ?? '';
          const raceRows = [...document.querySelectorAll('tbody tr')];
          const h1Link = document.querySelector('#page-title a');
          const timezone = document.querySelector('[data-meeting-timezone-select]');
          const details = document.querySelector('.data-notes');
          const tableHeader = document.querySelector('thead');
          const overflowPx = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;

          const checks = {
            race_rows: raceRows.length,
            expected_rows: expectedRows,
            horizontal_overflow_px: overflowPx,
            racecourse_link: h1Link?.getAttribute('href') ?? null,
            timezone_visible: visible(timezone),
            data_notes_collapsed: details instanceof HTMLDetailsElement ? !details.open : null,
            table_header_visible: visible(tableHeader),
            forbidden_visible_text: forbidden.filter((token) => bodyText.includes(token)),
            title: pageTitle,
            meta_description: metaDescription,
          };

          if (raceRows.length !== expectedRows) failures.push(`race row count ${raceRows.length} != ${expectedRows}`);
          if (overflowPx > 2) failures.push(`horizontal overflow ${overflowPx}px`);
          if (!(h1Link instanceof HTMLAnchorElement) || !h1Link.getAttribute('href')?.startsWith(trackPrefix)) {
            failures.push('racecourse heading does not link to the racecourse page');
          }
          if (!visible(timezone)) failures.push('timezone selector is not visible');
          if (!(details instanceof HTMLDetailsElement) || details.open) failures.push('data notes are not collapsed by default');
          if (checks.forbidden_visible_text.length) failures.push(`internal metadata is visible: ${checks.forbidden_visible_text.join(', ')}`);
          if (!headingText || !meetingDate || !pageTitle.includes(headingText) || !pageTitle.includes(meetingDate)) failures.push('meeting title metadata is missing racecourse/date identity');
          if (!metaDescription.includes(headingText) || !metaDescription.includes(meetingDate)) failures.push('meeting description metadata is missing racecourse/date identity');
          if (mobile && visible(tableHeader)) failures.push('mobile table header should be hidden');
          if (!mobile && !visible(tableHeader)) failures.push('desktop table header should be visible');

          if (mobile && raceRows.length) {
            const first = raceRows[0];
            const style = getComputedStyle(first);
            checks.mobile_first_row_display = style.display;
            checks.mobile_first_row_columns = style.gridTemplateColumns;
            if (style.display !== 'grid') failures.push('mobile race row is not a stacked grid');
            for (const row of raceRows) {
              const rect = row.getBoundingClientRect();
              if (rect.left < -2 || rect.right > innerWidth + 2) {
                failures.push('mobile race row extends outside viewport');
                break;
              }
            }
          }

          return { checks, failures };
        }, { expectedRows, mobile: viewport.id === 'mobile', forbidden, trackPrefix: spec.trackPrefix });

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
      for (const failure of entry.failures) console.log(`  - ${failure}`);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Meeting detail visual evidence: ${outputDir}`);
if (report.failures.length) process.exitCode = 1;
