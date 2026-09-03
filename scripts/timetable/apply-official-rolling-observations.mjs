import fs from 'node:fs';
import path from 'node:path';

const RANKS = ['C', 'B', 'B+', 'A', 'A+'];
const RANK_INDEX = new Map(RANKS.map((value, index) => [value, index]));
const PUBLIC_CEILING = new Map([
  ['jra', 'A+'],
  ['nar-local-government-racing', 'A+'],
  ['banei-tokachi', 'A+'],
  ['hkjc', 'A'],
  ['korea-racing-authority', 'A'],
  ['turkiye-jokey-kulubu', 'A'],
  ['emirates-racing-authority', 'A'],
]);
const POLICY_ID = new Map([
  ['jra', 'jra-reviewed-a-plus'],
  ['nar-local-government-racing', 'nar-reviewed-a-plus'],
  ['banei-tokachi', 'banei-reviewed-a-plus'],
  ['hkjc', 'hkjc-reviewed-a'],
  ['korea-racing-authority', 'kra-reviewed-a'],
  ['turkiye-jokey-kulubu', 'tjk-reviewed-a'],
  ['emirates-racing-authority', 'uae-reviewed-a'],
]);

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function rank(value) { return RANK_INDEX.get(value) ?? -1; }
function capRank(value, ceiling) {
  if (!RANK_INDEX.has(value)) return 'C';
  return rank(value) <= rank(ceiling) ? value : ceiling;
}
function rowsOf(record) {
  return Array.isArray(record.timetable_rows) ? record.timetable_rows.map((row) => ({
    label: row.label ?? row.race_label ?? null,
    post_time_local: row.post_time_local ?? row.post_time ?? null,
    race_name: row.race_name ?? null,
    distance_m: row.distance_m ?? null,
    surface: row.surface ?? null,
    course_label: row.course_label ?? null,
  })) : [];
}
function sourceUrl(record) {
  return record.official_source_url ?? record.source_url ?? record.source_trace?.official_source_url ?? null;
}
function recordArray(artifact) {
  if (Array.isArray(artifact)) return artifact;
  if (Array.isArray(artifact.records)) return artifact.records;
  if (Array.isArray(artifact.candidates)) return artifact.candidates;
  throw new Error('official observation artifact must contain records[] or candidates[]');
}
function observedRank(record) {
  return record.capability_rank ?? record.observed_rank ?? record.classification?.rank ?? 'C';
}
function canonicalRecord(record, checkedAt, previous = null) {
  const capabilityRank = observedRank(record);
  const rows = rowsOf(record);
  const first = record.first_race_time_local ?? rows[0]?.post_time_local ?? null;
  const last = record.last_race_time_local ?? rows.at(-1)?.post_time_local ?? null;
  return {
    ...(previous ?? {}),
    meeting_id: record.meeting_id,
    country_id: record.country_id ?? previous?.country_id,
    authority_id: record.authority_id ?? previous?.authority_id,
    racing_system_id: record.racing_system_id ?? previous?.racing_system_id,
    racecourse_id: record.racecourse_id ?? previous?.racecourse_id,
    date: record.date ?? record.meeting_date ?? previous?.date,
    timezone: record.timezone ?? previous?.timezone,
    capability_rank: capabilityRank,
    display_status: capabilityRank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: first,
    last_race_time_local: last,
    source_trace: {
      ...(previous?.source_trace ?? {}),
      source_id: record.source_id ?? previous?.source_trace?.source_id ?? 'official-rolling-refresh',
      route_id: record.route_id ?? previous?.source_trace?.route_id ?? null,
      source_status: 'verified',
      official_source_url: sourceUrl(record) ?? previous?.source_trace?.official_source_url ?? null,
      source_label: record.source_label ?? previous?.source_trace?.source_label ?? null,
      extraction_method: 'adapter',
      source_snapshot_path: null,
      normalized_from_path: 'scripts/timetable/apply-official-rolling-observations.mjs',
    },
    freshness: {
      ...(previous?.freshness ?? {}),
      last_checked_date: checkedAt.slice(0, 10),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: 'Upserted from the current official rolling-window observation.',
    },
  };
}
function detailRecord(meeting, record) {
  const rows = rowsOf(record);
  if (!['A', 'A+'].includes(meeting.capability_rank) || rows.length === 0) return null;
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    source_trace: meeting.source_trace,
    freshness: meeting.freshness,
    timetable_rows: rows,
    summary_note: 'Current official rolling-window race programme observation.',
  };
}
function publicMeeting(meeting, detail) {
  const ceiling = PUBLIC_CEILING.get(meeting.authority_id);
  if (!ceiling) throw new Error(`missing public ceiling for authority ${meeting.authority_id}`);
  let effective = capRank(meeting.capability_rank, ceiling);
  if (rank(effective) >= rank('A') && (!detail || !detail.timetable_rows.every((row) => row.label && row.post_time_local))) {
    effective = meeting.first_race_time_local && meeting.last_race_time_local ? 'B+' : meeting.first_race_time_local ? 'B' : 'C';
  }
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    max_public_rank: ceiling,
    effective_public_rank: effective,
    first_race_time_local: meeting.first_race_time_local ?? null,
    last_race_time_local: meeting.last_race_time_local ?? null,
    policy_id: POLICY_ID.get(meeting.authority_id) ?? null,
    source_status: 'verified',
    official_source_url: meeting.source_trace?.official_source_url ?? null,
    last_checked_date: meeting.freshness?.last_checked_date ?? null,
    detail_path: ['A', 'A+'].includes(effective) ? `/timetable/meetings/${meeting.meeting_id}/` : null,
    show_live_label: false,
    show_replay_label: false,
  };
}
function publicDetail(meeting, detail, listRow) {
  if (!detail || !['A', 'A+'].includes(listRow.effective_public_rank)) return null;
  const plus = listRow.effective_public_rank === 'A+';
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    max_public_rank: listRow.max_public_rank,
    effective_public_rank: listRow.effective_public_rank,
    policy_id: listRow.policy_id,
    official_source_url: listRow.official_source_url,
    source_status: listRow.source_status,
    last_checked_date: listRow.last_checked_date,
    show_race_name: plus,
    show_distance: plus,
    show_surface: plus,
    show_course: plus,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows: detail.timetable_rows.map((row) => plus ? row : ({ label: row.label, post_time_local: row.post_time_local })),
  };
}

const artifactPath = arg('artifact');
if (!artifactPath) throw new Error('--artifact=<official observation json> is required');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
const canonicalDetailsPath = arg('canonical-details', 'data/generated/timetable/canonical/meeting-details.json');
const publicPath = arg('public', 'data/generated/timetable/public/meeting-list.json');
const publicDetailsPath = arg('public-details', 'data/generated/timetable/public/meeting-details.json');
const checkedAt = new Date().toISOString();
const artifact = readJson(artifactPath);
const records = recordArray(artifact);
const canonical = readJson(canonicalPath);
const canonicalDetails = readJson(canonicalDetailsPath);
const publicList = readJson(publicPath);
const publicDetails = readJson(publicDetailsPath);
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const detailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const publicById = new Map((publicList.meetings ?? []).map((row) => [row.meeting_id, row]));
const publicDetailsById = new Map((publicDetails.details ?? []).map((row) => [row.meeting_id, row]));
const outcomes = { add: 0, update: 0, no_op: 0, protected_higher_rank: 0 };

for (const record of records) {
  if (!record?.meeting_id) continue;
  const observed = observedRank(record);
  if (!RANK_INDEX.has(observed)) continue;
  const previous = canonicalById.get(record.meeting_id) ?? null;
  if (previous && rank(previous.capability_rank) > rank(observed)) {
    outcomes.protected_higher_rank += 1;
    continue;
  }
  const next = canonicalRecord(record, checkedAt, previous);
  const nextDetail = detailRecord(next, record);
  const unchanged = previous && JSON.stringify({ ...previous, freshness: undefined }) === JSON.stringify({ ...next, freshness: undefined });
  outcomes[previous ? (unchanged ? 'no_op' : 'update') : 'add'] += 1;
  canonicalById.set(next.meeting_id, next);
  if (nextDetail) detailsById.set(next.meeting_id, nextDetail);
  const listRow = publicMeeting(next, nextDetail ?? detailsById.get(next.meeting_id));
  publicById.set(next.meeting_id, listRow);
  const detailRow = publicDetail(next, nextDetail ?? detailsById.get(next.meeting_id), listRow);
  if (detailRow) publicDetailsById.set(next.meeting_id, detailRow);
  else publicDetailsById.delete(next.meeting_id);
}

const sortMeetings = (rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
writeJson(canonicalPath, { ...canonical, generated_at: checkedAt, meetings: sortMeetings(canonicalById.values()) });
writeJson(canonicalDetailsPath, { ...canonicalDetails, generated_at: checkedAt, details: sortMeetings(detailsById.values()) });
writeJson(publicPath, { ...publicList, generated_at: checkedAt, meetings: sortMeetings(publicById.values()) });
writeJson(publicDetailsPath, { ...publicDetails, generated_at: checkedAt, details: sortMeetings(publicDetailsById.values()) });
console.log(JSON.stringify({ artifact: artifactPath, observed: records.length, outcomes }));
