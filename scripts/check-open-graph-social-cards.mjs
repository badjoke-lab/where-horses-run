import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { renderCard, WIDTH, HEIGHT, OUTPUT_PATH } from './social-card-integration.mjs';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const IMAGE_URL = `${SITE_ORIGIN}/social/whr-social-card-v1.png`;
const CONTRACT = 'data/static/open-graph-social-cards-contract-v1.json';
const AUDIT = 'data/audits/open-graph-social-cards-v1.json';
const LAYOUT = 'src/layouts/BaseLayout.astro';
const GENERATOR = 'scripts/social-card-integration.mjs';
const DOC = 'docs/seo/open-graph-social-cards.md';
const WORKFLOW = '.github/workflows/open-graph-social-cards.yml';
const TEMPORARY = '.github/workflows/temporary-open-graph-social-cards-discovery.yml';
const SITEMAP = 'dist/sitemap.xml';
const EN_ALT = 'Where Horses Run social card with a stylized racecourse oval.';
const JA_ALT = 'Where Horses Run / 競馬どこ？ のソーシャルカード。競馬場の楕円コースを図案化した画像。';

const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [CONTRACT, AUDIT, LAYOUT, GENERATOR, DOC, WORKFLOW, SITEMAP]) expect(fs.existsSync(file), `Missing ${file}`);
expect(!fs.existsSync(TEMPORARY), 'Temporary Open Graph discovery workflow remains');
const contract = json(CONTRACT);
const audit = json(AUDIT);
expect(contract.schema_version === 'open-graph-social-cards-contract-v1' && contract.status === 'complete', 'Social-card contract identity differs');
expect(contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'Social-card scope marker differs');
expect(contract.site_origin === SITE_ORIGIN, 'Social-card origin differs');
expect(audit.schema_version === 'open-graph-social-cards-audit-v1' && audit.status === 'complete', 'Social-card audit identity differs');
expect(audit.scope_updated_by === contract.scope_updated_by, 'Social-card audit scope marker differs');
for (const key of ['public_pages','paired_pages','unpaired_pages','faq_pages','methods_pages']) expect(audit.verified[key] === contract.scope[key], `Social-card historical audit ${key} differs`);
for (const [auditKey, scopeKey] of [
  ['og_type','public_pages'],['og_site_name','public_pages'],['og_title','public_pages'],['og_description','public_pages'],['og_url','public_pages'],['og_locale','public_pages'],
  ['og_locale_alternate','open_graph_locale_alternate_links'],['og_image','open_graph_image_references'],['og_image_secure_url','open_graph_image_references'],
  ['og_image_type','open_graph_image_references'],['og_image_width','open_graph_image_references'],['og_image_height','open_graph_image_references'],['og_image_alt','open_graph_image_references'],
  ['twitter_card','twitter_image_references'],['twitter_title','twitter_image_references'],['twitter_description','twitter_image_references'],['twitter_image','twitter_image_references'],['twitter_image_alt','twitter_image_references'],
]) expect(audit.verified[auditKey] === contract.scope[scopeKey], `Social-card historical audit ${auditKey} differs`);
for (const key of ['image_sha256_mismatches','duplicate_property_errors','canonical_alignment_errors','title_alignment_errors','description_alignment_errors','locale_errors','locale_alternate_errors','image_url_errors','image_descriptor_errors','image_alt_errors','twitter_errors','contract_errors','output_errors']) expect(audit.verified[key] === 0, `Social-card historical audit ${key} differs`);
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'Social-card privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'Social-card automation boundary differs');

const layout = read(LAYOUT);
for (const marker of ['const socialImageUrl','const socialImageAlt','property="og:image"','property="og:image:secure_url"','property="og:image:type"','property="og:image:width"','property="og:image:height"','property="og:image:alt"','name="twitter:card" content="summary_large_image"','name="twitter:image"','name="twitter:image:alt"']) expect(layout.includes(marker), `BaseLayout social marker missing: ${marker}`);
const generator = read(GENERATOR);
for (const marker of ['const WIDTH = 1200','const HEIGHT = 630',"const OUTPUT_PATH = 'social/whr-social-card-v1.png'", "name: 'where-horses-run-social-card'", "'astro:build:done'", 'renderCard()']) expect(generator.includes(marker), `Social-card generator marker missing: ${marker}`);
for (const forbidden of ['fetch(', 'axios', 'puppeteer', 'playwright', 'sharp', "from 'canvas'", 'contents: write']) expect(!generator.toLowerCase().includes(forbidden.toLowerCase()), `Social-card generator contains forbidden marker ${forbidden}`);
const doc = read(DOC);
for (const marker of ['OPEN-GRAPH-SOCIAL-CARDS-01', `Public pages: ${contract.scope.public_pages}`, `Paired pages: ${contract.scope.paired_pages}`, 'FAQ pages: 2', 'Methods pages: 2', contract.image_contract.sha256]) expect(doc.includes(marker), `Social-card historical documentation marker missing: ${marker}`);

function parsePng(buffer) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  expect(buffer.subarray(0, 8).equals(signature), 'Built social card is not PNG');
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
  return { ...result, idatBytes };
}

const builtPath = path.join('dist', OUTPUT_PATH);
expect(fs.existsSync(builtPath), `Built social card is missing: ${builtPath}`);
const built = fs.readFileSync(builtPath);
const regenerated = renderCard();
const png = parsePng(built);
expect(built.equals(regenerated), 'Built social card differs from deterministic regeneration');
expect(crypto.createHash('sha256').update(built).digest('hex') === contract.image_contract.sha256, 'Social-card SHA-256 differs');
expect(built.length === contract.image_contract.bytes, `Social-card byte count differs ${built.length}`);
expect(png.width === WIDTH && png.height === HEIGHT && png.bitDepth === contract.image_contract.bit_depth && png.colorType === contract.image_contract.color_type && png.idatBytes === contract.image_contract.idat_bytes, `Social-card PNG structure differs ${JSON.stringify(png)}`);

function decode(value) {
  return value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const strip = (value) => decode(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
const fileFor = (urlString) => {
  const pathname = new URL(urlString).pathname;
  return pathname === '/' ? 'dist/index.html' : path.join('dist', pathname.replace(/^\//, ''), 'index.html');
};

const urls = [...read(SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
expect(urls.length >= contract.scope.public_pages, `Social-card current public page count shrank ${urls.length}`);
const requiredOg = ['og:type','og:site_name','og:title','og:description','og:url','og:locale','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt'];
const requiredTwitter = ['twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'];
let pairedPages = 0;
let unpairedPages = 0;
let localeAlternates = 0;
let faqPages = 0;
let methodsPages = 0;
for (const url of urls) {
  const file = fileFor(url);
  expect(fs.existsSync(file), `${url}: rendered file is missing`);
  const html = read(file);
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/)?.[1] ?? '';
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
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
  for (const key of [...requiredOg, ...requiredTwitter]) expect((values.get(key) ?? []).length === 1, `${url}: ${key} count differs ${(values.get(key) ?? []).length}`);
  const descriptions = metas.filter((meta) => meta.name === 'description');
  const canonicals = links.filter((link) => link.rel === 'canonical');
  expect(descriptions.length === 1 && canonicals.length === 1, `${url}: base metadata count differs`);
  const description = descriptions[0].content ?? '';
  const canonical = canonicals[0].href ?? '';
  const alternates = links.filter((link) => link.rel === 'alternate' && link.hreflang);
  const paired = alternates.length === 3;
  if (paired) pairedPages += 1; else unpairedPages += 1;
  const pathname = new URL(url).pathname;
  if (pathname === '/faq/' || pathname === '/ja/faq/') faqPages += 1;
  if (pathname === '/methods/' || pathname === '/ja/methods/') methodsPages += 1;
  expect(get('og:type') === contract.open_graph_contract.type, `${url}: og:type differs`);
  expect(get('og:site_name') === contract.open_graph_contract.site_name, `${url}: og:site_name differs`);
  expect(get('og:title') === title && get('twitter:title') === title, `${url}: social title differs`);
  expect(get('og:description') === description && get('twitter:description') === description, `${url}: social description differs`);
  expect(get('og:url') === canonical && canonical === url, `${url}: social URL differs`);
  const expectedLocale = lang === 'ja' ? 'ja_JP' : 'en_US';
  const expectedAlternate = lang === 'ja' ? 'en_US' : 'ja_JP';
  expect(get('og:locale') === expectedLocale, `${url}: og:locale differs`);
  const alternateValues = values.get('og:locale:alternate') ?? [];
  if (paired) {
    expect(alternateValues.length === 1 && alternateValues[0] === expectedAlternate, `${url}: og:locale:alternate differs`);
    localeAlternates += 1;
  } else expect(alternateValues.length === 0, `${url}: unpaired page emits locale alternate`);
  const expectedAlt = lang === 'ja' ? JA_ALT : EN_ALT;
  for (const key of ['og:image','og:image:secure_url','twitter:image']) expect(get(key) === IMAGE_URL, `${url}: ${key} differs`);
  expect(get('og:image:type') === contract.image_contract.mime_type && get('og:image:width') === String(contract.image_contract.width) && get('og:image:height') === String(contract.image_contract.height), `${url}: image descriptors differ`);
  expect(get('og:image:alt') === expectedAlt && get('twitter:image:alt') === expectedAlt, `${url}: image alt differs`);
  expect(get('twitter:card') === contract.twitter_contract.card, `${url}: twitter:card differs`);
}
expect(unpairedPages === contract.scope.unpaired_pages, `Unpaired page count differs ${unpairedPages}`);
expect(pairedPages === urls.length - unpairedPages, `Paired page count differs ${pairedPages}`);
expect(pairedPages >= contract.scope.paired_pages, `Paired page scope shrank ${pairedPages}`);
expect(localeAlternates === pairedPages, `Locale alternate count differs ${localeAlternates}`);
expect(faqPages === contract.scope.faq_pages, `FAQ page count differs ${faqPages}`);
expect(methodsPages === contract.scope.methods_pages, `Methods page count differs ${methodsPages}`);

console.log('OPEN_GRAPH_SOCIAL_CARDS: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.scope.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${urls.length}`);
console.log(`CURRENT_PAIRED_PAGES: ${pairedPages}`);
console.log('FAQ_PAGES: 2');
console.log('METHODS_PAGES: 2');
console.log(`IMAGE_SHA256: ${contract.image_contract.sha256}`);
