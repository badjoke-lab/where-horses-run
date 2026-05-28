import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  createSkippedFetchResult,
  createSourceFetchPlans,
  validateSourceFetchPlan
} from './lib/source-fetch-abstraction.mjs';

const root = process.cwd();
const errors = [];

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

const sources = readJson('data/static/sources.json') ?? [];
const plans = createSourceFetchPlans(sources, {
  mode: 'dry_run',
  requestedAt: '2026-05-29T00:00:00Z'
});

const skippedResults = plans.map((plan) => {
  const validation = validateSourceFetchPlan(plan);
  for (const error of validation.errors) {
    fail(`${plan.source_id}: ${error}`);
  }

  const result = createSkippedFetchResult(plan, 'Generated update dry-run only. Live fetching is not enabled.');

  if (result.status !== 'skipped') fail(`${plan.source_id}: expected skipped status`);
  if (result.raw_content_ref !== null) fail(`${plan.source_id}: raw_content_ref must be null`);
  if (plan.live_network_enabled !== false) fail(`${plan.source_id}: live_network_enabled must be false`);

  return result;
});

if (sources.length === 0) {
  fail('data/static/sources.json: expected at least one source');
}

if (plans.length !== sources.length) {
  fail('dry-run plans: expected one plan per source');
}

if (errors.length) {
  console.error('Generated update dry-run failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'dry_run_ok',
  live_network_enabled: false,
  source_count: sources.length,
  skipped_count: skippedResults.length,
  generated_files_written: false
}, null, 2));
