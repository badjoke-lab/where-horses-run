import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { renderCard, WIDTH, HEIGHT, OUTPUT_PATH } from './social-card-integration.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const IMAGE_URL = `${SITE_ORIGIN}/social/whr-social-card-v1.png`;
const IMAGE_SHA256 = '9e3c63e186f6681197b6e0cde8cdd3368e4d041b7f9dda79e33e940bd99861bd';
const EN_ALT = 'Where Horses Run social card with a stylized racecourse oval.';
const JA_ALT = 'Where Horses Run / 競馬どこ？ のソーシャルカード。競馬場の楕円コースを図案化した画像。';

const contractPath = 'data/static/open-graph-social-cards-contract-v1.json';
const auditPath = 'data/audits/open-graph-social-cards-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const generatorPath = 'scripts/social-card-integration.mjs';
const docPath = 'docs/seo/open-graph-social-cards.md';
const workflowPath = '.github/workflows/open-graph-social-cards.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-open-graph-social-cards-discovery.yml';

for (const required of [contractPath, auditPath, layoutPath, generatorPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary Open Graph discovery workflow remains');

const expectedScope = {
  public_pages: 769,
  paired_pages: 766,
  unpaired_pages: 3,
  generated_images: 1,
  open_graph_core_properties_per_page: 6,
  open_graph_image_properties_per_page: 6,
  twitter_properties_per_page: 5,
  open_graph_locale_alternate_links: 766,
  open_graph_image_references: 769,
  twitter_image_references: 769,
  localized_image_alt_values: 2,
  faq_pages: 2,
};

const contract = fs.existsSync(filePath(contractPath)) ? parse(contractPath) : {};
const audit = fs.existsSync(filePath(auditPath)) ? parse(auditPath) : {};
if (contract.schema_version !== 'open-graph-social-cards-contract-v1') fail('social-card contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('social-card Work ID differs');
if (contract.implementation_unit !== 'OPEN-GRAPH-SOCIAL-CARDS-01') fail('social-card implementation unit differs');
if (contract.status !== 'complete') fail('social-card contract status differs');
if (contract.reviewed_at !== '2026-07-18') fail('social-card review date differs');
if (contract.scope_updated_by !== 'FAQ-CONTENT-PAGES-01') fail('social-card scope update marker differs');
if (contract.site_origin !== SITE_ORIGIN) fail('social-card origin differs');
if (!exact(contract.scope, expectedScope)) fail('social-card scope differs');
if (contract.image_contract?.absolute_url !== IMAGE_URL || contract.image_contract?.width !== 1200 || contract.image_contract?.height !== 630 || contract.image_contract?.bytes !== 9437 || contract.image_contract?.sha256 !== IMAGE_SHA256) fail('social-card image contract differs');
if (contract.twitter_contract?.card !== 'summary_large_image') fail('Twitter card contract differs');
if (contract.localized_alt_contract?.en !== EN_ALT || contract.localized_alt_contract?.ja !== JA_ALT) fail('localized image-alt contract differs');
if (Object.values(contract.privacy_boundary ?? {}).some((value) => value !== false)) fail('social-card privacy boundary differs');
if (Object.values(contract.automation_boundary ?? {}).some((value) => value !== false)) fail('social-card automation boundary differs');

if (audit.schema_version !== 'open-graph-social-cards-audit-v1') fail('social-card audit schema differs');
if (audit.status !== 'complete') fail('social-card audit status differs');
if (audit.reviewed_at !== contract.reviewed_at || audit.scope_updated_by !== contract.scope_updated_by) fail('social-card audit scope identity differs');
for (const [key, value] of Object.entries({
  public_pages: 769,
  paired_pages: 766,
  unpaired_pages: 3,
  faq_pages: 2,
  image_files: 1,
  image_bytes: 9437,
  image_width: 1200,
  image_height: 630,
  image_bit_depth: 8,
  image_color_type: 2,
  image_idat_bytes: 9380,
  og_type: 769,
  og_site_name: 769,
  og_title: 769,
  og_description: 769,
  og_url: 769,
  og_locale: 769,
  og_locale_alternate: 766,
  og_image: 769,
  og_image_secure_url: 769,
  og_image_type: 769,
  og_image_width: 769,
  og_image_height: 769,
  og_image_alt: 769,
  twitter_card: 769,
  twitter_title: 769,
  twitter_description: 769,
  twitter_image: 769,
  twitter_image_alt: 769,
})) if (audit.verified?.[key] !== value) fail(`social-card audit ${key} differs`);
for (const key of ['image_sha256_mismatches', 'duplicate_property_errors', 'canonical_alignment_errors', 'title_alignment_errors', 'description_alignment_errors', 'locale_errors', 'locale_alternate_errors', 'image_url_errors', 'image_descriptor_errors', 'image_alt_errors', 'twitter_errors', 'contract_errors', 'output_errors']) {
  if (audit.verified?.[key] !== 0) fail(`social-card audit ${key} differs`);
}

const layout = fs.existsSync(filePath(layoutPath)) ? read(layoutPath) : '';
for (const marker of [
  'const socialImageUrl',
  'const socialImageAlt',
  'property="og:image"',
  'property="og:image:secure_url"',
  'property="og:image:type"',
  'property="og:image:width"',
  'property="og:image:height"',
  'property="og:image:alt"',
  'name="twitter:card" content="summary_large_image"',
  'name="twitter:image"',
  'name="twitter:image:alt"',
]) if (!layout.includes(marker)) fail(`BaseLayout social metadata marker missing ${marker}`);

const generator = fs.existsSync(filePath(generatorPath)) ? read(generatorPath) : '';
for (const marker of [
  'const WIDTH = 1200',
  'const HEIGHT = 630',
  "const OUTPUT_PATH = 'social/whr-social-card-v1.png'",
  "name: 'where-horses-run-social-card'",
  "'astro:build:done'",
  'renderCard()',
]) if (!generator.includes(marker)) fail(`social-card generator marker missing ${marker}`);
for (const forbidden of ['fetch(', 'axios', 'puppeteer', 'playwright', 'sharp', 'canvas', 'contents: write']) {
  if (generator.toLowerCase().includes(forbidden.toLowerCase())) fail(`social-card generator contains forbidden marker ${forbidden}`);
}

const doc = fs.existsSync(filePath(docPath)) ? read(docPath) : '';
for (const marker of ['OPEN-GRAPH-SOCIAL-CARDS-01', 'Public pages: 769', 'Paired pages: 766', 'FAQ pages: 2', IMAGE_SHA256]) {
  if (!doc.includes(marker)) fail(`social-card documentation missing ${marker}`);
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? filePath('dist/index.html') : filePath(path.join('dist', pathname.replace(/^\//, ''), 'index.html'));
}

function parsePng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) return null;
  let offset = 8;
  let result = null;
  let idatBytes = 0;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') result = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] };
    if (type === 'IDAT') idatBytes += length;
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return result ? { ...result, idatBytes } : null;
}

const builtImagePath = filePath(path.join('dist', OUTPUT_PATH));
if (!fs.existsSync(builtImagePath)) fail(`built social card is missing: ${builtImagePath}`);
else {
  const built = fs.readFileSync(builtImagePath);
  const regenerated = renderCard();
  const png = parsePng(built);
  if (!built.equals(regenerated)) fail('built social card differs from deterministic regeneration');
  if (crypto.createHash('sha256').update(built).digest('hex') !== IMAGE_SHA256) fail('built social card SHA-256 differs');
  if (built.length !== 9437) fail(`built social card byte count differs ${built.length}`);
  if (!png || png.width !== WIDTH || png.height !== HEIGHT || png.bitDepth !== 8 || png.colorType !== 2 || png.idatBytes !== 9380) fail(`built social card PNG structure differs ${JSON.stringify(png)}`);
}

const sitemapPath = filePath('dist/sitemap.xml');
if (!fs.existsSync(sitemapPath)) fail('dist/sitemap.xml is missing; run npm run build first');
const urls = fs.existsSync(sitemapPath) ? [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]) : [];
if (urls.length !== 769) fail(`social-card public page count differs ${urls.length}`);

const requiredOg = ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:locale', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt'];
const requiredTwitter = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'];
let pairedPages = 0;
let unpairedPages = 0;
let localeAlternates = 0;
let faqPages = 0;

for (const url of urls) {
  const file = renderedFile(url);
  if (!fs.existsSync(file)) {
    fail(`${url}: rendered file missing`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  const title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metas = [...html.matchAll(/<meta\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attrs(match[0]));
  const values = new Map();
  for (const meta of metas) {
    const key = meta.property || meta.name;
    if (!key) continue;
    if (!values.has(key)) values.set(key, []);
    values.get(key).push(meta.content ?? '');
  }
  const get = (key) => values.get(key)?.[0];
  for (const key of [...requiredOg, ...requiredTwitter]) {
    if ((values.get(key) ?? []).length !== 1) fail(`${url}: ${key} count differs ${(values.get(key) ?? []).length}`);
  }
  const descriptions = metas.filter((meta) => meta.name === 'description');
  const canonicals = links.filter((link) => link.rel === 'canonical');
  if (descriptions.length !== 1 || canonicals.length !== 1) fail(`${url}: base description or canonical count differs`);
  const description = descriptions[0]?.content ?? '';
  const canonical = canonicals[0]?.href ?? '';
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const paired = alternates.length === 3;
  if (paired) pairedPages += 1; else unpairedPages += 1;
  if (new URL(url).pathname === '/faq/' || new URL(url).pathname === '/ja/faq/') faqPages += 1;

  if (get('og:type') !== 'website') fail(`${url}: og:type differs`);
  if (get('og:site_name') !== 'Where Horses Run') fail(`${url}: og:site_name differs`);
  if (get('og:title') !== title || get('twitter:title') !== title) fail(`${url}: social title differs`);
  if (get('og:description') !== description || get('twitter:description') !== description) fail(`${url}: social description differs`);
  if (get('og:url') !== canonical || canonical !== url) fail(`${url}: social URL differs`);
  const expectedLocale = lang === 'ja' ? 'ja_JP' : 'en_US';
  const expectedAlternate = lang === 'ja' ? 'en_US' : 'ja_JP';
  if (get('og:locale') !== expectedLocale) fail(`${url}: og:locale differs`);
  const alternateValues = values.get('og:locale:alternate') ?? [];
  if (paired) {
    if (alternateValues.length !== 1 || alternateValues[0] !== expectedAlternate) fail(`${url}: og:locale:alternate differs`);
    else localeAlternates += 1;
  } else if (alternateValues.length !== 0) fail(`${url}: unpaired page emits og:locale:alternate`);

  const expectedAlt = lang === 'ja' ? JA_ALT : EN_ALT;
  for (const key of ['og:image', 'og:image:secure_url', 'twitter:image']) if (get(key) !== IMAGE_URL) fail(`${url}: ${key} differs`);
  if (get('og:image:type') !== 'image/png' || get('og:image:width') !== '1200' || get('og:image:height') !== '630') fail(`${url}: image descriptors differ`);
  if (get('og:image:alt') !== expectedAlt || get('twitter:image:alt') !== expectedAlt) fail(`${url}: image alt differs`);
  if (get('twitter:card') !== 'summary_large_image') fail(`${url}: twitter:card differs`);
}

for (const [label, actual, expected] of [
  ['paired pages', pairedPages, 766],
  ['unpaired pages', unpairedPages, 3],
  ['locale alternates', localeAlternates, 766],
  ['FAQ pages', faqPages, 2],
]) if (actual !== expected) fail(`social-card ${label} differ ${actual}`);

if (errors.length) {
  console.error(`OPEN_GRAPH_SOCIAL_CARDS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('OPEN_GRAPH_SOCIAL_CARDS: pass');
console.log('PUBLIC_PAGES: 769');
console.log('PAIRED_PAGES: 766');
console.log('UNPAIRED_PAGES: 3');
console.log('FAQ_PAGES: 2');
console.log(`IMAGE_SHA256: ${IMAGE_SHA256}`);
console.log('NEXT_IMPLEMENTATION_UNIT: TITLE-DESCRIPTION-NORMALIZATION-01');
