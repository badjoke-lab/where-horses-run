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

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label}: expected non-empty string`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label}: expected array`);
}

function validateSkippedResult(result, label) {
  for (const key of ['source_id', 'country_id', 'status', 'checked_at', 'source_url', 'message']) {
    requireString(result?.[key], `${label}.${key}`);
  }

  if (result?.status !== 'skipped') fail(`${label}.status: expected skipped`);
  if (result?.raw_content_ref !== null) fail(`${label}.raw_content_ref: expected null`);
  requireArray(result?.warnings, `${label}.warnings`);
  requireArray(result?.errors, `${label}.errors`);
}

const sources = readJson('data/static/sources.json');

if (!Array.isArray(sources) || sources.length === 0) {
  fail('data/static/sources.json: expected at least one source');
}

const plans = createSourceFetchPlans(sources, {
  mode: 'dry_run',
  requestedAt: '2026-05-29T00:00:00Z'
});

if (plans.length !== (sources?.length ?? 0)) {
  fail('source fetch plans: expected one plan per source');
}

for (const [index, plan] of plans.entries()) {
  const label = `sourceFetchPlans[${index}]`;
  const result = validateSourceFetchPlan(plan);

  for (const error of result.errors) fail(`${label}: ${error}`);
  if (plan.live_network_enabled !== false) fail(`${label}.live_network_enabled: expected false`);

  validateSkippedResult(createSkippedFetchResult(plan), `${label}.skippedResult`);
}

if (errors.length) {
  console.error('Source fetch abstraction check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Source fetch abstraction check passed for ${plans.length} source plan(s).`);
