import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function fail(message) {
  errors.push(message);
}

execFileSync(process.execPath, ['scripts/timetable/build-public-timetable-pipeline.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

const route = readJson('data/sources/timetable/hkjc-racecard-route.json');
const normalized = readJson('data/generated/timetable/hkjc-normalized-timetable.sample.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const publicList = readJson('data/generated/timetable/public/meeting-list.json');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');

const routeMeetings = route.meetings ?? [];
const routeIds = new Set(routeMeetings.map((meeting) => `hkjc-${meeting.racecourse_id}-${meeting.meeting_date}`));
const normalizedHkjc = (normalized.records ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const canonicalHkjc = (canonical.meetings ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const publicHkjc = (publicList.meetings ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const publicHkjcDetails = (publicDetails.details ?? []).filter((detail) => detail.authority_id === 'hkjc');

if (routeMeetings.length !== 7) fail(`Expected 7 HKJC route meetings, found ${routeMeetings.length}.`);
if (normalizedHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC normalized records, found ${normalizedHkjc.length}.`);
if (canonicalHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC canonical records, found ${canonicalHkjc.length}.`);
if (publicHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC public rows, found ${publicHkjc.length}.`);

for (const id of routeIds) {
  if (!normalizedHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC normalized record ${id}.`);
  if (!canonicalHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC canonical record ${id}.`);
  if (!publicHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC public row ${id}.`);
}

const shaTinFixture = publicHkjc.find((meeting) => meeting.meeting_id === 'hkjc-sha-tin-racecourse-2026-06-07');
if (!shaTinFixture) {
  fail('Missing expected Sha Tin 2026-06-07 public fixture.');
} else {
  if (shaTinFixture.effective_public_rank !== 'A+') fail(`Expected Sha Tin 2026-06-07 to be A+, found ${shaTinFixture.effective_public_rank}.`);
  if (!shaTinFixture.detail_path) fail('Expected Sha Tin 2026-06-07 to expose detail_path.');
}

const routeOnlyRows = publicHkjc.filter((meeting) => meeting.source_status === 'partial' || meeting.effective_public_rank === 'C');
if (routeOnlyRows.length === 0) fail('Expected at least one HKJC route-only/partial public row while snapshot coverage is incomplete.');

if (publicHkjcDetails.length < 1) fail('Expected at least one HKJC public detail row.');
if (!publicHkjcDetails.some((detail) => detail.meeting_id === 'hkjc-sha-tin-racecourse-2026-06-07')) {
  fail('Expected Sha Tin 2026-06-07 public detail row.');
}

for (const row of publicHkjc) {
  if (!row.official_source_url) fail(`HKJC public row ${row.meeting_id} missing official source URL.`);
  if (!row.policy_id) fail(`HKJC public row ${row.meeting_id} missing policy id.`);
}

if (errors.length > 0) {
  console.error('HKJC public output check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`HKJC public output check passed: ${publicHkjc.length} public rows, ${publicHkjcDetails.length} detail rows.`);
