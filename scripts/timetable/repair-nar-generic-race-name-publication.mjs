import fs from 'node:fs';

const paths = {
  meetings: 'data/generated/timetable/canonical/meetings.json',
  details: 'data/generated/timetable/canonical/meeting-details.json',
};

const GENERIC = new Set(['特別', '重賞', '準重賞', '一般', '新馬', '未勝利']);
const EXPECTED_MEETINGS = 95;
const EXPECTED_ROWS = 314;
const REPAIR_AT = process.env.WHR_REPAIR_AT ?? '2026-09-01T07:16:00Z';

function read(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function write(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function isGeneric(value) {
  return GENERIC.has(String(value ?? '').replace(/[\s\u3000]+/g, ' ').trim());
}

function hasAFields(row) {
  return Boolean(String(row?.label ?? '').trim()) && /^\d{2}:\d{2}$/.test(String(row?.post_time_local ?? ''));
}

const meetingsData = read(paths.meetings);
const detailsData = read(paths.details);
const meetings = meetingsData.meetings ?? [];
const details = detailsData.details ?? [];
const meetingById = new Map(meetings.map((row) => [row.meeting_id, row]));

const affected = [];
let genericRowCount = 0;
for (const detail of details) {
  if (detail.authority_id !== 'nar-local-government-racing') continue;
  const rows = detail.timetable_rows ?? [];
  const bad = rows.filter((row) => isGeneric(row.race_name));
  if (!bad.length) continue;
  const invalidA = rows.filter((row) => !hasAFields(row));
  if (invalidA.length) throw new Error(`${detail.meeting_id} cannot be repaired to Rank A: ${invalidA.length} rows lack A fields`);
  const meeting = meetingById.get(detail.meeting_id);
  if (!meeting) throw new Error(`${detail.meeting_id} has no canonical meeting`);
  if (meeting.authority_id !== 'nar-local-government-racing') throw new Error(`${detail.meeting_id} authority mismatch`);
  genericRowCount += bad.length;
  affected.push({ detail, meeting, bad });
}

if (affected.length !== EXPECTED_MEETINGS) {
  throw new Error(`bounded repair meeting count differs: expected ${EXPECTED_MEETINGS}, got ${affected.length}`);
}
if (genericRowCount !== EXPECTED_ROWS) {
  throw new Error(`bounded repair generic-row count differs: expected ${EXPECTED_ROWS}, got ${genericRowCount}`);
}

for (const { detail, meeting } of affected) {
  meeting.capability_rank = 'A';
  detail.capability_rank = 'A';

  for (const row of detail.timetable_rows ?? []) {
    if (isGeneric(row.race_name)) delete row.race_name;
  }

  meeting.notes = 'Rank A repair: category-only NAR race-name values were removed; complete race labels and post times are retained. Reacquisition may restore Rank A+ after specific official race names are available.';
  detail.summary_note = 'Rank A repair: category-only NAR race-name values were removed; complete race labels and post times are retained. Reacquisition may restore Rank A+ after specific official race names are available.';
}

meetingsData.generated_at = REPAIR_AT;
detailsData.generated_at = REPAIR_AT;
write(paths.meetings, meetingsData);
write(paths.details, detailsData);

const remaining = details
  .filter((detail) => detail.authority_id === 'nar-local-government-racing')
  .flatMap((detail) => (detail.timetable_rows ?? []).map((row) => ({ meeting_id: detail.meeting_id, row })))
  .filter(({ row }) => isGeneric(row.race_name));
if (remaining.length !== 0) throw new Error(`generic NAR race names remain in canonical: ${remaining.length}`);

console.log(JSON.stringify({
  schema_version: 'nar-generic-race-name-repair-result-v1',
  repaired_at: REPAIR_AT,
  affected_meeting_count: affected.length,
  removed_generic_race_name_row_count: genericRowCount,
  repaired_capability_rank: 'A',
  a_field_failure_count: 0,
  affected_meeting_ids: affected.map(({ detail }) => detail.meeting_id).sort(),
}, null, 2));
