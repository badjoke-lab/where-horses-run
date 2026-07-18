import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const publicUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const localPort = 4174;
const viewport = { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false };

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'], ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'], ['.txt', 'text/plain; charset=utf-8'],
]);

function fileForRequest(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = clean === '' ? path.join(dist, 'index.html')
    : clean.endsWith('/') ? path.join(dist, clean, 'index.html') : path.join(dist, clean);
  const normalized = path.normalize(candidate);
  if (!normalized.startsWith(dist)) return null;
  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) return normalized;
  const withIndex = path.join(normalized, 'index.html');
  return fs.existsSync(withIndex) ? withIndex : null;
}

const server = http.createServer((request, response) => {
  const file = fileForRequest(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypes.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(localPort, '127.0.0.1', resolve));

function chromeExecutable() {
  for (const name of ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']) {
    const found = spawnSync('bash', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  throw new Error('No Chrome or Chromium executable found');
}

async function waitForFile(file, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (fs.existsSync(file)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${file}`);
}

class CdpSocket {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = [];
  }
  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), 10000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', (event) => { clearTimeout(timer); reject(new Error(`CDP websocket error: ${event.message ?? 'unknown'}`)); }, { once: true });
    });
    this.ws.addEventListener('message', (event) => this.consume(JSON.parse(String(event.data))));
  }
  consume(message) {
    if (message.id) {
      const item = this.pending.get(message.id);
      if (!item) return;
      this.pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`));
      else item.resolve(message.result ?? {});
      return;
    }
    this.waiters = this.waiters.filter((waiter) => {
      if (waiter.method !== message.method) return true;
      clearTimeout(waiter.timer);
      waiter.resolve(message.params ?? {});
      return false;
    });
  }
  send(method, params = {}, timeoutMs = 20000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method}: timeout`)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  waitEvent(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const waiter = { method, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter((item) => item !== waiter);
        reject(new Error(`${method}: event timeout`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-a11y-chrome-'));
const chrome = spawn(chromeExecutable(), [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'inherit'] });

const devtoolsFile = path.join(profileDir, 'DevToolsActivePort');
await waitForFile(devtoolsFile);
const [debugPort] = fs.readFileSync(devtoolsFile, 'utf8').trim().split(/\r?\n/);
const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
if (!targetResponse.ok) throw new Error(`Cannot create Chrome target: ${targetResponse.status}`);
const target = await targetResponse.json();
const cdp = new CdpSocket(target.webSocketDebuggerUrl);
await cdp.open();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Emulation.setDeviceMetricsOverride', viewport);

const evaluation = String.raw`(() => {
  const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const refsText = (value) => (value || '').split(/\s+/).filter(Boolean).map((id) => text(document.getElementById(id))).join(' ').trim();
  const nameOf = (el) => (
    (el.getAttribute('aria-label') || '').trim() ||
    refsText(el.getAttribute('aria-labelledby')) ||
    text(el) ||
    [...el.querySelectorAll('img[alt]')].map((img) => img.getAttribute('alt') || '').join(' ').trim() ||
    (el.getAttribute('title') || '').trim()
  );
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    className: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
    text: text(el).slice(0, 160),
  });
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  const seen = new Set();
  const duplicateIds = [...new Set(ids.filter((id) => { if (seen.has(id)) return true; seen.add(id); return false; }))];
  const missingAriaRefs = [];
  for (const el of document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls]')) {
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      for (const id of value.split(/\s+/).filter(Boolean)) if (!document.getElementById(id)) missingAriaRefs.push({ ...describe(el), attr, ref: id });
    }
  }
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({ ...describe(el), level: Number(el.tagName.slice(1)) }));
  const headingJumps = [];
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) headingJumps.push({ previous: headings[index - 1], current: headings[index] });
  }
  const linksWithoutName = [...document.querySelectorAll('a[href]')].filter((el) => !nameOf(el)).map(describe);
  const controlsWithoutName = [...document.querySelectorAll('button, summary, [role="button"]')].filter((el) => !nameOf(el)).map(describe);
  const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')].map(describe);
  const formControlsWithoutLabel = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((el) => {
    if ((el.getAttribute('aria-label') || '').trim()) return false;
    if (refsText(el.getAttribute('aria-labelledby'))) return false;
    if (el.closest('label')) return false;
    if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
    return true;
  }).map(describe);
  const detailsWithoutSummary = [...document.querySelectorAll('details')].filter((el) => !el.querySelector(':scope > summary')).map(describe);
  const tablesWithoutHeaders = [...document.querySelectorAll('table')].filter((el) => !el.querySelector('th')).map(describe);
  const navsWithoutName = [...document.querySelectorAll('nav')].filter((el) => !nameOf(el) && !(el.getAttribute('aria-label') || '').trim()).map(describe);
  const nestedInteractive = [...document.querySelectorAll('a button, button a, a summary, summary a, button button, a a')].map(describe);
  const focusableSelector = 'a[href], button:not([disabled]), summary, input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const firstFocusable = document.querySelector(focusableSelector);
  return {
    titleEmpty: !document.title.trim(),
    lang: document.documentElement.lang,
    mainCount: document.querySelectorAll('main').length,
    mainContentCount: document.querySelectorAll('main#main-content').length,
    skipLinkCount: document.querySelectorAll('a.skip-link[href="#main-content"]').length,
    firstFocusableIsSkipLink: Boolean(firstFocusable?.matches('a.skip-link[href="#main-content"]')),
    h1Count: document.querySelectorAll('h1').length,
    headings: headings.length,
    headingJumps,
    duplicateIds,
    missingAriaRefs,
    linksWithoutName,
    controlsWithoutName,
    images: document.images.length,
    imagesWithoutAlt,
    formControls: document.querySelectorAll('input:not([type="hidden"]), select, textarea').length,
    formControlsWithoutLabel,
    details: document.querySelectorAll('details').length,
    detailsWithoutSummary,
    tables: document.querySelectorAll('table').length,
    tablesWithoutHeaders,
    navs: document.querySelectorAll('nav').length,
    navsWithoutName,
    nestedInteractive,
  };
})()`;

const results = [];
const failures = [];
try {
  for (const [index, publicUrl] of publicUrls.entries()) {
    const pathname = new URL(publicUrl).pathname;
    const localUrl = `http://127.0.0.1:${localPort}${pathname}`;
    try {
      const loaded = cdp.waitEvent('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: localUrl });
      await loaded;
      const evaluated = await cdp.send('Runtime.evaluate', { expression: evaluation, returnByValue: true, awaitPromise: true });
      results.push({ publicUrl, pathname, ...evaluated.result.value });
    } catch (error) {
      failures.push({ publicUrl, pathname, error: error.message });
    }
    if ((index + 1) % 100 === 0) console.error(`${index + 1}/${publicUrls.length}`);
  }
} finally {
  cdp.close();
  chrome.kill('SIGKILL');
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(profileDir, { recursive: true, force: true });
}

const pageErrors = [];
for (const item of results) {
  const expectedLang = item.pathname.startsWith('/ja/') ? 'ja' : 'en';
  const errors = [];
  if (item.titleEmpty) errors.push('empty_title');
  if (item.lang !== expectedLang) errors.push('lang');
  if (item.mainCount !== 1 || item.mainContentCount !== 1) errors.push('main');
  if (item.skipLinkCount !== 1 || !item.firstFocusableIsSkipLink) errors.push('skip_link');
  if (item.h1Count !== 1) errors.push('h1');
  if (item.headingJumps.length) errors.push('heading_jump');
  if (item.duplicateIds.length) errors.push('duplicate_id');
  if (item.missingAriaRefs.length) errors.push('aria_reference');
  if (item.linksWithoutName.length) errors.push('link_name');
  if (item.controlsWithoutName.length) errors.push('control_name');
  if (item.imagesWithoutAlt.length) errors.push('image_alt');
  if (item.formControlsWithoutLabel.length) errors.push('form_label');
  if (item.detailsWithoutSummary.length) errors.push('details_summary');
  if (item.tablesWithoutHeaders.length) errors.push('table_headers');
  if (item.navsWithoutName.length) errors.push('nav_name');
  if (item.nestedInteractive.length) errors.push('nested_interactive');
  if (errors.length) pageErrors.push({ ...item, errors });
}

const sum = (key) => results.reduce((total, item) => total + (Array.isArray(item[key]) ? item[key].length : Number(item[key] ?? 0)), 0);
const report = {
  schemaVersion: 'v1-accessibility-qa-discovery-v1',
  generatedAt: new Date().toISOString(),
  browserExecutable: chromeExecutable(),
  publicPages: publicUrls.length,
  pageChecks: results.length,
  failedPageLoads: failures.length,
  pagesWithErrors: pageErrors.length,
  titleErrors: results.filter((item) => item.titleEmpty).length,
  languageErrors: results.filter((item) => item.lang !== (item.pathname.startsWith('/ja/') ? 'ja' : 'en')).length,
  mainErrors: results.filter((item) => item.mainCount !== 1 || item.mainContentCount !== 1).length,
  skipLinkErrors: results.filter((item) => item.skipLinkCount !== 1 || !item.firstFocusableIsSkipLink).length,
  h1Errors: results.filter((item) => item.h1Count !== 1).length,
  headingJumpInstances: sum('headingJumps'),
  duplicateIdInstances: sum('duplicateIds'),
  missingAriaReferenceInstances: sum('missingAriaRefs'),
  unnamedLinkInstances: sum('linksWithoutName'),
  unnamedControlInstances: sum('controlsWithoutName'),
  images: results.reduce((total, item) => total + item.images, 0),
  imageAltErrors: sum('imagesWithoutAlt'),
  formControls: results.reduce((total, item) => total + item.formControls, 0),
  formLabelErrors: sum('formControlsWithoutLabel'),
  details: results.reduce((total, item) => total + item.details, 0),
  detailsSummaryErrors: sum('detailsWithoutSummary'),
  tables: results.reduce((total, item) => total + item.tables, 0),
  tableHeaderErrors: sum('tablesWithoutHeaders'),
  navs: results.reduce((total, item) => total + item.navs, 0),
  navNameErrors: sum('navsWithoutName'),
  nestedInteractiveInstances: sum('nestedInteractive'),
  failures,
  pageErrors: pageErrors.slice(0, 200),
};
fs.writeFileSync('v1-accessibility-qa-discovery.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([key]) => !['failures', 'pageErrors'].includes(key))), null, 2));
