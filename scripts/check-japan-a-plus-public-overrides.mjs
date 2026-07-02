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
const normalizedDetails = parse('data/generated/timetable/jra-normalized-meeting-details.json');
const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];

const check = spawnSync(process.execPath, ['scripts/timetable/build-japan-a-plus-public-overrides.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});
if (check.status !== 0) fail(`override generator check failed: ${check.stderr || check.stdout}`);

if (overrides.schema_version !== 'japan-a-plus-public-overrides-v1') fail('unexpected Japan A+ public override schema.');
if (overrides.generated_at !== baseList.generated_at || overrides.generated_at !== baseDetails.generated_at) fail('override generated_at must match base public datasets.');

const baseJraMeetings = baseList.meetings.filter((meeting) =>
  meeting.country_id === 'japan' && meeting.authority_id === 'jra'
);
const baseJraDetails = baseDetails.details.filter((detail) =>
  detail.country_id === 'japan' && detail.authority_id === 'jra'
);
const baseMeetingIds = new Set(baseJraMeetings.map((meeting) => meeting.meeting_id));
const baseDetailIds = new Set(baseJraDetails.map((detail) => detail.meeting_id));

if (!baseJraMeetings.length) fail('at least one public JRA meeting is required.');
if ((overrides.meeting_overrides ?? []).length !== baseJraMeetings.length) {
  fail(`JRA meeting override count must match public JRA meetings (${baseJraMeetings.length}).`);
}
if ((overrides.detail_overrides ?? []).length !== baseJraDetails.length) {
  fail(`JRA detail override count must match public JRA details (${baseJraDetails.length}).`);
}

const seenMeetings = new Set();
for (const meeting of overrides.meeting_overrides ?? []) {
  if (seenMeetings.has(meeting.meeting_id)) fail(`duplicate meeting override ${meeting.meeting_id}`);
  seenMeetings.add(meeting.meeting_id);
  if (!meeting.meeting_id.startsWith('jra-')) fail(`non-JRA meeting override ${meeting.meeting_id}`);
  if (!baseMeetingIds.has(meeting.meeting_id)) fail(`meeting override has no base public row ${meeting.meeting_id}`);
  if (meeting.max_public_rank !== 'A+') fail(`${meeting.meeting_id} max public rank must be A+`);
  if (!['C', 'B', 'B+', 'A', 'A+'].includes(meeting.effective_public_rank)) {
    fail(`${meeting.meeting_id} effective rank is invalid`);
  }
  if (rankOrder.indexOf(meeting.effective_public_rank) > rankOrder.indexOf(meeting.max_public_rank)) {
    fail(`${meeting.meeting_id} effective rank exceeds max public rank`);
  }
}
for (const meetingId of baseMeetingIds) {
  if (!seenMeetings.has(meetingId)) fail(`missing JRA meeting override ${meetingId}`);
}

const seenDetails = new Set();
let rowCount = 0;
let aPlusDetailCount = 0;
for (const detail of overrides.detail_overrides ?? []) {
  if (seenDetails.has(detail.meeting_id)) fail(`duplicate detail override ${detail.meeting_id}`);
  seenDetails.add(detail.meeting_id);
  if (!detail.meeting_id.startsWith('jra-')) fail(`non-JRA detail override ${detail.meeting_id}`);
  if (!baseDetailIds.has(detail.meeting_id)) fail(`detail override has no base public detail ${detail.meeting_id}`);
  if (detail.max_public_rank !== 'A+') fail(`${detail.meeting_id} detail max public rank must be A+`);
  if (!['A', 'A+'].includes(detail.effective_public_rank)) fail(`${detail.meeting_id} detail effective rank must be A or A+`);
  if (detail.timetable_rows?.length !== 12) fail(`${detail.meeting_id} must contain 12 timetable rows`);

  const isAPlus = detail.effective_public_rank === 'A+';
  if (isAPlus) aPlusDetailCount += 1;

  for (const key of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
    if (detail[key] !== isAPlus) {
      fail(`${detail.meeting_id} ${key} must be ${isAPlus}`);
    }
  }

  for (const row of detail.timetable_rows ?? []) {
    rowCount += 1;
    if (!row.label || !row.post_time_local) fail(`${detail.meeting_id} contains an incomplete timetable row`);
    if (isAPlus) {
      if (!row.race_name) fail(`${detail.meeting_id} contains an incomplete A+ row`);
      if (!Number.isInteger(row.distance_m) || row.distance_m <= 0) fail(`${detail.meeting_id} contains an invalid distance`);
      if (!row.surface || !row.course_label) fail(`${detail.meeting_id} contains incomplete surface/course data`);
    } else {
      for (const key of ['race_name', 'distance_m', 'surface', 'course_label']) {
        if (key in row) fail(`${detail.meeting_id} A-level row exposes ${key}`);
      }
    }
  }
}
for (const detailId of baseDetailIds) {
  if (!seenDetails.has(detailId)) fail(`missing JRA detail override ${detailId}`);
}
if (!aPlusDetailCount) fail('at least one JRA A+ detail override is required.');

const detailOverrideIndex = new Map(
  (overrides.detail_overrides ?? []).map((detail) => [detail.meeting_id, detail])
);
for (const detail of normalizedDetails.details ?? []) {
  if (detail.country_id !== 'japan' || detail.authority_id !== 'jra') continue;
  const override = detailOverrideIndex.get(detail.meeting_id);
  if (!override) fail(`normalized JRA detail has no public override ${detail.meeting_id}`);
  else if (detail.capability_rank === 'A+' && override.effective_public_rank !== 'A+') {
    fail(`normalized A+ JRA detail did not remain A+ ${detail.meeting_id}`);
  }
}

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
console.log(`JRA_MEETING_OVERRIDES: ${seenMeetings.size}`);
console.log(`JRA_DETAIL_OVERRIDES: ${seenDetails.size}`);
console.log(`JRA_A_PLUS_DETAILS: ${aPlusDetailCount}`);
console.log(`JRA_TIMETABLE_ROWS: ${rowCount}`);
console.log('NAR_PUBLIC_ACTIVATION: pending_pilot');
console.log('BANEI_PUBLIC_ACTIVATION: pending_pilot');
