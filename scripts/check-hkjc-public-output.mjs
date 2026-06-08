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

const hvId = 'hkjc-happy-valley-racecourse-2026-06-10';
const hvPublic = publicHkjc.find((meeting) => meeting.meeting_id === hvId);
if (!hvPublic) {
  fail(`Missing required HKJC smoke/public validation row ${hvId}.`);
} else {
  if (hvPublic.effective_public_rank !== 'A+') fail(`${hvId} must be public A+, found ${hvPublic.effective_public_rank}.`);
  if (hvPublic.first_race_time_local !== '18:40') fail(`${hvId} first_race_time_local must be 18:40, found ${hvPublic.first_race_time_local}.`);
  if (hvPublic.last_race_time_local !== '22:50') fail(`${hvId} last_race_time_local must be 22:50, found ${hvPublic.last_race_time_local}.`);
  if (!hvPublic.detail_path) fail(`${hvId} must expose detail_path.`);
}

const hvDetail = publicDetailById.get(hvId);
if (!hvDetail) {
  fail(`Missing required HKJC public meeting detail ${hvId}.`);
} else {
  if ((hvDetail.timetable_rows ?? []).length !== 9) fail(`${hvId} must have 9 public detail race rows, found ${hvDetail.timetable_rows?.length ?? 0}.`);
  const first = hvDetail.timetable_rows?.[0];
  if (!first) {
    fail(`${hvId} missing Race 1 detail row.`);
  } else {
    if (first.label !== 'Race 1') fail(`${hvId} Race 1 label mismatch: ${first.label}.`);
    if (first.post_time_local !== '18:40') fail(`${hvId} Race 1 post_time_local must be 18:40, found ${first.post_time_local}.`);
    if (first.race_name !== 'CHEK LAP KOK HANDICAP') fail(`${hvId} Race 1 race_name mismatch: ${first.race_name}.`);
    if (first.distance_m !== 1800) fail(`${hvId} Race 1 distance_m must be 1800, found ${first.distance_m}.`);
    if (first.surface !== 'Turf') fail(`${hvId} Race 1 surface must be Turf, found ${first.surface}.`);
    if (first.course_label !== 'C+3 Course') fail(`${hvId} Race 1 course_label must be C+3 Course, found ${first.course_label}.`);
  }
}

if (!reportRows.some((row) => row.meeting_date === '2026-06-10'
  && row.racecourse_id === 'happy-valley-racecourse'
  && row.race_number === 10
  && row.status === 'no_race_stop_candidate')) {
  fail('Expected 2026-06-10 Happy Valley Race 10 to be reported as no_race_stop_candidate.');
}

for (const key of ['pending_meetings', 'missing_meetings', 'parser_failed_meetings', 'a_plus_ready_meetings']) {
  if (!Array.isArray(report[key])) fail(`Report missing ${key} array.`);
}

for (const row of reportRows) {
  if (!row.meeting_date) fail('Report row missing meeting_date.');
  if (!row.racecourse_id) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing racecourse_id.`);
  if (!row.racecourse_code) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing racecourse_code.`);
  if (!Object.hasOwn(row, 'race_number')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing race_number.`);
  if (!Object.hasOwn(row, 'http_status')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing http_status.`);
  if (!Object.hasOwn(row, 'final_url')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing final_url.`);
  if (!Object.hasOwn(row, 'content_type')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing content_type.`);
  if (!Object.hasOwn(row, 'body_size')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing body_size.`);
  if (!Object.hasOwn(row, 'failure_status')) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing failure_status.`);
  if (!Array.isArray(row.missing_fields)) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing missing_fields array.`);
  if (!row.status) fail(`Report row for ${row.meeting_date ?? 'unknown'} missing status.`);
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
