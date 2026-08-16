import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const contract = JSON.parse(fs.readFileSync('data/static/m6-seo-sitemap-metadata-pass-v1.json', 'utf8'));
const historical = JSON.parse(fs.readFileSync('data/static/seo-qa-release-v1.json', 'utf8'));
const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
const robots = fs.readFileSync('dist/robots.txt', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-seo-sitemap-metadata-pass.yml', 'utf8');

assert.equal(contract.schema_version, 'm6-seo-sitemap-metadata-pass-v1');
assert.equal(contract.work_id, 'WHR-M6-SEO-SITEMAP-METADATA-PASS');
assert.equal(contract.implementation_unit, 'M6-SEO-SITEMAP-METADATA-PASS-01');
assert.equal(contract.status, 'release_candidate_ready');
assert.equal(contract.reviewed_at, '2026-08-16');
assert.equal(contract.historical_seo_baseline, 'data/static/seo-qa-release-v1.json');
assert.equal(historical.schema_version, 'seo-qa-release-v1');
assert.equal(historical.release_id, 'WHR-SEO-PUBLIC-CONTENT-V1');
assert.equal(historical.reviewed_at, '2026-07-18');
assert.ok(Object.values(contract.metadata_contract).every((value) => value === true));
assert.ok(Object.values(contract.boundary).every((value) => value === false));

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const paths = urls.map((url) => new URL(url).pathname);
assert.equal(urls.length, contract.current_inventory.public_pages);
assert.equal(paths.filter((value) => !value.startsWith('/ja/')).length, contract.current_inventory.english_pages);
assert.equal(paths.filter((value) => value.startsWith('/ja/')).length, contract.current_inventory.japanese_pages);
const normalized = paths.map((value) => value === '/ja/' ? '/' : value.replace(/^\/ja\//, '/'));
assert.equal(new Set(normalized.map((value) => value === '/' ? '(root)' : value.split('/').filter(Boolean)[0])).size, contract.current_inventory.route_families);
for (const required of contract.required_routes) assert.ok(paths.includes(required), `required SEO route missing: ${required}`);

const expected = {
  '/about/data-coverage/': {
    lang: 'en',
    title: 'Data Coverage | Where Horses Run',
    description: 'Compare official-source capability, source freshness, and reviewed public timetable coverage for Japan, Hong Kong, UAE, South Korea, Turkey, and Morocco.',
    alternate: '/ja/about/data-coverage/',
    xDefault: '/about/data-coverage/',
  },
  '/ja/about/data-coverage/': {
    lang: 'ja',
    title: 'データカバー範囲 | 競馬どこ？',
    description: '日本、香港、UAE、韓国、トルコ、モロッコの公式ソース能力、ソース鮮度、レビュー済み公開タイムテーブル範囲を比較します。',
    alternate: '/about/data-coverage/',
    xDefault: '/about/data-coverage/',
  },
  '/methods/': {
    lang: 'en',
    title: 'Methods and Data Policy | Where Horses Run',
    description: 'How Where Horses Run prioritizes official sources, reviews data, handles dates and timezones, applies publication ranks, updates records, and states limitations.',
    alternate: '/ja/methods/',
    xDefault: '/methods/',
  },
  '/ja/methods/': {
    lang: 'ja',
    title: 'データの方法と公開方針 | 競馬どこ？',
    description: '競馬どこ？の公式ソース優先、レビュー手順、日付と時刻帯、公開ランク、更新・訂正・制限事項を説明します。',
    alternate: '/methods/',
    xDefault: '/methods/',
  },
};

function decode(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}
function fileFor(route) {
  return route === '/' ? 'dist/index.html' : path.join('dist', route.replace(/^\//, ''), 'index.html');
}
function attr(tag, name) {
  return decode(tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? '');
}
function text(html, pattern) {
  return decode(html.match(pattern)?.[1]?.replace(/<[^>]*>/g, '').trim() ?? '');
}

for (const [route, policy] of Object.entries(expected)) {
  const file = fileFor(route);
  assert.ok(fs.existsSync(file), `rendered SEO route missing: ${route}`);
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(html.match(/<html\s+[^>]*lang="([^"]+)"/i)?.[1], policy.lang, `${route}: lang differs`);
  assert.equal(text(html, /<title>([\s\S]*?)<\/title>/i), policy.title, `${route}: title differs`);
  const descriptionTag = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => match[0]).find((tag) => attr(tag, 'name') === 'description');
  assert.ok(descriptionTag, `${route}: description missing`);
  assert.equal(attr(descriptionTag, 'content'), policy.description, `${route}: description differs`);
  const canonicalTag = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => match[0]).find((tag) => attr(tag, 'rel') === 'canonical');
  assert.ok(canonicalTag, `${route}: canonical missing`);
  assert.equal(attr(canonicalTag, 'href'), `${SITE_ORIGIN}${route}`, `${route}: canonical differs`);
  const alternateTags = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => match[0]).filter((tag) => attr(tag, 'rel') === 'alternate');
  const alternates = Object.fromEntries(alternateTags.map((tag) => [attr(tag, 'hreflang'), attr(tag, 'href')]));
  assert.equal(alternates[policy.lang], `${SITE_ORIGIN}${route}`, `${route}: self hreflang differs`);
  assert.equal(alternates[policy.lang === 'en' ? 'ja' : 'en'], `${SITE_ORIGIN}${policy.alternate}`, `${route}: alternate hreflang differs`);
  assert.equal(alternates['x-default'], `${SITE_ORIGIN}${policy.xDefault}`, `${route}: x-default differs`);
  assert.match(html, /data-structured-data-baseline="website-webpage-v1"/, `${route}: baseline JSON-LD missing`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    assert.ok([...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => match[0]).some((tag) => attr(tag, 'property') === property), `${route}: ${property} missing`);
  }
}

assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);

for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-m6-country-coverage-matrix.mjs',
  'node scripts/check-m6-methods-data-policy-final.mjs',
  'node scripts/check-m6-seo-sitemap-metadata-pass.mjs',
  'git diff --exit-code',
]) assert.ok(workflow.includes(marker), `M6 SEO workflow marker missing: ${marker}`);
for (const forbidden of ['contents: write', 'pull-requests: write', 'schedule:', 'cron:', 'deploy', 'wrangler']) {
  assert.ok(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `M6 SEO workflow contains forbidden marker: ${forbidden}`);
}

console.log('M6 SEO / sitemap / metadata pass check passed.');
console.log(`PUBLIC_PAGES: ${urls.length}`);
console.log(`ENGLISH_PAGES: ${contract.current_inventory.english_pages}`);
console.log(`JAPANESE_PAGES: ${contract.current_inventory.japanese_pages}`);
console.log(`ROUTE_FAMILIES: ${contract.current_inventory.route_families}`);
console.log('REQUIRED_ROUTE_METADATA_ERRORS: 0');
console.log('HISTORICAL_SEO_BASELINE_REWRITTEN: false');
