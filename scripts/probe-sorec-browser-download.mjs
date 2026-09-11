import fs from 'node:fs';
import { chromium } from 'playwright';

const PAGE = 'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';
const out = process.env.SOREC_DOWNLOAD_PATH || '/tmp/sorec-meknes-programme';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

page.on('request', (request) => {
  if (request.method() !== 'POST') return;
  const body = request.postData() ?? '';
  const keys = [...new URLSearchParams(body).keys()];
  console.log(JSON.stringify({
    type: 'browser_post',
    url: request.url(),
    resource_type: request.resourceType(),
    post_keys: [...new Set(keys)],
  }));
});
page.on('response', async (response) => {
  const headers = response.headers();
  const contentType = headers['content-type'] ?? '';
  const disposition = headers['content-disposition'] ?? '';
  if (response.request().method() === 'POST' || /pdf|octet-stream/i.test(contentType) || disposition) {
    console.log(JSON.stringify({
      type: 'browser_response',
      status: response.status(),
      url: response.url(),
      method: response.request().method(),
      content_type: contentType,
      content_disposition: disposition,
    }));
  }
});

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForSelector('table tbody tr', { timeout: 30_000 });
const rows = page.locator('table tbody tr');
let target = null;
for (let i = 0; i < await rows.count(); i += 1) {
  const row = rows.nth(i);
  const text = (await row.innerText()).replace(/\s+/g, ' ').trim();
  if (text.includes('10/09/2026') && /Meknes/i.test(text)) {
    target = row;
    console.log(JSON.stringify({ type: 'target_row', index: i, text }));
    break;
  }
}
if (!target) throw new Error('Meknes 10/09/2026 row not found');
const button = target.locator('button.btnDownload');
if (await button.count() !== 1) throw new Error(`Expected one Meknes download button, found ${await button.count()}`);

const downloadPromise = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
const responsePromise = page.waitForResponse(
  (response) => response.request().method() === 'POST' && /programmeReunion\.jsf/i.test(response.url()),
  { timeout: 30_000 },
).catch(() => null);
await button.click({ timeout: 30_000 });
const [download, postResponse] = await Promise.all([downloadPromise, responsePromise]);

if (postResponse) {
  console.log(JSON.stringify({
    type: 'clicked_post_response',
    status: postResponse.status(),
    url: postResponse.url(),
    content_type: postResponse.headers()['content-type'] ?? '',
    content_disposition: postResponse.headers()['content-disposition'] ?? '',
  }));
}

if (!download) {
  console.log(JSON.stringify({ type: 'download_result', downloaded: false, current_url: page.url() }));
  const body = await page.locator('body').innerText().catch(() => '');
  console.log(JSON.stringify({ type: 'page_after_click', text: body.replace(/\s+/g, ' ').slice(0, 3000) }));
  await browser.close();
  process.exitCode = 2;
} else {
  const suggested = download.suggestedFilename();
  const failure = await download.failure();
  if (failure) throw new Error(`Download failed: ${failure}`);
  const savePath = `${out}-${suggested || 'download'}`;
  await download.saveAs(savePath);
  const stat = fs.statSync(savePath);
  const prefix = fs.readFileSync(savePath).subarray(0, 32).toString('latin1');
  console.log(JSON.stringify({ type: 'download_result', downloaded: true, suggested_filename: suggested, save_path: savePath, bytes: stat.size, prefix }));
  console.log(`SOREC_BROWSER_DOWNLOAD_PATH=${savePath}`);
  await browser.close();
}
