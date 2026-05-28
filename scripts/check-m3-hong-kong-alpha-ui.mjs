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
  if (!text.includes(needle)) {
    fail(`${label}: missing '${needle}'`);
  }
}

const sources = readJson('data/static/sources.json');
const fetchStatus = readJson('data/generated/fetch-status.json');
const countryPage = readText('src/pages/countries/[slug].astro');
const jaCountryPage = readText('src/pages/ja/countries/[slug].astro');

const hongKongSource = sources.find((source) => source.id === 'hong-kong-hkjc-home');
if (!hongKongSource) {
  fail('sources: hong-kong-hkjc-home is missing');
} else {
  requireIncludes(hongKongSource.notes ?? '', 'Link-first and dry-run only', 'hong-kong source notes');
  requireIncludes(hongKongSource.notes ?? '', 'Do not republish racecards', 'hong-kong source notes');
  if (hongKongSource.m3_status !== 'alpha_link_first') {
    fail('hong-kong source m3_status: expected alpha_link_first');
  }
}

const hongKongFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'hong-kong-hkjc-home');
if (!hongKongFetchStatus) {
  fail('fetch-status: hong-kong-hkjc-home is missing');
} else {
  if (hongKongFetchStatus.status !== 'skipped') {
    fail('fetch-status: hong-kong-hkjc-home should remain skipped');
  }
  requireIncludes(hongKongFetchStatus.message ?? '', 'Live fetching is not enabled', 'hong-kong FetchStatus message');
}

for (const [label, text] of [
  ['English country page', countryPage],
  ['Japanese country page', jaCountryPage]
]) {
  requireIncludes(text, 'Alpha timetable coverage', label);
  requireIncludes(text, 'FetchStatus coverage', label);
  requireIncludes(text, 'Live fetching', label);
  requireIncludes(text, 'disabled', label);
}

if (errors.length) {
  console.error('M3 Hong Kong alpha UI verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 Hong Kong alpha UI verification passed.');
