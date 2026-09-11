import fs from 'node:fs';
import path from 'node:path';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { projectPublicTimetableRows } from './public-detail-projection.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((value, index) => [value, index]));

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
function normalizedRows(record) {
  const rows = Array.isArray(record.timetable_rows) ? record.timetable_rows : [];
  return rows.map((row, index) => ({
    label: row.label ?? row.race_label ?? `Race ${index + 1}`,
    post_time_local: row.post_time_local ?? row.post_time ?? null,
    ...(row.race_name ? { race_name: row.race_name } : {}),
    ...(Number.isFinite(row.distance_m) ? { distance_m: row.distance_m } : {}),
    ...(row.surface ? { surface: row.surface } : {}),
    ...(row.course_label ? { course_label: row.course_label } : {}),
  })).filter((row) => row.post_time_local);
}
function observedRank(record) {
  return deriveBestAvailableRank(record, record?.timetable_rows ?? []);
}
function storedEvidenceRank(meeting, detail) {
  return deriveBestAvailableRank(meeting, detail?.timetable_rows ?? []);
}
function sourceUrl(record, artifact) {
  return record.official_source_url
    ?? record.source_url
    ?? record.source?.official_url
    ?? record.source?.official_source_url
    ?? record.source?.official_schedule_url
    ?? record.source?.race_list_url
    ?? record.source_trace?.official_source_url
    ?? artifact.discovery?.schedule_source_url
    ?? artifact.entry_url
    ?? null;
}
function sourceId(record, artifact) {
  return record.source_id ?? record.source?.source_id ?? artifact.source_id ?? artifact.discovery?.schedule_source_id ?? artifact.source ?? 'official-rolling-refresh';
}
function recordsFromArtifact(artifact) {
  if (Array.isArray(artifact)) return artifact;
  if (Array.isArray(artifact.records)) return artifact.records;
  if (Array.isArray(artifact.candidates)) return artifact.candidates;
  if (Array.isArray(artifact.detail_candidates) || Array.isArray(artifact.schedule_candidates)) {
    return [...(artifact.schedule_candidates ?? []), ...(artifact.detail_candidates ?? [])];
  }
  throw new Error('official observation artifact contains no supported candidate collection');
}
function choosePolicy(authorityId, policyDataset) {
  const matches = (policyDataset.policies ?? [])
    .filter((policy) => (policy.match?.authority_ids ?? []).includes(authorityId))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matches[0] ?? policyDataset.default_policy;
}
function chooseAcquisitionProfile(record, defaults, registry) {
  const systemId = record.racing_system_id ?? defaults.racing_system_id ?? null;
  const authorityId = record.authority_id ?? defaults.authority_id ?? null;
  if (systemId) {
    const systemMatch = (registry.records ?? []).find((profile) => profile.system_id === systemId);
    if (systemMatch) return systemMatch;
  }
  const authorityMatches = (registry.records ?? []).filter((profile) => profile.authority_id === authorityId);
  if (authorityMatches.length === 1) return authorityMatches[0];
  throw new Error(`missing unique acquisition profile for ${record.meeting_id}: system=${systemId ?? 'null'} authority=${authorityId ?? 'null'}`);
}
function stripVolatile(value) {
  if (!value) return value;
  const copy = structuredClone(value);
  delete copy.freshness;
  return copy;
}
function sameSubstance(left, right) {
  return JSON.stringify(stripVolatile(left)) === JSON.stringify(stripVolatile(right));
}
function completeRankA(rows) {
  return rows.length > 0 && rows.every((row) => row.label && row.post_time_local);
}
function validIdentity(record, defaults, previous) {
  return {
    country_id: record.country_id ?? previous?.country_id ?? defaults.country_id,
    authority_id: record.authority_id ?? previous?.authority_id ?? defaults.authority_id,
    racing_system_id: record.racing_system_id ?? previous?.racing_system_id ?? defaults.racing_system_id,
    timezone: record.timezone ?? previous?.timezone ?? defaults.timezone,
  };
}
function normalizeStoredCanonical(meeting, detail) {
  if (!meeting) return { meeting: null, detail, changed: false };
  const evidenceRank = storedEvidenceRank(meeting, detail);
  const nextMeeting = meeting.capability_rank === evidenceRank
    ? meeting
    : {
        ...meeting,
        capability_rank: evidenceRank,
        display_status: evidenceRank === 'C' ? 'partial' : 'displayable',
      };
  const nextDetail = ['A', 'A+'].includes(evidenceRank) && detail
    ? (detail.capability_rank === evidenceRank ? detail : { ...detail, capability_rank: evidenceRank })
    : null;
  return {
    meeting: nextMeeting,
    detail: nextDetail,
    changed: nextMeeting !== meeting || nextDetail !== detail,
  };
}
function makeCanonical(record, artifact, checkedAt, defaults, previous, acquisitionCompletion) {
  const capabilityRank = observedRank(record);
  const rows = normalizedRows(record);
  const identity = validIdentity(record, defaults, previous);
  for (const [key, value] of Object.entries(identity)) {
    if (!value) throw new Error(`missing ${key} for ${record.meeting_id}`);
  }
  const url = sourceUrl(record, artifact) ?? previous?.source_trace?.official_source_url ?? null;
  if (!url) throw new Error(`missing official source URL for ${record.meeting_id}`);
  const first = record.first_race_time_local ?? rows[0]?.post_time_local ?? previous?.first_race_time_local ?? null;
  const last = record.last_race_time_local ?? rows.at(-1)?.post_time_local ?? previous?.last_race_time_local ?? null;
  return {
    ...(previous ?? {}),
    meeting_id: record.meeting_id,
    ...identity,
    racecourse_id: record.racecourse_id ?? previous?.racecourse_id,
    date: record.date ?? record.meeting_date ?? previous?.date,
    capability_rank: capabilityRank,
    display_status: capabilityRank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: first,
    last_race_time_local: last,
    acquisition_completion: acquisitionCompletion,
    source_trace: {
      ...(previous?.source_trace ?? {}),
      source_id: sourceId(record, artifact),
      route_id: record.route_id ?? previous?.source_trace?.route_id ?? null,
      source_status: 'verified',
      official_source_url: url,
      source_label: record.source_label ?? previous?.source_trace?.source_label ?? null,
      extraction_method: 'adapter',
      source_snapshot_path: null,
      normalized_from_path: 'scripts/timetable/apply-official-rolling-observations.mjs',
    },
    freshness: previous?.freshness ?? {
      last_checked_date: checkedAt.slice(0, 10),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: 'Upserted from a verified official rolling-window observation.',
    },
  };
}
function makeCanonicalDetail(meeting, record, previousDetail) {
  const rows = normalizedRows(record);
  if (!['A', 'A+'].includes(meeting.capability_rank)) return null;
  if (!rows.length) return previousDetail ?? null;
  return {
    ...(previousDetail ?? {}),
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
function makePublicMeeting(meeting, detail, policy, previousPublic) {
  const evidenceRank = storedEvidenceRank(meeting, detail);
  let effective = evidenceRank;
  if (rank(effective) >= rank('A') && (!detail || !completeRankA(detail.timetable_rows ?? []))) {
    effective = meeting.first_race_time_local && meeting.last_race_time_local ? 'B+' : meeting.first_race_time_local ? 'B' : 'C';
  }
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: evidenceRank,
    effective_public_rank: effective,
    first_race_time_local: meeting.first_race_time_local ?? null,
    last_race_time_local: meeting.last_race_time_local ?? null,
    policy_id: policy.id,
    source_status: 'verified',
    official_source_url: meeting.source_trace.official_source_url,
    last_checked_date: meeting.freshness?.last_checked_date ?? previousPublic?.last_checked_date ?? null,
    detail_path: ['A', 'A+'].includes(effective) ? `/timetable/meetings/${meeting.meeting_id}/` : null,
    show_live_label: policy.show_live_label ?? previousPublic?.show_live_label ?? false,
    show_replay_label: policy.show_replay_label ?? previousPublic?.show_replay_label ?? false,
  };
}
function makePublicDetail(meeting, detail, listRow, policy, previousPublicDetail) {
  if (!detail || !['A', 'A+'].includes(listRow.effective_public_rank)) return null;
  const projection = projectPublicTimetableRows(detail.timetable_rows ?? [], policy);
  return {
    ...(previousPublicDetail ?? {}),
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: listRow.capability_rank,
    effective_public_rank: listRow.effective_public_rank,
    policy_id: listRow.policy_id,
    official_source_url: listRow.official_source_url,
    source_status: listRow.source_status,
    last_checked_date: listRow.last_checked_date,
    show_race_name: projection.visibility.show_race_name,
    show_distance: projection.visibility.show_distance,
    show_surface: projection.visibility.show_surface,
    show_course: projection.visibility.show_course,
    show_live_label: policy.show_live_label ?? false,
    show_replay_label: policy.show_replay_label ?? false,
    timetable_rows: projection.rows,
  };
}

const artifactPath = arg('artifact');
if (!artifactPath) throw new Error('--artifact=<official observation json> is required');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
const canonicalDetailsPath = arg('canonical-details', 'data/generated/timetable/canonical/meeting-details.json');
const publicPath = arg('public', 'data/generated/timetable/public/meeting-list.json');
const publicDetailsPath = arg('public-details', 'data/generated/timetable/public/meeting-details.json');
const policiesPath = arg('policies', 'src/data/publicationDisplayPolicies.json');
const defaults = {
  country_id: arg('country-id'),
  authority_id: arg('authority-id'),
  racing_system_id: arg('racing-system-id'),
  timezone: arg('timezone'),
};

const artifact = readJson(artifactPath);
const records = recordsFromArtifact(artifact);
const canonical = readJson(canonicalPath);
const canonicalDetails = readJson(canonicalDetailsPath);
const publicList = readJson(publicPath);
const publicDetails = readJson(publicDetailsPath);
const policyDataset = readJson(policiesPath);
const acquisitionRegistry = loadCalendarAcquisitionRegistryV1(process.cwd());
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const detailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const publicById = new Map((publicList.meetings ?? []).map((row) => [row.meeting_id, row]));
const publicDetailsById = new Map((publicDetails.details ?? []).map((row) => [row.meeting_id, row]));
const outcomes = { add: 0, update: 0, no_op: 0, protected_higher_rank: 0, normalized_stored_rank: 0, public_reprojected: 0, ignored: 0 };
const completionCounts = Object.fromEntries([
  'promoted',
  'complete_current_best_available',
  'pending_publication',
  'retry_required',
  'implementation_gap',
  'not_applicable',
].map((value) => [value, 0]));
let changed = false;

// A rolling source may omit previously observed meetings even while their stored evidence remains valid.
// Normalize every stored canonical row for the authority being applied, not only rows present in this artifact,
// so stale capability labels cannot survive indefinitely just because the current observation window skipped them.
const targetAuthorityIds = new Set([
  ...(defaults.authority_id ? [defaults.authority_id] : []),
  ...records.map((record) => record?.authority_id).filter(Boolean),
]);
for (const [meetingId, storedMeeting] of [...canonicalById.entries()]) {
  if (!targetAuthorityIds.has(storedMeeting?.authority_id)) continue;
  const storedDetail = detailsById.get(meetingId) ?? null;
  const normalizedStored = normalizeStoredCanonical(storedMeeting, storedDetail);
  if (!normalizedStored.changed) continue;
  canonicalById.set(meetingId, normalizedStored.meeting);
  if (normalizedStored.detail) detailsById.set(meetingId, normalizedStored.detail);
  else detailsById.delete(meetingId);
  changed = true;
  outcomes.normalized_stored_rank += 1;
}

for (const record of records) {
  if (!record?.meeting_id) { outcomes.ignored += 1; continue; }
  const observed = observedRank(record);
  if (!RANK_INDEX.has(observed)) { outcomes.ignored += 1; continue; }
  const acquisitionProfile = chooseAcquisitionProfile(record, defaults, acquisitionRegistry);
  const acquisitionCompletion = classifyAcquisitionCompletion({ ...record, capability_rank: observed }, acquisitionProfile);
  completionCounts[acquisitionCompletion.disposition] += 1;
  if (record.detail_observation?.status === 'conflict') { outcomes.ignored += 1; continue; }
  let previous = canonicalById.get(record.meeting_id) ?? null;
  let previousDetail = detailsById.get(record.meeting_id) ?? null;
  const normalizedStored = normalizeStoredCanonical(previous, previousDetail);
  if (normalizedStored.changed) {
    previous = normalizedStored.meeting;
    previousDetail = normalizedStored.detail;
    canonicalById.set(previous.meeting_id, previous);
    if (previousDetail) detailsById.set(previous.meeting_id, previousDetail);
    else detailsById.delete(previous.meeting_id);
    changed = true;
    outcomes.normalized_stored_rank += 1;
  }
  const correction = record.official_correction === true;
  if (previous && rank(previous.capability_rank) > rank(observed) && !correction) {
    outcomes.protected_higher_rank += 1;
    continue;
  }
  const checkedAt = artifact.generated_at ?? artifact.retrieved_at ?? new Date().toISOString();
  const draft = makeCanonical(record, artifact, checkedAt, defaults, previous, acquisitionCompletion);
  let draftDetail = makeCanonicalDetail(draft, record, previousDetail);
  if (correction && rank(observed) < rank('A')) draftDetail = null;
  const substantiveChanged = !previous || !sameSubstance(previous, draft)
    || JSON.stringify(previousDetail) !== JSON.stringify(draftDetail);
  if (!substantiveChanged) {
    outcomes.no_op += 1;
    continue;
  }
  changed = true;
  const next = {
    ...draft,
    freshness: {
      ...(draft.freshness ?? {}),
      last_checked_date: checkedAt.slice(0, 10),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: correction
        ? 'Updated from an explicit official correction.'
        : 'Upserted from a verified official rolling-window observation.',
    },
  };
  if (draftDetail) draftDetail = { ...draftDetail, freshness: next.freshness, source_trace: next.source_trace };
  canonicalById.set(next.meeting_id, next);
  if (draftDetail) detailsById.set(next.meeting_id, draftDetail);
  else detailsById.delete(next.meeting_id);

  const previousPublic = publicById.get(next.meeting_id) ?? null;
  const previousPublicDetail = publicDetailsById.get(next.meeting_id) ?? null;
  const policy = choosePolicy(next.authority_id, policyDataset);
  const listRow = makePublicMeeting(next, draftDetail, policy, previousPublic);
  publicById.set(next.meeting_id, listRow);
  const detailRow = makePublicDetail(next, draftDetail, listRow, policy, previousPublicDetail);
  if (detailRow) publicDetailsById.set(next.meeting_id, detailRow);
  else publicDetailsById.delete(next.meeting_id);
  outcomes[previous ? 'update' : 'add'] += 1;
}

// Public output is a projection of canonical evidence plus the current display policy.
// Recompute existing public rows even when the collector observation was a canonical no-op,
// so policy changes and stricter evidence-derived ranks cannot remain stale indefinitely.
for (const [meetingId, previousPublic] of [...publicById.entries()]) {
  const meeting = canonicalById.get(meetingId);
  if (!meeting) continue;
  const detail = detailsById.get(meetingId) ?? null;
  const policy = choosePolicy(meeting.authority_id, policyDataset);
  const nextPublic = makePublicMeeting(meeting, detail, policy, previousPublic);
  const previousPublicDetail = publicDetailsById.get(meetingId) ?? null;
  const nextPublicDetail = makePublicDetail(meeting, detail, nextPublic, policy, previousPublicDetail);
  const listChanged = JSON.stringify(previousPublic) !== JSON.stringify(nextPublic);
  const detailChanged = JSON.stringify(previousPublicDetail) !== JSON.stringify(nextPublicDetail);
  if (!listChanged && !detailChanged) continue;
  publicById.set(meetingId, nextPublic);
  if (nextPublicDetail) publicDetailsById.set(meetingId, nextPublicDetail);
  else publicDetailsById.delete(meetingId);
  changed = true;
  outcomes.public_reprojected += 1;
}

if (changed) {
  const generatedAt = artifact.generated_at ?? artifact.retrieved_at ?? new Date().toISOString();
  const sortRows = (rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  writeJson(canonicalPath, { ...canonical, generated_at: generatedAt, meetings: sortRows(canonicalById.values()) });
  writeJson(canonicalDetailsPath, { ...canonicalDetails, generated_at: generatedAt, details: sortRows(detailsById.values()) });
  writeJson(publicPath, { ...publicList, generated_at: generatedAt, meetings: sortRows(publicById.values()) });
  writeJson(publicDetailsPath, { ...publicDetails, generated_at: generatedAt, details: sortRows(publicDetailsById.values()) });
}

console.log(JSON.stringify({ artifact: artifactPath, observed: records.length, changed, outcomes, completion_counts: completionCounts }));