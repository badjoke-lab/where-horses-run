import fs from 'node:fs';

const AUTHORITY_ID = 'turkiye-jokey-kulubu';
const COUNTRY_ID = 'turkey';
const POLICY_ID = 'tjk-reviewed-a';
const CANONICAL_MEETINGS = 'data/generated/timetable/canonical/meetings.json';
const CANONICAL_DETAILS = 'data/generated/timetable/canonical/meeting-details.json';
const PUBLIC_MEETINGS = 'data/generated/timetable/public/meeting-list.json';
const PUBLIC_DETAILS = 'data/generated/timetable/public/meeting-details.json';

const reconciliationPath = process.argv[2] ?? 'data/generated/timetable/tjk-zero-based-30d-reconciliation.json';
const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, 'utf8'));
const canonicalMeetings = JSON.parse(fs.readFileSync(CANONICAL_MEETINGS, 'utf8'));
const canonicalDetails = JSON.parse(fs.readFileSync(CANONICAL_DETAILS, 'utf8'));
const publicMeetings = JSON.parse(fs.readFileSync(PUBLIC_MEETINGS, 'utf8'));
const publicDetails = JSON.parse(fs.readFileSync(PUBLIC_DETAILS, 'utf8'));

if (reconciliation.schema_version !== 'tjk-zero-based-30d-reconciliation-v1' || reconciliation.complete !== true) {
  throw new Error('TJK public projection requires a complete zero-based reconciliation');
}

const officialIds = new Set(reconciliation.official_meeting_ids);
const canonicalById = new Map(canonicalMeetings.meetings.map((x) => [x.meeting_id, x]));
const detailsById = new Map(canonicalDetails.details.map((x) => [x.meeting_id, x]));
const publicMeetingMap = new Map(publicMeetings.meetings.map((x) => [x.meeting_id, x]));
const publicDetailMap = new Map(publicDetails.details.map((x) => [x.meeting_id, x]));
const window = reconciliation.window;

function cappedRank(rank) {
  return rank === 'A+' ? 'A' : rank;
}

function publicMeetingFromCanonical(meeting) {
  const rank = cappedRank(meeting.capability_rank);
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: rank,
    max_public_rank: rank,
    effective_public_rank: rank,
    first_race_time_local: rank === 'C' ? null : meeting.first_race_time_local,
    last_race_time_local: ['B+', 'A'].includes(rank) ? meeting.last_race_time_local : null,
    policy_id: POLICY_ID,
    source_status: meeting.source_trace?.source_status ?? 'verified',
    official_source_url: meeting.source_trace?.official_source_url ?? null,
    last_checked_date: meeting.freshness?.last_checked_date ?? reconciliation.generated_at.slice(0, 10),
    detail_path: rank === 'A' ? `/timetable/meetings/${meeting.meeting_id}/` : null,
    show_live_label: false,
    show_replay_label: false,
  };
}

function publicDetailFromCanonical(meeting, detail) {
  if (cappedRank(meeting.capability_rank) !== 'A' || !detail) return null;
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: 'A',
    max_public_rank: 'A',
    effective_public_rank: 'A',
    policy_id: POLICY_ID,
    official_source_url: meeting.source_trace?.official_source_url ?? null,
    source_status: meeting.source_trace?.source_status ?? 'verified',
    last_checked_date: meeting.freshness?.last_checked_date ?? reconciliation.generated_at.slice(0, 10),
    show_race_name: false,
    show_distance: false,
    show_surface: false,
    show_course: false,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows: detail.timetable_rows.map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
    })),
  };
}

for (const meetingId of officialIds) {
  const meeting = canonicalById.get(meetingId);
  if (!meeting) throw new Error(`${meetingId} missing from canonical TJK mother set`);
  if (meeting.country_id !== COUNTRY_ID || meeting.authority_id !== AUTHORITY_ID) throw new Error(`${meetingId} canonical authority identity mismatch`);
  publicMeetingMap.set(meetingId, publicMeetingFromCanonical(meeting));
  const projectedDetail = publicDetailFromCanonical(meeting, detailsById.get(meetingId));
  if (projectedDetail) publicDetailMap.set(meetingId, projectedDetail);
  else publicDetailMap.delete(meetingId);
}

for (const [meetingId, meeting] of [...publicMeetingMap.entries()]) {
  if (meeting.country_id !== COUNTRY_ID || meeting.authority_id !== AUTHORITY_ID) continue;
  if (meeting.date < window.start_date || meeting.date >= window.end_date_exclusive) continue;
  if (officialIds.has(meetingId)) continue;
  publicMeetingMap.delete(meetingId);
  publicDetailMap.delete(meetingId);
}

const sortRecords = (records) => records.sort((a, b) => `${a.date}:${a.country_id}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.country_id}:${b.racecourse_id}:${b.meeting_id}`));
const generatedAt = reconciliation.generated_at;
fs.writeFileSync(PUBLIC_MEETINGS, `${JSON.stringify({ ...publicMeetings, generated_at: generatedAt, meetings: sortRecords([...publicMeetingMap.values()]) }, null, 2)}\n`);
fs.writeFileSync(PUBLIC_DETAILS, `${JSON.stringify({ ...publicDetails, generated_at: generatedAt, details: sortRecords([...publicDetailMap.values()]) }, null, 2)}\n`);

console.log(JSON.stringify({
  projected_official_meetings: officialIds.size,
  public_detail_count: [...officialIds].filter((id) => publicDetailMap.has(id)).length,
  generated_at: generatedAt,
}, null, 2));