import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/generated/timetable/public/jra-current-month.json', 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (data.schema_version !== 'jra-current-month-public-v1') fail('unexpected schema');
if (!['awaiting_first_fetch', 'fetched_official_programme'].includes(data.status)) fail('invalid status');
if (!/^\d{4}-\d{2}$/.test(data.month ?? '')) fail('invalid month');
if (!Array.isArray(data.source_pages) || !Array.isArray(data.meetings) || !Array.isArray(data.details)) fail('arrays missing');

if (data.status === 'awaiting_first_fetch') {
  if (data.source_pages.length || data.meetings.length || data.details.length) fail('placeholder must be empty');
} else {
  if (data.source_pages.length < 2 || data.meetings.length < 6) fail('dataset is unexpectedly small');
  if (data.meetings.length !== data.details.length) fail('meeting/detail count mismatch');
  const details = new Map(data.details.map((detail) => [detail.meeting_id, detail]));
  const ids = new Set();
  for (const meeting of data.meetings) {
    if (ids.has(meeting.meeting_id)) fail(`duplicate ${meeting.meeting_id}`);
    ids.add(meeting.meeting_id);
    if (!meeting.meeting_id.startsWith('jra-')) fail(`invalid ID ${meeting.meeting_id}`);
    if (!meeting.date.startsWith(`${data.month}-`)) fail(`outside month ${meeting.meeting_id}`);
    if (meeting.country_id !== 'japan' || meeting.authority_id !== 'jra' || meeting.timezone !== 'Asia/Tokyo') fail(`identity mismatch ${meeting.meeting_id}`);
    if ([meeting.capability_rank, meeting.max_public_rank, meeting.effective_public_rank].some((rank) => rank !== 'A+')) fail(`rank mismatch ${meeting.meeting_id}`);
    if (!/^\d{2}:\d{2}$/.test(meeting.first_race_time_local ?? '') || !/^\d{2}:\d{2}$/.test(meeting.last_race_time_local ?? '')) fail(`time mismatch ${meeting.meeting_id}`);
    if (!meeting.official_source_url?.startsWith('https://www.jra.go.jp/keiba/calendar')) fail(`source mismatch ${meeting.meeting_id}`);
    const detail = details.get(meeting.meeting_id);
    if (!detail || detail.timetable_rows?.length !== 12) fail(`detail mismatch ${meeting.meeting_id}`);
    for (const row of detail?.timetable_rows ?? []) {
      if (!row.race_name || !Number.isInteger(row.distance_m) || !row.surface || !row.course_label || !/^\d{2}:\d{2}$/.test(row.post_time_local ?? '')) fail(`row mismatch ${meeting.meeting_id}`);
    }
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log(`JRA_CURRENT_MONTH_PUBLIC: pass status=${data.status} meetings=${data.meetings.length}`);
