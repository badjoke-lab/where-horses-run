import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const parse = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const overrides = parse('data/generated/timetable/public/japan-a-plus-overrides.json');
const baseList = parse('data/generated/timetable/public/meeting-list.json');
const baseDetails = parse('data/generated/timetable/public/meeting-details.json');

const check = spawnSync(process.execPath, ['scripts/timetable/build-japan-a-plus-public-overrides.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});
if (check.status !== 0) fail(`override generator check failed: ${check.stderr || check.stdout}`);

if (overrides.schema_version !== 'japan-a-plus-public-overrides-v1') fail('unexpected Japan A+ public override schema.');
if (overrides.generated_at !== baseList.generated_at || overrides.generated_at !== baseDetails.generated_at) fail('override generated_at must match base public datasets.');
if (overrides.meeting_overrides?.length !== 8) fail('eight JRA meeting overrides are required.');
if (overrides.detail_overrides?.length !== 4) fail('four JRA detail overrides are required.');

const baseMeetingIds = new Set(baseList.meetings.map((meeting) => meeting.meeting_id));
const baseDetailIds = new Set(baseDetails.details.map((detail) => detail.meeting_id));
const seenMeetings = new Set();
for (const meeting of overrides.meeting_overrides ?? []) {
  if (seenMeetings.has(meeting.meeting_id)) fail(`duplicate meeting override ${meeting.meeting_id}`);
  seenMeetings.add(meeting.meeting_id);
  if (!meeting.meeting_id.startsWith('jra-')) fail(`non-JRA meeting override ${meeting.meeting_id}`);
  if (!baseMeetingIds.has(meeting.meeting_id)) fail(`meeting override has no base public row ${meeting.meeting_id}`);
  if (meeting.max_public_rank !== 'A+') fail(`${meeting.meeting_id} max public rank must be A+`);
  if (!['B', 'A+'].includes(meeting.effective_public_rank)) fail(`${meeting.meeting_id} effective rank is invalid`);
}
if ([...(overrides.meeting_overrides ?? [])].filter((meeting) => meeting.effective_public_rank === 'A+').length !== 4) fail('four reviewed JRA meetings must project at A+.');

const seenDetails = new Set();
let rowCount = 0;
for (const detail of overrides.detail_overrides ?? []) {
  if (seenDetails.has(detail.meeting_id)) fail(`duplicate detail override ${detail.meeting_id}`);
  seenDetails.add(detail.meeting_id);
  if (!detail.meeting_id.startsWith('jra-')) fail(`non-JRA detail override ${detail.meeting_id}`);
  if (!baseDetailIds.has(detail.meeting_id)) fail(`detail override has no base public detail ${detail.meeting_id}`);
  if (detail.max_public_rank !== 'A+' || detail.effective_public_rank !== 'A+') fail(`${detail.meeting_id} detail must project at A+/A+`);
  for (const key of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
    if (detail[key] !== true) fail(`${detail.meeting_id} ${key} must be true`);
  }
  if (detail.timetable_rows?.length !== 12) fail(`${detail.meeting_id} must contain 12 timetable rows`);
  for (const row of detail.timetable_rows ?? []) {
    rowCount += 1;
    if (!row.label || !row.post_time_local || !row.race_name) fail(`${detail.meeting_id} contains an incomplete A+ row`);
    if (!Number.isInteger(row.distance_m) || row.distance_m <= 0) fail(`${detail.meeting_id} contains an invalid distance`);
    if (!row.surface || !row.course_label) fail(`${detail.meeting_id} contains incomplete surface/course data`);
  }
}
if (rowCount !== 48) fail('Japan A+ public overrides must contain 48 timetable rows.');

const serialized = JSON.stringify(overrides).toLowerCase();
for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'result', 'payout', 'prediction', 'raw_html', 'stream_url']) {
  if (serialized.includes(forbidden)) fail(`Japan A+ public override contains prohibited fragment ${forbidden}`);
}
if (serialized.includes('nar-') || serialized.includes('banei-')) fail('NAR and Banei must remain outside the JRA A+ public override.');

if (errors.length) {
  console.error(`JAPAN_A_PLUS_PUBLIC_OVERRIDES: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('JAPAN_A_PLUS_PUBLIC_OVERRIDES: pass');
console.log('JRA_MEETING_OVERRIDES: 8');
console.log('JRA_A_PLUS_DETAILS: 4');
console.log('JRA_A_PLUS_TIMETABLE_ROWS: 48');
console.log('NAR_PUBLIC_ACTIVATION: pending_pilot');
console.log('BANEI_PUBLIC_ACTIVATION: pending_pilot');
