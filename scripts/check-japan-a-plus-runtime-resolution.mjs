import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  resolveAuthoritySourceInventory,
  resolveCalendarReadinessRegistry,
  resolveCalendarReadinessRegistryForProjection
} from './timetable/pipeline-v1/registry-overrides.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const parse = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

const baseReadiness = parse('data/static/calendar-readiness-registry.json');
const japanReadiness = parse('data/static/calendar-readiness-japan-v2.json');
const runtimeControl = parse('data/static/japan-a-plus-runtime-control.json');
const baseSources = parse('data/static/authority-source-inventory.json');
const japanSources = parse('data/static/authority-source-inventory-japan-v2.json');

let resolvedReadiness;
let projectionReadiness;
let resolvedSources;
try {
  resolvedReadiness = resolveCalendarReadinessRegistry(baseReadiness, japanReadiness, runtimeControl);
  projectionReadiness = resolveCalendarReadinessRegistryForProjection(baseReadiness, japanReadiness, runtimeControl);
  resolvedSources = resolveAuthoritySourceInventory(baseSources, japanSources);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const expected = [
  ['japan-jra-system', 'japan/jra/jra-programme', 'active'],
  ['japan-nar-system', 'japan/nar-local-government-racing/nar-monthly-convene-info', 'pending_pilot'],
  ['japan-banei-system', 'japan/banei-tokachi/banei-official-schedule', 'pending_pilot']
];

for (const [systemId, key, activation] of expected) {
  const records = resolvedReadiness?.records?.filter((record) => record.system_id === systemId && record.authority_source_key === key) ?? [];
  if (records.length !== 1) {
    fail(`${systemId} must resolve to exactly one readiness record`);
    continue;
  }
  const record = records[0];
  if (record.technical_rank !== 'A+' || record.public_ceiling !== 'A+') fail(`${systemId} must resolve as A+/A+`);
  if (record.readiness !== 'prototype_ready' || record.implementation_status !== 'prototype') fail(`${systemId} readiness state changed`);
  if (record.automation_mode !== 'semi_automatic') fail(`${systemId} canonical automation mode must remain semi_automatic`);
  if (record.public_projection_activation !== activation) fail(`${systemId} activation must be ${activation}`);
  for (const field of ['meeting_date', 'racecourse', 'first_race_time', 'last_race_time', 'per_race_post_times', 'race_name', 'distance', 'surface', 'course']) {
    if (record.confirmed_fields?.[field] !== true) fail(`${systemId} missing confirmed field ${field}`);
  }

  const projection = projectionReadiness?.records?.find((candidate) => candidate.system_id === systemId && candidate.authority_source_key === key);
  if (!projection) fail(`${systemId} projection readiness is missing`);
  else if (activation === 'active' && projection.automation_mode !== 'semi_automatic') fail(`${systemId} active projection mode changed`);
  else if (activation === 'pending_pilot' && projection.automation_mode !== 'link_only') fail(`${systemId} pending pilot must resolve to a non-public projection mode`);

  const source = resolvedSources?.records?.find((candidate) => `${candidate.country_id}/${candidate.authority_id}/${candidate.official_source_id}` === key);
  if (!source || source.capability_rank !== 'A+') fail(`${systemId} authority/source capability must resolve to A+`);
}

if (runtimeControl?.records?.length !== 3) fail('runtime control must contain exactly three Japan systems');
if (runtimeControl?.records?.filter((record) => record.public_projection_activation === 'active').length !== 1) fail('exactly one Japan system must be active for public projection');
if (runtimeControl?.records?.filter((record) => record.public_projection_activation === 'pending_pilot').length !== 2) fail('exactly two Japan systems must remain pending pilot');

if (errors.length) {
  console.error(`JAPAN_A_PLUS_RUNTIME_RESOLUTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JAPAN_A_PLUS_RUNTIME_RESOLUTION: pass');
console.log('JRA_PUBLIC_PROJECTION: active');
console.log('NAR_PUBLIC_PROJECTION: pending_pilot');
console.log('BANEI_PUBLIC_PROJECTION: pending_pilot');
console.log('UNATTENDED_PUBLICATION: disabled');
