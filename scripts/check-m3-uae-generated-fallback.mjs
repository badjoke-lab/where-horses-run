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

const uaeSource = sources.find((source) => source.id === 'uae-era-home');
if (!uaeSource) {
  fail('sources: uae-era-home is missing');
} else if (uaeSource.m3_status !== 'alpha_link_first') {
  fail('sources: uae-era-home should remain alpha_link_first');
}

const uaeFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'uae-era-home');
if (!uaeFetchStatus) {
  fail('fetch-status: uae-era-home is missing');
} else if (uaeFetchStatus.status !== 'skipped') {
  fail('fetch-status: uae-era-home should remain skipped');
}

requireIncludes(countryPage, 'hasAlphaCoverage', 'English country page');
requireIncludes(countryPage, 'Generated coverage fallback', 'English country page');
requireIncludes(countryPage, 'No live timetable', 'English country page');
requireIncludes(countryPage, 'Live fetching', 'English country page');
requireIncludes(countryPage, 'disabled', 'English country page');

requireIncludes(jaCountryPage, 'hasAlphaCoverage', 'Japanese country page');
requireIncludes(jaCountryPage, 'Generated coverage fallback', 'Japanese country page');
requireIncludes(jaCountryPage, 'live timetableを取得', 'Japanese country page');
requireIncludes(jaCountryPage, 'Live fetching', 'Japanese country page');
requireIncludes(jaCountryPage, 'disabled', 'Japanese country page');

if (errors.length) {
  console.error('M3 UAE generated coverage fallback check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 UAE generated coverage fallback check passed.');
