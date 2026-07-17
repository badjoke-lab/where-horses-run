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
const configPath = 'astro.config.mjs';
const generatorPath = 'scripts/social-card-integration.mjs';
const layoutPath = 'src/layouts/BaseLayout.astro';
const docPath = 'docs/seo/open-graph-social-cards.md';
const workflowPath = '.github/workflows/open-graph-social-cards.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-open-graph-social-cards-discovery.yml';

for (const requiredPath of [contractPath, auditPath, configPath, generatorPath, layoutPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  public_pages: 767,
  paired_pages: 764,
  unpaired_pages: 3,
  generated_images: 1,
  open_graph_core_properties_per_page: 6,
  open_graph_image_properties_per_page: 6,
  twitter_properties_per_page: 5,
  open_graph_locale_alternate_links: 764,
  open_graph_image_references: 767,
  twitter_image_references: 767,
  localized_image_alt_values: 2,
};
const expectedVerified = {
  public_pages: 767,
  paired_pages: 764,
  unpaired_pages: 3,
  image_files: 1,
  image_bytes: 9437,
  image_width: 1200,
  image_height: 630,
  image_bit_depth: 8,
  image_color_type: 2,
  image_idat_bytes: 9380,
  image_sha256_mismatches: 0,
  og_type: 767,
  og_site_name: 767,
  og_title: 767,
  og_description: 767,
  og_url: 767,
  og_locale: 767,
  og_locale_alternate: 764,
  og_image: 767,
  og_image_secure_url: 767,
  og_image_type: 767,
  og_image_width: 767,
  og_image_height: 767,
  og_image_alt: 767,
  twitter_card: 767,
  twitter_title: 767,
  twitter_description: 767,
  twitter_image: 767,
  twitter_image_alt: 767,
  duplicate_property_errors: 0,
  canonical_alignment_errors: 0,
  title_alignment_errors: 0,
  description_alignment_errors: 0,
  locale_errors: 0,
  locale_alternate_errors: 0,
  image_url_errors: 0,
  image_descriptor_errors: 0,
  image_alt_errors: 0,
  twitter_errors: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
};
const expectedPublicBoundary = {
  public_social_preview_metadata_allowed: true,
  public_generated_brand_card_allowed: true,
  page_title_and_description_reuse_allowed: true,
  verified_locale_alternate_allowed: true,
  false_locale_alternate_allowed: false,
  participant_or_racecard_image_allowed: false,
  odds_result_or_prediction_image_allowed: false,
  third_party_source_image_republication_allowed: false,
};
const expectedPrivacyBoundary = {
  remote_image_request_tracking_enabled: false,
  visitor_identifiers_enabled: false,
  interaction_logging_enabled: false,
  cookies_enabled: false,
  client_storage_enabled: false,
  analytics_added: false,
};
const expectedAutomationBoundary = {
  external_image_generation_service_enabled: false,
  automatic_source_image_selection_enabled: false,
  automatic_content_generation_enabled: false,
  automatic_publication_enabled: false,
  deployment_enabled: false,
};

if (contract.schema_version !== 'open-graph-social-cards-contract-v1') fail('social-card contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('social-card Work ID differs');
if (contract.implementation_unit !== 'OPEN-GRAPH-SOCIAL-CARDS-01') fail('social-card implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('social-card release state differs');
if (contract.site_origin !== SITE_ORIGIN || !exact(contract.scope, expectedScope)) fail('social-card scope differs');
if (!exact(contract.image_contract, {
  path: '/social/whr-social-card-v1.png',
  build_output_path: 'dist/social/whr-social-card-v1.png',
  absolute_url: IMAGE_URL,
  mime_type: 'image/png',
  width: 1200,
  height: 630,
  bit_depth: 8,
  color_type: 2,
  bytes: 9437,
  idat_bytes: 9380,
  sha256: IMAGE_SHA256,
  generator: generatorPath,
  external_image_service_required: false,
  external_font_required: false,
  additional_package_required: false,
  deterministic_generation_required: true,
})) fail('social-card image contract differs');
if (!exact(contract.open_graph_contract, {
  type: 'website',
  site_name: 'Where Horses Run',
  title_source: 'rendered-title',
  description_source: 'rendered-meta-description',
  url_source: 'rendered-canonical',
  locale_source: 'rendered-html-lang',
  locale_alternate_on_verified_pairs_only: true,
  image_url: IMAGE_URL,
  secure_image_url_required: true,
  image_type_required: true,
  image_width_required: true,
  image_height_required: true,
  localized_image_alt_required: true,
  one_value_per_required_property: true,
})) fail('Open Graph contract differs');
if (!exact(contract.twitter_contract, {
  card: 'summary_large_image',
  title_source: 'rendered-title',
  description_source: 'rendered-meta-description',
  image_url: IMAGE_URL,
  localized_image_alt_required: true,
  one_value_per_required_property: true,
})) fail('Twitter card contract differs');
if (!exact(contract.localized_alt_contract, { en: EN_ALT, ja: JA_ALT })) fail('social-card localized alt contract differs');
if (!exact(contract.public_boundary, expectedPublicBoundary) || !exact(contract.privacy_boundary, expectedPrivacyBoundary) || !exact(contract.automation_boundary, expectedAutomationBoundary)) fail('social-card boundaries differ');
if (contract.previous_implementation_unit !== 'CANONICAL-HREFLANG-REVIEW-01' || contract.next_implementation_unit !== 'TITLE-DESCRIPTION-NORMALIZATION-01') fail('social-card roadmap differs');

if (audit.schema_version !== 'open-graph-social-cards-audit-v1') fail('social-card audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('social-card audit identity differs');
if (audit.status !== 'complete' || !exact(audit.verified, expectedVerified)) fail('social-card audit measurements differ');
if (!Object.values(audit.behavior ?? {}).every((value) => value === true)) fail('social-card audit behavior differs');
if (!exact(audit.public_boundary, expectedPublicBoundary) || !exact(audit.privacy_boundary, expectedPrivacyBoundary) || !exact(audit.automation_boundary, expectedAutomationBoundary)) fail('social-card audit boundaries differ');

const config = read(configPath);
for (const marker of [
  "import socialCardIntegration from './scripts/social-card-integration.mjs'",
  'socialCardIntegration()',
]) if (!config.includes(marker)) fail(`Astro config missing ${marker}`);
if (config.indexOf('glossaryPageMetadataIntegration()') > config.indexOf('socialCardIntegration()')) fail('social-card integration order differs');

const generator = read(generatorPath);
for (const marker of [
  'const WIDTH = 1200',
  'const HEIGHT = 630',
  "const OUTPUT_PATH = 'social/whr-social-card-v1.png'",
  "drawText(pixels, 'WHERE HORSES RUN'",
  "drawText(pixels, 'WHR'",
  "drawText(pixels, 'CALENDARS  RACECOURSES  SOURCES'",
  "chunk('IHDR'",
  "chunk('IDAT'",
  "chunk('IEND'",
  'deflateSync(scanlines, { level: 9 })',
  'await fs.writeFile(outputFile, image)',
]) if (!generator.includes(marker)) fail(`social-card generator missing ${marker}`);
for (const forbidden of ['https://', 'http://', 'fetch(', 'sharp', 'canvas', 'puppeteer', 'playwright', 'localStorage', 'document.cookie']) {
  if (generator.includes(forbidden)) fail(`social-card generator contains forbidden marker ${forbidden}`);
}

const layout = read(layoutPath);
for (const marker of [
  "const socialImageUrl = `${siteUrl}/social/whr-social-card-v1.png`",
  'const socialImageAlt = isJapanese',
  '{alternateUrl && <meta property="og:locale:alternate" content={alternateOgLocale} />}',
  '<meta property="og:image" content={socialImageUrl} />',
  '<meta property="og:image:secure_url" content={socialImageUrl} />',
  '<meta property="og:image:type" content="image/png" />',
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta property="og:image:alt" content={socialImageAlt} />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:image" content={socialImageUrl} />',
  '<meta name="twitter:image:alt" content={socialImageAlt} />',
]) if (!layout.includes(marker)) fail(`social-card layout missing ${marker}`);
if (layout.includes('<meta property="og:locale:alternate" content={alternateOgLocale} />\n    <meta property="og:image"')) fail('social-card locale alternate is unconditional');
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary social-card discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'OPEN-GRAPH-SOCIAL-CARDS-01',
  '1200×630 PNG',
  'Bytes: 9,437',
  IMAGE_SHA256,
  'summary_large_image',
  'Public pages: 767',
  'Open Graph locale alternates: 764',
  'scripts/check-open-graph-social-cards.mjs',
  '.github/workflows/open-graph-social-cards.yml',
  'TITLE-DESCRIPTION-NORMALIZATION-01',
]) if (!doc.includes(marker)) fail(`social-card documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-canonical-hreflang-review.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'node scripts/check-country-page-metadata.mjs',
  'node scripts/check-racecourse-page-metadata.mjs',
  'node scripts/check-glossary-page-metadata.mjs',
  'node scripts/check-open-graph-social-cards.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`social-card workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`social-card workflow contains forbidden marker ${forbidden}`);
}

function parsePng(buffer) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    fail('social-card image is not PNG');
    return {};
  }
  let offset = 8;
  const result = { idatBytes: 0 };
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      result.width = data.readUInt32BE(0);
      result.height = data.readUInt32BE(4);
      result.bitDepth = data[8];
      result.colorType = data[9];
    }
    if (type === 'IDAT') result.idatBytes += length;
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return result;
}

const generated = renderCard();
if (WIDTH !== 1200 || HEIGHT !== 630 || OUTPUT_PATH !== 'social/whr-social-card-v1.png') fail('social-card exported constants differ');
if (generated.length !== 9437) fail(`in-memory social-card byte count differs ${generated.length}`);
if (crypto.createHash('sha256').update(generated).digest('hex') !== IMAGE_SHA256) fail('in-memory social-card checksum differs');
const builtImagePath = 'dist/social/whr-social-card-v1.png';
if (!fs.existsSync(filePath(builtImagePath))) fail('built social-card image is missing');
const builtImage = fs.existsSync(filePath(builtImagePath)) ? fs.readFileSync(filePath(builtImagePath)) : Buffer.alloc(0);
if (!generated.equals(builtImage)) fail('built social-card image differs from deterministic generator');
const png = parsePng(builtImage);
if (!exact(png, { idatBytes: 9380, width: 1200, height: 630, bitDepth: 8, colorType: 2 })) fail(`social-card PNG structure differs ${JSON.stringify(png)}`);

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
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
}
function renderedFile(urlString) {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
}

if (!fs.existsSync(filePath('dist/sitemap.xml'))) fail('generated sitemap is missing');
const urls = fs.existsSync(filePath('dist/sitemap.xml')) ? [...read('dist/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]) : [];
if (urls.length !== 767) fail(`social-card public page count differs ${urls.length}`);
const requiredOg = ['og:type','og:site_name','og:title','og:description','og:url','og:locale','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt'];
const requiredTwitter = ['twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'];
let pairedPages = 0;
let unpairedPages = 0;
let localeAlternates = 0;

for (const url of urls) {
  const file = renderedFile(url);
  if (!fs.existsSync(filePath(file))) {
    fail(`${url}: rendered page missing`);
    continue;
  }
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1];
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<[^>]*>/g, '').trim() ?? '');
  const tags = [...html.matchAll(/<meta\s+[^>]*>/g)].map((match) => attributes(match[0]));
  const links = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) => attributes(match[0]));
  const description = tags.find((tag) => tag.name === 'description')?.content;
  const canonical = links.find((link) => link.rel === 'canonical')?.href;
  const paired = links.filter((link) => link.rel === 'alternate' && link.hreflang).length === 3;
  if (paired) pairedPages += 1; else unpairedPages += 1;
  const values = new Map();
  for (const tag of tags) {
    const key = tag.property || tag.name;
    if (!key) continue;
    if (!values.has(key)) values.set(key, []);
    values.get(key).push(tag.content);
  }
  for (const key of [...requiredOg, ...requiredTwitter]) {
    if ((values.get(key) ?? []).length !== 1) fail(`${url}: required social property count differs for ${key}`);
  }
  const get = (key) => values.get(key)?.[0];
  const expectedLocale = lang === 'ja' ? 'ja_JP' : 'en_US';
  const expectedAlternate = lang === 'ja' ? 'en_US' : 'ja_JP';
  const expectedAlt = lang === 'ja' ? JA_ALT : EN_ALT;
  if (get('og:type') !== 'website' || get('og:site_name') !== 'Where Horses Run') fail(`${url}: Open Graph identity differs`);
  if (get('og:title') !== title || get('twitter:title') !== title) fail(`${url}: social title differs`);
  if (get('og:description') !== description || get('twitter:description') !== description) fail(`${url}: social description differs`);
  if (get('og:url') !== canonical) fail(`${url}: Open Graph URL differs`);
  if (get('og:locale') !== expectedLocale) fail(`${url}: Open Graph locale differs`);
  const alternateValues = values.get('og:locale:alternate') ?? [];
  if (paired) {
    if (alternateValues.length !== 1 || alternateValues[0] !== expectedAlternate) fail(`${url}: Open Graph alternate locale differs`);
    else localeAlternates += 1;
  } else if (alternateValues.length !== 0) fail(`${url}: unpaired page contains Open Graph alternate locale`);
  if (get('og:image') !== IMAGE_URL || get('og:image:secure_url') !== IMAGE_URL || get('twitter:image') !== IMAGE_URL) fail(`${url}: social image URL differs`);
  if (get('og:image:type') !== 'image/png' || get('og:image:width') !== '1200' || get('og:image:height') !== '630') fail(`${url}: Open Graph image descriptor differs`);
  if (get('og:image:alt') !== expectedAlt || get('twitter:image:alt') !== expectedAlt) fail(`${url}: localized social image alt differs`);
  if (get('twitter:card') !== 'summary_large_image') fail(`${url}: Twitter card type differs`);
}

if (pairedPages !== 764 || unpairedPages !== 3 || localeAlternates !== 764) fail('social-card paired/unpaired locale totals differ');

if (errors.length) {
  console.error(`OPEN_GRAPH_SOCIAL_CARDS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('OPEN_GRAPH_SOCIAL_CARDS: pass');
console.log('PUBLIC_PAGES: 767');
console.log('SOCIAL_CARD_BYTES: 9437');
console.log(`SOCIAL_CARD_SHA256: ${IMAGE_SHA256}`);
console.log('OPEN_GRAPH_IMAGE_REFERENCES: 767');
console.log('OPEN_GRAPH_LOCALE_ALTERNATES: 764');
console.log('TWITTER_LARGE_IMAGE_CARDS: 767');
console.log('NEXT_IMPLEMENTATION_UNIT: TITLE-DESCRIPTION-NORMALIZATION-01');
