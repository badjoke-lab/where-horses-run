import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const requireIncludes = (text, needle, label) => {
  if (!String(text ?? '').includes(needle)) fail(`${label}: missing '${needle}'`);
};
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`);
};
const astroMarkup = (source) => {
  const parts = String(source ?? '').split('\n---\n');
  return parts.length >= 2 ? parts.slice(1).join('\n---\n') : source;
};

const probeStatus = readJson('data/generated/live-fetch-probe-status.json');
const dataTs = readText('src/lib/data.ts');
const countryPage = readText('src/pages/countries/[slug].astro');
const jaCountryPage = readText('src/pages/ja/countries/[slug].astro');
const countryComponent = readText('src/components/CountryDetailPage.astro');
const publicMarkup = [astroMarkup(countryPage), astroMarkup(jaCountryPage), astroMarkup(countryComponent)].join('\n');

const hkProbe = (probeStatus.probes ?? []).find((probe) => probe.source_id === 'hong-kong-hkjc-home');
if (!hkProbe) {
  fail('live-fetch-probe-status: hong-kong-hkjc-home probe is missing');
} else {
  requireEqual(hkProbe.country_id, 'hong-kong', 'hkProbe.country_id');
  requireEqual(hkProbe.status, 'reachable', 'hkProbe.status');
  requireEqual(hkProbe.http_status, 200, 'hkProbe.http_status');
  requireEqual(hkProbe.live_network_enabled, true, 'hkProbe.live_network_enabled');
  requireEqual(hkProbe.probe_only, true, 'hkProbe.probe_only');
  requireEqual(hkProbe.raw_content_saved, false, 'hkProbe.raw_content_saved');
  requireEqual(hkProbe.body_read, false, 'hkProbe.body_read');
  requireEqual(hkProbe.body_bytes_saved, 0, 'hkProbe.body_bytes_saved');
  requireEqual(hkProbe.generated_files_written, false, 'hkProbe.generated_files_written');
  requireIncludes(hkProbe.message, 'Response body was not read or saved', 'hkProbe.message');
}

requireIncludes(dataTs, "import liveFetchProbeStatus from '../../data/generated/live-fetch-probe-status.json';", 'src/lib/data.ts import');
requireIncludes(dataTs, 'fetchStatus,', 'src/lib/data.ts generated fetchStatus comma');
requireIncludes(dataTs, 'liveFetchProbeStatus', 'src/lib/data.ts generated export');

for (const [label, text, locale] of [
  ['English country route', countryPage, 'en'],
  ['Japanese country route', jaCountryPage, 'ja'],
]) {
  requireIncludes(text, 'CountryDetailPage', label);
  requireIncludes(text, `locale="${locale}"`, label);
}
for (const phrase of [
  'This section shows currently available verified meeting records.',
  'この欄は、現在利用できる確認済み開催レコードを表示しています。',
  'No verified meeting records are currently linked to this country page.',
  'これは、この国で開催がないことを意味しません。',
]) requireIncludes(countryComponent, phrase, 'Public v1 country component');

for (const internalDiagnostic of [
  'Live fetch probe status',
  'raw_content_saved',
  'body_read',
  'generated_files_written',
  'countryLiveFetchProbes.map',
]) {
  if (publicMarkup.includes(internalDiagnostic)) {
    fail(`internal live-fetch diagnostic leaked into Public v1 rendered markup: ${internalDiagnostic}`);
  }
}

const statusText = readText('data/generated/live-fetch-probe-status.json');
for (const forbidden of ['<html', '<body', '<script', '<table']) {
  if (statusText.toLowerCase().includes(forbidden)) fail(`live fetch probe status must not contain raw HTML token ${forbidden}`);
}

if (errors.length) {
  console.error('Live fetch probe status internal-boundary check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Live fetch probe status internal-boundary check passed.');
console.log('PROBE_STATUS_DATA: retained_internal');
console.log('PUBLIC_V1_COUNTRY_UI_EXPOSURE: false');
console.log('RAW_CONTENT_STORAGE: false');
