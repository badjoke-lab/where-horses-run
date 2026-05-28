import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function requireIncludes(text, needle, label) {
  if (!String(text ?? '').includes(needle)) {
    fail(`${label}: missing '${needle}'`);
  }
}

const sources = readJson('data/static/sources.json');
const countries = readJson('data/static/countries.json');
const fetchStatus = readJson('data/generated/fetch-status.json');

const uaeCountry = countries.find((country) => country.id === 'united-arab-emirates');
if (!uaeCountry) {
  fail('countries: united-arab-emirates is missing');
} else {
  if (uaeCountry.coverage_level < 3) {
    fail('countries: UAE coverage_level should remain alpha-ready level 3');
  }
}

const uaeSource = sources.find((source) => source.id === 'uae-era-home');
if (!uaeSource) {
  fail('sources: uae-era-home is missing');
} else {
  if (uaeSource.country_id !== 'united-arab-emirates') {
    fail('uae-era-home.country_id: expected united-arab-emirates');
  }
  if (uaeSource.source_type !== 'official') {
    fail('uae-era-home.source_type: expected official');
  }
  if (uaeSource.data_type !== 'link_only') {
    fail('uae-era-home.data_type: expected link_only');
  }
  if (uaeSource.m3_status !== 'alpha_link_first') {
    fail('uae-era-home.m3_status: expected alpha_link_first');
  }

  requireIncludes(uaeSource.notes, 'Link-first and dry-run only', 'uae source notes');
  requireIncludes(uaeSource.notes, 'Do not republish racecards', 'uae source notes');
  requireIncludes(uaeSource.notes, 'Live fetching requires separate source-specific review', 'uae source notes');
}

const uaeFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'uae-era-home');
if (!uaeFetchStatus) {
  fail('fetch-status: uae-era-home is missing');
} else {
  if (uaeFetchStatus.status !== 'skipped') {
    fail('fetch-status: uae-era-home should remain skipped');
  }
  requireIncludes(uaeFetchStatus.message, 'Live fetching is not enabled', 'uae FetchStatus message');
}

if (errors.length) {
  console.error('M3 UAE alpha source records check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 UAE alpha source records check passed.');
