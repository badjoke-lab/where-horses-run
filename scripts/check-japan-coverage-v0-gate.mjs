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

const gate = readJson('data/generated/japan-coverage-v0-gate.json');
const jra = readJson('data/candidates/japan-jra-candidates.json');
const nar = readJson('data/candidates/japan-nar-candidates.json');
const banei = readJson('data/candidates/japan-banei-candidates.json');

if (gate.schema_version !== 'japan-coverage-v0-gate-v0') fail('bad schema_version');
if (gate.country_id !== 'japan') fail('country_id must be japan');
if (gate.status !== 'v0_gate_partial_pass') fail('status must be v0_gate_partial_pass');
if (!gate.v0_gate?.decision?.includes('Do not claim full Japan coverage.')) fail('decision must explicitly avoid full Japan coverage claims');

const expectedTotal = (jra.records ?? []).length + (nar.records ?? []).length + (banei.records ?? []).length;
if (gate.coverage_summary?.total_active_window_records !== expectedTotal) {
  fail(`total_active_window_records must be ${expectedTotal}`);
}

const systemMap = new Map((gate.coverage_summary?.systems ?? []).map((system) => [system.racing_system_id, system]));
for (const [systemId, expectedRecords] of [
  ['jra', (jra.records ?? []).length],
  ['nar', (nar.records ?? []).length],
  ['banei', (banei.records ?? []).length]
]) {
  const system = systemMap.get(systemId);
  if (!system) fail(`missing system ${systemId}`);
  if (system?.records !== expectedRecords) fail(`${systemId} records must be ${expectedRecords}`);
}

for (const requiredPass of [
  'Japan active-window data has JRA, NAR, and Banei represented.',
  'Japan active-window candidate generation exists for JRA, NAR, and Banei.',
  'A reviewed candidate bundle path exists with 19 records.',
  'A candidate-to-overlay promotion script exists and only promotes approved records.'
]) {
  if (!(gate.v0_gate?.passes ?? []).includes(requiredPass)) fail(`missing pass: ${requiredPass}`);
}

for (const requiredPending of [
  'Japan is not full-country coverage yet.',
  'NAR exact first start times are not stored for the seeded NAR records.',
  'Live fetch and parser-based automatic candidate discovery are not enabled for Japan.',
  'The approved bundle is not yet wired as the public overlay replacement.'
]) {
  if (!(gate.v0_gate?.fails_or_pending ?? []).includes(requiredPending)) fail(`missing pending item: ${requiredPending}`);
}

for (const key of ['country_page', 'calendar_page', 'today_tomorrow_pages', 'disclosure']) {
  if (!gate.user_facing_behavior?.[key]) fail(`missing user_facing_behavior.${key}`);
}

const serialized = JSON.stringify(gate).toLowerCase();
for (const forbiddenClaim of ['complete japan coverage', 'full production coverage', 'all japan racecourses covered']) {
  if (serialized.includes(forbiddenClaim)) fail(`forbidden claim found: ${forbiddenClaim}`);
}

if (errors.length) {
  console.error('Japan coverage v0 gate check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan coverage v0 gate check passed.');
