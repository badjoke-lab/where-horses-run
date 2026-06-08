import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

const route = readJson('data/sources/timetable/hkjc-racecard-route.json');
const normalizer = read('scripts/timetable/normalize-hkjc-racecards.mjs');
const notes = read('PR-269.md');

if ((route.meetings ?? []).length !== 7) {
  errors.push(`HKJC June route must contain 7 meetings, found ${(route.meetings ?? []).length}.`);
}

for (const token of [
  'const configPath',
  'snapshotMeetingByKey',
  'config.meetings.map',
  'route_config_only',
  'route_meeting_count: config.meetings.length',
  'snapshot_observation_count',
  'snapshot_observation_present',
  'HKJC route config includes this meeting',
]) {
  requireText(normalizer, token, 'HKJC normalizer');
}

for (const token of [
  'HKJC normalizer now uses the route config as the full June meeting set.',
  'Snapshot-missing meetings are kept as C records instead of disappearing.',
  'No country page is changed.',
  'No racecourse page is changed.',
  'Next step is canonical/public integration of the full HKJC normalized record set.',
]) {
  requireText(notes, token, 'PR note');
}

if (errors.length > 0) {
  console.error('HKJC full route normalizer check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('HKJC full route normalizer check passed.');
