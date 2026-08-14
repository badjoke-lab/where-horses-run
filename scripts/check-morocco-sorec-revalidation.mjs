import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = 'docs/timetable-source-tests/04-morocco/revalidation-2026-08-14.json';
const pendingPath = 'docs/timetable-source-tests/04-morocco/pending-summary.json';
const inventoryPath = 'data/static/authority-source-inventory.json';
const errors = [];

const expectedRacecourses = [
  'Casablanca-Anfa',
  'Meknès',
  'Marrakech',
  'Rabat',
  'Settat',
  'El Jadida',
  'Khemisset',
];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return {};
  }
}

function sameStringSet(actual, expected, label) {
  if (!Array.isArray(actual)) {
    fail(`${label} must be an array`);
    return;
  }
  const a = [...actual].sort((x, y) => x.localeCompare(y, 'en'));
  const e = [...expected].sort((x, y) => x.localeCompare(y, 'en'));
  if (JSON.stringify(a) !== JSON.stringify(e)) fail(`${label} must match the seven revalidated SOREC racecourses`);
}

const evidence = readJson(evidencePath);
const pending = readJson(pendingPath);
const inventory = readJson(inventoryPath);

if (evidence.schema_version !== 'sorec-source-revalidation-v1') fail('evidence schema_version must be sorec-source-revalidation-v1');
if (evidence.checked_date !== '2026-08-14') fail('evidence checked_date must be 2026-08-14');
if (evidence.authority_id !== 'sorec') fail('evidence authority_id must be sorec');
if (evidence.status !== 'blocked_no_public_timetable_source') fail('SOREC evidence must remain blocked without a public timetable source');
if (evidence.technical_capability_rank !== 'not_confirmed') fail('SOREC technical rank must remain unconfirmed');
if (evidence.official_sources?.homepage !== 'https://www.sorec.ma/') fail('SOREC homepage evidence changed unexpectedly');
if (evidence.official_sources?.current_racing_page !== 'https://www.sorec.ma/courses-hippiques/') fail('SOREC current racing page evidence changed unexpectedly');
if (evidence.current_observation?.racecourse_count !== 7) fail('SOREC racecourse_count must be 7');
sameStringSet(evidence.current_observation?.racecourses, expectedRacecourses, 'evidence.current_observation.racecourses');
for (const key of [
  'public_meeting_programme_route_verified',
  'meeting_date_racecourse_pairing_verified',
  'complete_race_1_n_post_times_verified',
]) {
  if (evidence.current_observation?.[key] !== false) fail(`evidence.current_observation.${key} must remain false`);
}
if (evidence.decision?.adapter_status !== 'blocked') fail('evidence decision.adapter_status must be blocked');
for (const key of ['candidate_generation', 'automatic_approval', 'canonical_write', 'public_projection_write', 'rank_change']) {
  if (evidence.decision?.[key] !== false) fail(`evidence.decision.${key} must be false`);
}

if (pending.status !== 'pending_blocked') fail('pending summary status must be pending_blocked');
if (pending.checked_date !== evidence.checked_date) fail('pending summary checked_date must match revalidation evidence');
if (pending.current_official_racing_page !== evidence.official_sources?.current_racing_page) fail('pending summary current official page must match evidence');
if (pending.confirmed?.official_racecourses_documented !== 7) fail('pending summary must document seven racecourses');
sameStringSet(pending.confirmed?.racecourses, expectedRacecourses, 'pending.confirmed.racecourses');
if (pending.confirmed?.public_meeting_programme_route_verified !== false) fail('pending summary must not claim a public meeting programme route');
if (pending.confirmed?.current_or_future_candidate_generated !== false) fail('pending summary must not claim generated current/future candidates');
if (pending.decision?.adapter_status !== 'blocked') fail('pending summary adapter_status must be blocked');
for (const key of ['candidate_generation', 'automatic_approval', 'canonical_write', 'public_projection_write', 'rank_change']) {
  if (pending.decision?.[key] !== false) fail(`pending.decision.${key} must be false`);
}

const sorec = (inventory.records ?? []).find((record) => record.country_id === 'morocco' && record.authority_id === 'sorec');
if (!sorec) {
  fail('authority source inventory must retain a Morocco/SOREC record');
} else {
  if (sorec.adapter_candidate_status !== 'blocked') fail('authority source inventory must keep SOREC adapter_candidate_status blocked');
  if (sorec.source_kind !== 'official_link') fail('authority source inventory must keep SOREC as an institutional official_link until a timetable source is verified');
  if (sorec.capability_rank !== 'C') fail('authority source inventory capability_rank must remain the C schema floor until a supported rank is reviewed');
  if (sorec.source_status === 'verified') fail('authority source inventory must not mark the SOREC timetable source verified while the revalidation is blocked');
}

if (errors.length) {
  console.error(`Morocco/SOREC revalidation check failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Morocco/SOREC revalidation check passed.');
console.log(`- checked date: ${evidence.checked_date}`);
console.log(`- racecourses: ${expectedRacecourses.length}`);
console.log('- public timetable route: not verified');
console.log('- adapter/candidate generation: blocked');
