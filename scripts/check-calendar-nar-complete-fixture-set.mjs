import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowEmpty = process.argv.includes('--allow-empty');
const fixtureDir = path.join(root, 'data/fixtures/timetable/nar/complete-meetings');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json'), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

const files = fs.existsSync(fixtureDir)
  ? fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.json')).sort()
  : [];

if (files.length === 0 && allowEmpty) {
  console.log('CALENDAR_NAR_COMPLETE_FIXTURE_SET: empty-allowed');
  process.exit(0);
}
if (files.length !== 14) fail(`expected 14 complete-meeting fixtures, found ${files.length}.`);

const matrixByRacecourse = new Map(matrix.records.map((record) => [record.racecourse_id, record]));
const seenRacecourses = new Set();
const forbiddenFragments = [
  'horse', 'runner', 'jockey', 'trainer', 'odds', 'result', 'payout', 'prediction',
  'raw_html', 'source_body', 'body_weight', 'draw', 'gate', 'stream',
];
const rowKeys = new Set([
  'race_number', 'label', 'post_time_local', 'race_name', 'distance_m',
  'surface', 'course_label', 'source_trace',
]);
const traceKeys = new Set([
  'list_url', 'detail_url', 'detail_http_status', 'detail_encoding', 'detail_parsed', 'course_metadata_source',
]);
const validMetadataSources = new Set(['deba_table', 'race_list_and_racecourse_matrix']);

function inspectForbidden(value, location = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectForbidden(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const match = forbiddenFragments.find((fragment) => lower.includes(fragment));
    if (match) fail(`${location}.${key} contains forbidden key fragment ${match}.`);
    inspectForbidden(child, `${location}.${key}`);
  }
}

for (const file of files) {
  const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
  const prefix = `${file}:`;
  if (fixture.schema_version !== 'nar-complete-meeting-fixture-v1') fail(`${prefix} unexpected schema.`);
  if (fixture.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail(`${prefix} Work ID differs.`);
  if (fixture.country_id !== 'japan') fail(`${prefix} country differs.`);
  if (fixture.authority_id !== 'nar-local-government-racing') fail(`${prefix} authority differs.`);
  if (fixture.racing_system_id !== 'japan-nar-system') fail(`${prefix} system differs.`);
  if (fixture.timezone !== 'Asia/Tokyo') fail(`${prefix} timezone differs.`);

  const matrixRecord = matrixByRacecourse.get(fixture.racecourse_id);
  if (!matrixRecord) {
    fail(`${prefix} racecourse is not in the all-14 matrix.`);
    continue;
  }
  if (seenRacecourses.has(fixture.racecourse_id)) fail(`${prefix} duplicate racecourse fixture.`);
  seenRacecourses.add(fixture.racecourse_id);
  if (fixture.venue_code !== matrixRecord.venue_code) fail(`${prefix} venue code differs from matrix.`);
  if (fixture.date !== matrixRecord.official_race_list_date) fail(`${prefix} date differs from matrix.`);
  if (fixture.source?.official_race_list_url !== matrixRecord.official_race_list_url) fail(`${prefix} source URL differs from matrix.`);
  if (fixture.source?.storage_policy !== 'public_safe_extracted_fields_only_no_raw_html') fail(`${prefix} storage policy differs.`);
  if (fixture.source?.list_http_status !== 200) fail(`${prefix} list HTTP status must be 200.`);
  if (!['utf-8', 'shift_jis'].includes(fixture.source?.list_encoding)) fail(`${prefix} list encoding differs.`);
  if (fixture.review?.status !== 'needs_review' || fixture.review?.promotion_eligible !== false) fail(`${prefix} fixture must remain non-promotable and needs_review.`);

  const rows = fixture.timetable_rows ?? [];
  const completeness = fixture.meeting_completeness ?? {};
  const expected = completeness.expected_race_numbers ?? [];
  if (rows.length < 2) fail(`${prefix} fewer than two races.`);
  if (completeness.expected_race_count !== expected.length) fail(`${prefix} expected count differs from expected number list.`);
  if (completeness.observed_race_count !== rows.length) fail(`${prefix} observed count differs from rows.`);
  if (expected.length !== rows.length) fail(`${prefix} expected and observed race counts differ.`);
  if (completeness.continuous_race_numbers !== true) fail(`${prefix} continuous flag must be true.`);
  if (completeness.all_a_plus_fields_complete !== true) fail(`${prefix} A+ completeness flag must be true.`);

  expected.forEach((value, index) => {
    if (value !== index + 1) fail(`${prefix} expected race numbers are not continuous from one.`);
  });

  let previousMinutes = -1;
  rows.forEach((row, index) => {
    const raceNumber = index + 1;
    if (row.race_number !== raceNumber) fail(`${prefix} row ${index + 1} race number differs.`);
    if (row.label !== `Race ${raceNumber}`) fail(`${prefix} row ${index + 1} label differs.`);
    for (const key of Object.keys(row)) if (!rowKeys.has(key)) fail(`${prefix} row ${index + 1} unexpected key ${key}.`);
    for (const key of ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      if (!(key in row) || row[key] === null || row[key] === '') fail(`${prefix} row ${index + 1} missing ${key}.`);
    }
    const time = String(row.post_time_local).match(/^(\d{2}):(\d{2})$/);
    if (!time) fail(`${prefix} row ${index + 1} time format differs.`);
    else {
      const minutes = Number(time[1]) * 60 + Number(time[2]);
      if (minutes <= previousMinutes) fail(`${prefix} row ${index + 1} time does not increase.`);
      previousMinutes = minutes;
    }
    if (!Number.isInteger(row.distance_m) || row.distance_m < 600 || row.distance_m > 6000) fail(`${prefix} row ${index + 1} distance is invalid.`);
    if (!['Dirt', 'Turf'].includes(row.surface)) fail(`${prefix} row ${index + 1} surface differs.`);
    if (!String(row.course_label).startsWith(`${row.surface} Course`)) fail(`${prefix} row ${index + 1} course label differs.`);
    if (fixture.racecourse_id !== 'morioka-racecourse' && row.surface === 'Turf') fail(`${prefix} non-Morioka fixture claims turf.`);
    if (!row.source_trace || typeof row.source_trace !== 'object') fail(`${prefix} row ${index + 1} source trace is missing.`);
    else {
      for (const key of Object.keys(row.source_trace)) if (!traceKeys.has(key)) fail(`${prefix} row ${index + 1} trace unexpected key ${key}.`);
      if (row.source_trace.list_url !== fixture.source.official_race_list_url) fail(`${prefix} row ${index + 1} list trace differs.`);
      if (!row.source_trace.detail_url?.includes(`k_raceNo=${raceNumber}`)) fail(`${prefix} row ${index + 1} detail trace differs.`);
      if (row.source_trace.detail_http_status !== 200) fail(`${prefix} row ${index + 1} detail was not fetched.`);
      if (!validMetadataSources.has(row.source_trace.course_metadata_source)) fail(`${prefix} row ${index + 1} metadata source differs.`);
      if (row.source_trace.course_metadata_source === 'deba_table' && row.source_trace.detail_parsed !== true) fail(`${prefix} row ${index + 1} DebaTable metadata was not parsed.`);
      if (row.source_trace.course_metadata_source === 'race_list_and_racecourse_matrix') {
        if (row.source_trace.detail_parsed !== false) fail(`${prefix} row ${index + 1} fallback must record detail_parsed=false.`);
        if (matrixRecord.surfaces?.length !== 1 || !matrixRecord.surfaces.includes('dirt')) fail(`${prefix} row ${index + 1} fallback is only allowed for single-surface dirt racecourses.`);
        if (!['left', 'right'].includes(matrixRecord.course_direction)) fail(`${prefix} row ${index + 1} fallback requires fixed direction.`);
        if (row.surface !== 'Dirt') fail(`${prefix} row ${index + 1} fallback must resolve to Dirt.`);
      }
    }
  });

  inspectForbidden(fixture, file);
}

for (const record of matrix.records) {
  if (!seenRacecourses.has(record.racecourse_id)) fail(`missing complete fixture for ${record.racecourse_id}.`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_COMPLETE_FIXTURE_SET: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_COMPLETE_FIXTURE_SET: pass');
console.log(`RACECOURSE_FIXTURES: ${files.length}`);
console.log('PROMOTION_ELIGIBLE: 0');
console.log('PUBLICATION_EFFECT: none');
