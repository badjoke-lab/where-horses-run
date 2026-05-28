import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseSimpleFixtureHtml } from './lib/parse-simple-fixture.mjs';
import { normalizeParserOutput } from './lib/normalize-parser-output.mjs';
import {
  createSkippedFetchResult,
  createSourceFetchPlan,
  validateSourceFetchPlan
} from './lib/source-fetch-abstraction.mjs';

const root = process.cwd();
const errors = [];
const candidateSourceId = 'hong-kong-hkjc-home';

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return null;
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
  }
}

const sources = readJson('data/static/sources.json') ?? [];
const source = sources.find((item) => item.id === candidateSourceId);

if (!source) {
  fail(`${candidateSourceId}: source record not found`);
}

const sourceUrlById = Object.fromEntries(
  sources
    .filter((item) => typeof item.id === 'string' && typeof item.url === 'string')
    .map((item) => [item.id, item.url])
);

const fixtureDir = 'fixtures/parser/hong-kong-hkjc-home';
const inputPath = `${fixtureDir}/input.html`;
const expectedPath = `${fixtureDir}/expected.json`;

let parsed = null;
let expected = null;
let normalized = null;
let plan = null;
let skipped = null;

try {
  const html = readFileSync(path.join(root, inputPath), 'utf8');
  expected = readJson(expectedPath);
  parsed = parseSimpleFixtureHtml(html, { sourceUrlById });
} catch (error) {
  fail(`${fixtureDir}: ${error.message}`);
}

if (parsed && expected && !isDeepStrictEqual(parsed, expected)) {
  fail(`${fixtureDir}: parsed fixture output does not match expected.json`);
}

if (parsed) {
  normalized = normalizeParserOutput(parsed, {
    generatedAt: '2026-05-29T00:00:00Z'
  });

  requireString(normalized.generated_at, 'normalized.generated_at');
  requireString(normalized.status, 'normalized.status');
  requireArray(normalized.meetings, 'normalized.meetings');
  requireArray(normalized.sources, 'normalized.sources');
  requireArray(normalized.notes, 'normalized.notes');

  if (!normalized.sources.includes(candidateSourceId)) {
    fail(`normalized.sources: missing ${candidateSourceId}`);
  }

  if (normalized.meetings.length !== 1) {
    fail('normalized.meetings: expected one meeting');
  }
}

if (source) {
  plan = createSourceFetchPlan(source, {
    mode: 'dry_run',
    requestedAt: '2026-05-29T00:00:00Z'
  });

  const validation = validateSourceFetchPlan(plan);
  for (const error of validation.errors) {
    fail(`${candidateSourceId}: ${error}`);
  }

  if (plan.live_network_enabled !== false) {
    fail(`${candidateSourceId}: live_network_enabled must be false`);
  }

  skipped = createSkippedFetchResult(
    plan,
    'First safe source pipeline candidate uses dry-run only. Live fetching is not enabled.'
  );

  if (skipped.status !== 'skipped') {
    fail(`${candidateSourceId}: skipped result must have skipped status`);
  }

  if (skipped.raw_content_ref !== null) {
    fail(`${candidateSourceId}: raw_content_ref must be null`);
  }
}

if (errors.length) {
  console.error('Safe source pipeline candidate check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'safe_source_pipeline_candidate_ok',
  candidate_source_id: candidateSourceId,
  live_network_enabled: false,
  fixture_checked: true,
  parser_harness_checked: true,
  normalizer_checked: true,
  fetch_plan_checked: true,
  skipped_result_checked: true,
  generated_files_written: false
}, null, 2));
