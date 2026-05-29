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

const sources = readJson('data/static/sources.json');

const requiredSourceIds = [
  'japan-jra-home',
  'japan-nar-home',
  'japan-nar-racecourse-guide',
  'japan-banei-home',
  'japan-banei-monthly-schedule',
];

for (const sourceId of requiredSourceIds) {
  const source = sources.find((entry) => entry.id === sourceId);
  if (!source) {
    fail(`Missing source record: ${sourceId}`);
    continue;
  }

  if (source.country_id !== 'japan') {
    fail(`${sourceId}: country_id must be japan`);
  }
  if (source.source_type !== 'official') {
    fail(`${sourceId}: source_type must be official`);
  }
  if (source.data_type !== 'link_only') {
    fail(`${sourceId}: data_type must remain link_only`);
  }
  if (source.auto_level !== 'B') {
    fail(`${sourceId}: auto_level must remain B for alpha link-first records`);
  }
  if (source.m3_status !== 'alpha_link_first') {
    fail(`${sourceId}: m3_status must be alpha_link_first`);
  }
  const combinedText = `${source.notes ?? ''} ${source.m3_notes ?? ''}`.toLowerCase();
  for (const requiredPhrase of ['link-first', 'dry-run']) {
    if (!combinedText.includes(requiredPhrase)) {
      fail(`${sourceId}: notes must include ${requiredPhrase}`);
    }
  }
  for (const forbiddenTerm of ['racecards', 'entries', 'horse names', 'jockey names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (!combinedText.includes(forbiddenTerm)) {
      fail(`${sourceId}: notes must explicitly forbid ${forbiddenTerm}`);
    }
  }
  if (!combinedText.includes('live fetching requires separate source-specific review')) {
    fail(`${sourceId}: notes must state live fetching requires separate source-specific review`);
  }
}

const duplicateIds = sources
  .map((source) => source.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  fail(`Duplicate source ids found: ${[...new Set(duplicateIds)].join(', ')}`);
}

const narGuide = sources.find((entry) => entry.id === 'japan-nar-racecourse-guide');
if (narGuide?.url !== 'https://www.keiba.go.jp/guide/') {
  fail('japan-nar-racecourse-guide must use the official NAR guide URL');
}

const baneiSchedule = sources.find((entry) => entry.id === 'japan-banei-monthly-schedule');
if (baneiSchedule?.url !== 'https://www.banei-keiba.or.jp/') {
  fail('japan-banei-monthly-schedule must use the Banei Tokachi official site URL until a source-specific schedule URL is reviewed');
}

if (errors.length) {
  console.error('Japan source record split check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan source record split check passed.');
