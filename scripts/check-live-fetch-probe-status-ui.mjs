import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireIncludes(text, needle, label) {
  if (!String(text ?? '').includes(needle)) {
    fail(`${label}: missing '${needle}'`);
  }
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

const probeStatus = readJson('data/generated/live-fetch-probe-status.json');
const dataTs = readText('src/lib/data.ts');
const countryPage = readText('src/pages/countries/[slug].astro');
const jaCountryPage = readText('src/pages/ja/countries/[slug].astro');

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

for (const [label, text] of [
  ['English country page', countryPage],
  ['Japanese country page', jaCountryPage]
]) {
  requireIncludes(text, 'countryLiveFetchProbes', label);
  requireIncludes(text, 'Live fetch probe status', label);
  requireIncludes(text, 'raw_content_saved', label);
  requireIncludes(text, 'body_read', label);
  requireIncludes(text, 'generated_files_written', label);
}

const statusText = readText('data/generated/live-fetch-probe-status.json');
for (const forbidden of ['<html', '<body', '<script', '<table']) {
  if (statusText.toLowerCase().includes(forbidden)) {
    fail(`live fetch probe status must not contain raw HTML token ${forbidden}`);
  }
}

if (errors.length) {
  console.error('Live fetch probe status UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Live fetch probe status UI check passed.');
