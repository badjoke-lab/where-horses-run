import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const siteOrigin = 'https://whr.badjoke-lab.com';

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function relative(file) {
  return path.relative(dist, file).split(path.sep).join('/');
}

function routeFromHtml(file) {
  const rel = relative(file);
  if (rel === 'index.html') return '/';
  return `/${rel.slice(0, -'index.html'.length)}`;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function summary(values) {
  if (!values.length) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, total: 0, mean: 0 };
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    min: Math.min(...values),
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    max: Math.max(...values),
    total,
    mean: Math.round(total / values.length),
  };
}

function gzipBytes(buffer) {
  return zlib.gzipSync(buffer, { level: 9 }).length;
}

function fileType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.html') return 'html';
  if (ext === '.css') return 'css';
  if (['.js', '.mjs', '.cjs'].includes(ext)) return 'javascript';
  if (['.json', '.xml', '.txt'].includes(ext)) return 'data';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.avif'].includes(ext)) return 'image';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) return 'font';
  return 'other';
}

function routeFamily(route) {
  const normalized = route.replace(/^\/ja(?=\/)/, '') || '/';
  if (/^\/countries\/[^/]+\/$/.test(normalized)) return 'country-detail';
  if (/^\/sources\/[^/]+\/$/.test(normalized)) return 'source-country';
  if (/^\/tracks\/[^/]+\/$/.test(normalized)) return 'racecourse-detail';
  if (/^\/glossary\/[^/]+\/$/.test(normalized)) return 'glossary-term';
  if (/^\/timetable\/meetings\/[^/]+\/$/.test(normalized)) return 'meeting-detail';
  if (/^\/types\/[^/]+\/$/.test(normalized)) return 'racing-type-detail';
  if (/^\/glossary\/relationships\/$/.test(normalized)) return 'glossary-relationships';
  if (normalized === '/') return 'home';
  return 'static-or-index';
}

const files = walk(dist).sort();
const inventory = files.map((file) => {
  const buffer = fs.readFileSync(file);
  return {
    file: relative(file),
    type: fileType(file),
    bytes: buffer.length,
    gzipBytes: gzipBytes(buffer),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
});
const inventoryByPath = new Map(inventory.map((item) => [item.file, item]));

const sitemapText = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const htmlFiles = files.filter((file) => path.basename(file) === 'index.html');
const htmlByRoute = new Map(htmlFiles.map((file) => [routeFromHtml(file), file]));

const externalRuntimeReferences = [];
const missingLocalReferences = [];
const pageMetrics = [];

function localPathFromUrl(url) {
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!pathname) return 'index.html';
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return pathname;
}

function collectAttr(html, tagPattern, attr) {
  const values = [];
  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const attrMatch = tag.match(new RegExp(`\\b${attr}=["']([^"']+)["']`, 'i'));
    if (attrMatch) values.push(attrMatch[1]);
  }
  return values;
}

for (const publicUrl of sitemapUrls) {
  const route = new URL(publicUrl).pathname;
  const file = htmlByRoute.get(route);
  if (!file) {
    missingLocalReferences.push({ route, ref: route, reason: 'sitemap_html_missing' });
    continue;
  }
  const buffer = fs.readFileSync(file);
  const html = buffer.toString('utf8');
  const stylesheetRefs = collectAttr(html, /<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi, 'href');
  const scriptRefs = collectAttr(html, /<script\b[^>]*src=["'][^"']+["'][^>]*>/gi, 'src');
  const imageRefs = collectAttr(html, /<img\b[^>]*src=["'][^"']+["'][^>]*>/gi, 'src');
  const preloadRefs = collectAttr(html, /<link\b[^>]*rel=["'][^"']*(?:preload|modulepreload)[^"']*["'][^>]*>/gi, 'href');
  const resourceRefs = [...stylesheetRefs, ...scriptRefs, ...imageRefs, ...preloadRefs];
  const localAssets = new Set();
  const pageExternal = [];

  for (const ref of resourceRefs) {
    if (/^(?:data:|blob:|#)/i.test(ref)) continue;
    let resolved;
    try { resolved = new URL(ref, publicUrl); }
    catch {
      missingLocalReferences.push({ route, ref, reason: 'invalid_url' });
      continue;
    }
    if (resolved.origin !== siteOrigin) {
      pageExternal.push(ref);
      externalRuntimeReferences.push({ route, ref, origin: resolved.origin });
      continue;
    }
    const localPath = localPathFromUrl(resolved);
    if (!inventoryByPath.has(localPath)) {
      missingLocalReferences.push({ route, ref, localPath, reason: 'asset_missing' });
      continue;
    }
    localAssets.add(localPath);
  }

  const referenced = [...localAssets].map((item) => inventoryByPath.get(item));
  const inlineScriptBytes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((sum, match) => sum + Buffer.byteLength(match[1], 'utf8'), 0);
  const inlineStyleBytes = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .reduce((sum, match) => sum + Buffer.byteLength(match[1], 'utf8'), 0);

  pageMetrics.push({
    route,
    locale: route.startsWith('/ja/') ? 'ja' : 'en',
    family: routeFamily(route),
    htmlBytes: buffer.length,
    htmlGzipBytes: gzipBytes(buffer),
    elementTags: (html.match(/<[a-z][^>]*>/gi) ?? []).length,
    stylesheetReferences: stylesheetRefs.length,
    scriptReferences: scriptRefs.length,
    imageReferences: imageRefs.length,
    preloadReferences: preloadRefs.length,
    uniqueLocalAssetReferences: localAssets.size,
    referencedAssetBytes: referenced.reduce((sum, item) => sum + item.bytes, 0),
    referencedAssetGzipBytes: referenced.reduce((sum, item) => sum + item.gzipBytes, 0),
    inlineScriptBytes,
    inlineStyleBytes,
    externalRuntimeReferences: pageExternal.length,
  });
}

for (const item of inventory.filter((entry) => entry.type === 'css')) {
  const css = fs.readFileSync(path.join(dist, item.file), 'utf8');
  for (const match of css.matchAll(/url\(([^)]+)\)/gi)) {
    const raw = match[1].trim().replace(/^['"]|['"]$/g, '');
    if (/^(?:data:|blob:|#)/i.test(raw)) continue;
    const resolved = new URL(raw, `${siteOrigin}/${item.file}`);
    if (resolved.origin !== siteOrigin) externalRuntimeReferences.push({ file: item.file, ref: raw, origin: resolved.origin });
    else {
      const localPath = localPathFromUrl(resolved);
      if (!inventoryByPath.has(localPath)) missingLocalReferences.push({ file: item.file, ref: raw, localPath, reason: 'css_asset_missing' });
    }
  }
}

const typeTotals = {};
for (const item of inventory) {
  const current = typeTotals[item.type] ?? { files: 0, bytes: 0, gzipBytes: 0, largestBytes: 0, largestFile: '' };
  current.files += 1;
  current.bytes += item.bytes;
  current.gzipBytes += item.gzipBytes;
  if (item.bytes > current.largestBytes) {
    current.largestBytes = item.bytes;
    current.largestFile = item.file;
  }
  typeTotals[item.type] = current;
}

const familyMetrics = {};
for (const family of [...new Set(pageMetrics.map((item) => item.family))].sort()) {
  const rows = pageMetrics.filter((item) => item.family === family);
  familyMetrics[family] = {
    pages: rows.length,
    htmlBytes: summary(rows.map((item) => item.htmlBytes)),
    htmlGzipBytes: summary(rows.map((item) => item.htmlGzipBytes)),
    referencedAssetGzipBytes: summary(rows.map((item) => item.referencedAssetGzipBytes)),
    elementTags: summary(rows.map((item) => item.elementTags)),
  };
}

const report = {
  schemaVersion: 'v1-performance-qa-discovery-v1',
  generatedAt: new Date().toISOString(),
  publicPages: sitemapUrls.length,
  renderedHtmlPages: htmlFiles.length,
  measuredPages: pageMetrics.length,
  distFiles: inventory.length,
  distBytes: inventory.reduce((sum, item) => sum + item.bytes, 0),
  distGzipBytes: inventory.reduce((sum, item) => sum + item.gzipBytes, 0),
  typeTotals,
  pageDistributions: {
    htmlBytes: summary(pageMetrics.map((item) => item.htmlBytes)),
    htmlGzipBytes: summary(pageMetrics.map((item) => item.htmlGzipBytes)),
    elementTags: summary(pageMetrics.map((item) => item.elementTags)),
    uniqueLocalAssetReferences: summary(pageMetrics.map((item) => item.uniqueLocalAssetReferences)),
    referencedAssetBytes: summary(pageMetrics.map((item) => item.referencedAssetBytes)),
    referencedAssetGzipBytes: summary(pageMetrics.map((item) => item.referencedAssetGzipBytes)),
    inlineScriptBytes: summary(pageMetrics.map((item) => item.inlineScriptBytes)),
    inlineStyleBytes: summary(pageMetrics.map((item) => item.inlineStyleBytes)),
  },
  pagesWithExternalRuntimeReferences: pageMetrics.filter((item) => item.externalRuntimeReferences > 0).length,
  externalRuntimeReferenceInstances: externalRuntimeReferences.length,
  missingLocalReferenceInstances: missingLocalReferences.length,
  pagesWithScriptReferences: pageMetrics.filter((item) => item.scriptReferences > 0).length,
  pagesWithInlineScripts: pageMetrics.filter((item) => item.inlineScriptBytes > 0).length,
  pagesWithImages: pageMetrics.filter((item) => item.imageReferences > 0).length,
  pagesWithPreloads: pageMetrics.filter((item) => item.preloadReferences > 0).length,
  familyMetrics,
  largestPages: [...pageMetrics].sort((a, b) => b.htmlBytes - a.htmlBytes).slice(0, 50),
  largestAssets: [...inventory].filter((item) => item.type !== 'html').sort((a, b) => b.bytes - a.bytes).slice(0, 50),
  externalRuntimeReferences,
  missingLocalReferences,
};

fs.writeFileSync('v1-performance-qa-discovery.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  schemaVersion: report.schemaVersion,
  publicPages: report.publicPages,
  renderedHtmlPages: report.renderedHtmlPages,
  measuredPages: report.measuredPages,
  distFiles: report.distFiles,
  distBytes: report.distBytes,
  distGzipBytes: report.distGzipBytes,
  typeTotals: report.typeTotals,
  pageDistributions: report.pageDistributions,
  pagesWithExternalRuntimeReferences: report.pagesWithExternalRuntimeReferences,
  externalRuntimeReferenceInstances: report.externalRuntimeReferenceInstances,
  missingLocalReferenceInstances: report.missingLocalReferenceInstances,
  pagesWithScriptReferences: report.pagesWithScriptReferences,
  pagesWithInlineScripts: report.pagesWithInlineScripts,
  pagesWithImages: report.pagesWithImages,
  pagesWithPreloads: report.pagesWithPreloads,
}, null, 2));
