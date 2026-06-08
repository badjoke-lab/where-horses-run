import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const forbiddenFields = [
  'starter',
  'runner',
  'horse',
  'jockey',
  'trainer',
  'odds',
  'result',
  'payout',
  'prediction',
  'tip',
  'raw_html',
  'html',
  'full_racecard_text',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function fail(message) {
  errors.push(message);
}

function hasForbiddenField(value, pathParts = []) {
  if (!value || typeof value !== 'object') return [];
  const hits = [];
  for (const [key, child] of Object.entries(value)) {
    const current = [...pathParts, key];
    if (forbiddenFields.includes(key)) hits.push(current.join('.'));
    hits.push(...hasForbiddenField(child, current));
  }
  return hits;
}

function missingAPlusFields(row) {
  const missing = [];
  if (!row.post_time_local) missing.push('post_time_local');
  if (!row.race_name) missing.push('race_name');
  if (row.distance_m == null) missing.push('distance_m');
  if (!row.surface && !row.course_label) missing.push('surface_or_course_label');
  return missing;
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
const report = readJson('data/generated/timetable/hkjc-refresh-report.json');

const routeMeetings = route.meetings ?? [];
const routeIds = new Set(routeMeetings.map((meeting) => `hkjc-${meeting.racecourse_id}-${meeting.meeting_date}`));
const normalizedHkjc = (normalized.records ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const canonicalHkjc = (canonical.meetings ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const publicHkjc = (publicList.meetings ?? []).filter((meeting) => meeting.authority_id === 'hkjc');
const publicHkjcDetails = (publicDetails.details ?? []).filter((detail) => detail.authority_id === 'hkjc');
const publicDetailById = new Map(publicHkjcDetails.map((detail) => [detail.meeting_id, detail]));
const reportRows = report.statuses ?? [];

if (routeMeetings.length < 1) fail('Expected at least one HKJC fixture meeting from the refresh route config.');
if (normalizedHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC normalized records, found ${normalizedHkjc.length}.`);
if (canonicalHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC canonical records, found ${canonicalHkjc.length}.`);
if (publicHkjc.length !== routeMeetings.length) fail(`Expected ${routeMeetings.length} HKJC public rows, found ${publicHkjc.length}.`);

for (const id of routeIds) {
  if (!normalizedHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC normalized record ${id}.`);
  if (!canonicalHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC canonical record ${id}.`);
  if (!publicHkjc.some((meeting) => meeting.meeting_id === id)) fail(`Missing HKJC public row ${id}.`);
}

for (const row of publicHkjc) {
  if (!row.official_source_url) fail(`HKJC public row ${row.meeting_id} missing official source URL.`);
  if (!row.policy_id) fail(`HKJC public row ${row.meeting_id} missing policy id.`);
  if (row.effective_public_rank === 'A+') {
    if (!row.detail_path) fail(`A+ HKJC public row ${row.meeting_id} missing detail_path.`);
    const detail = publicDetailById.get(row.meeting_id);
    if (!detail) {
      fail(`A+ HKJC public row ${row.meeting_id} missing public meeting detail.`);
      continue;
    }
    for (const [index, detailRow] of detail.timetable_rows.entries()) {
      const missing = missingAPlusFields(detailRow);
      if (missing.length > 0) fail(`A+ detail ${row.meeting_id} row ${index + 1} missing ${missing.join(', ')}.`);
    }
  }
}

for (const record of normalizedHkjc) {
  if (record.capability_rank !== 'A+') continue;
  const publicRow = publicHkjc.find((row) => row.meeting_id === record.meeting_id);
  if (publicRow?.effective_public_rank !== 'A+') fail(`Normalized A+ meeting ${record.meeting_id} is not public A+.`);
}

for (const summary of normalized.extraction_summary ?? []) {
  if ((summary.missing_a_plus_fields ?? []).length > 0) {
    const publicRow = publicHkjc.find((row) => row.meeting_id === summary.meeting_id);
    if (publicRow?.effective_public_rank === 'A+') fail(`Meeting ${summary.meeting_id} has missing A+ fields but is public A+.`);
  }
}

if (reportRows.length > 0) {
  for (const row of reportRows) {
    if (!row.meeting_date) fail('Report row missing meeting_date.');
    if (!row.racecourse_id) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing racecourse_id.`);
    if (!Object.hasOwn(row, 'race_number')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing race_number.`);
    if (!Array.isArray(row.missing_fields)) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing missing_fields array.`);
    if (!row.status) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing status.`);
  }
}

for (const [relativePath, dataset] of [
  ['data/sources/timetable/hkjc-racecard-route.json', route],
  ['data/generated/timetable/hkjc-racecard-source-snapshot.json', readJson('data/generated/timetable/hkjc-racecard-source-snapshot.json')],
  ['data/generated/timetable/hkjc-normalized-timetable.sample.json', normalized],
  ['data/generated/timetable/hkjc-normalized-meeting-details.sample.json', readJson('data/generated/timetable/hkjc-normalized-meeting-details.sample.json')],
  ['data/generated/timetable/canonical/meetings.json', canonical],
  ['data/generated/timetable/canonical/meeting-details.json', readJson('data/generated/timetable/canonical/meeting-details.json')],
  ['data/generated/timetable/public/meeting-list.json', publicList],
  ['data/generated/timetable/public/meeting-details.json', publicDetails],
]) {
  const hits = hasForbiddenField(dataset);
  if (hits.length > 0) fail(`${relativePath} contains forbidden fields: ${hits.join(', ')}.`);
}

if (errors.length > 0) {
  console.error('HKJC public output check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`HKJC public output check passed: ${publicHkjc.length} fixture-derived public rows, ${publicHkjcDetails.length} A/A+ detail rows, report rows=${reportRows.length}.`);
