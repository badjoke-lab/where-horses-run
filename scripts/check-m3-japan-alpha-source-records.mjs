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

const japanCountry = countries.find((country) => country.id === 'japan');
if (!japanCountry) {
  fail('countries: japan is missing');
} else {
  if (japanCountry.coverage_level < 3) {
    fail('countries: Japan coverage_level should remain alpha-ready level 3');
  }
}

const japanSource = sources.find((source) => source.id === 'japan-jra-home');
if (!japanSource) {
  fail('sources: japan-jra-home is missing');
} else {
  if (japanSource.country_id !== 'japan') {
    fail('japan-jra-home.country_id: expected japan');
  }
  if (japanSource.source_type !== 'official') {
    fail('japan-jra-home.source_type: expected official');
  }
  if (japanSource.data_type !== 'link_only') {
    fail('japan-jra-home.data_type: expected link_only');
  }
  if (japanSource.m3_status !== 'alpha_link_first') {
    fail('japan-jra-home.m3_status: expected alpha_link_first');
  }

  requireIncludes(japanSource.notes, 'Link-first and dry-run only', 'japan source notes');
  requireIncludes(japanSource.notes, 'Do not republish racecards', 'japan source notes');
  requireIncludes(japanSource.notes, 'Live fetching requires separate source-specific review', 'japan source notes');
}

const japanFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'japan-jra-home');
if (!japanFetchStatus) {
  fail('fetch-status: japan-jra-home is missing');
} else {
  if (japanFetchStatus.status !== 'skipped') {
    fail('fetch-status: japan-jra-home should remain skipped');
  }
  requireIncludes(japanFetchStatus.message, 'Live fetching is not enabled', 'japan FetchStatus message');
}

if (errors.length) {
  console.error('M3 Japan alpha source records check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 Japan alpha source records check passed.');
