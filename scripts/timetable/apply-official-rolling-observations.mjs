import fs from 'node:fs';
import path from 'node:path';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
import {
  acceptCanonicalObservationV1,
  normalizeStoredCanonicalV1,
  retainCurrentAcquisitionStateV1,
} from './canonical-acceptance.mjs';
import { validateCalendarAuthorityMetadataV1 } from './calendar-authority-metadata.mjs';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { reconcilePublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';

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
function normalizedRows(record) {
  const rows = Array.isArray(record.timetable_rows) ? record.timetable_rows : [];
  return rows.map((row, index) => ({
    label: row.label ?? row.race_label ?? `Race ${index + 1}`,
    post_time_local: row.post_time_local ?? row.post_time ?? null,
    ...(row.race_name ? { race_name: row.race_name } : {}),
    ...(Number.isFinite(row.distance_m) ? { distance_m: row.distance_m } : {}),
    ...(row.surface ? { surface: row.surface } : {}),
    ...(row.course_label ? { course_label: row.course_label } : {}),
  })).filter((row) => row.post_time_local
    || row.race_name
    || row.distance_m != null
    || row.surface
    || row.course_label);
}
function observedRank(record) {
  return deriveBestAvailableRank(record, record?.timetable_rows ?? []);
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
function validIdentity(record, defaults, previous) {
  return {
    country_id: record.country_id ?? previous?.country_id ?? defaults.country_id,
    authority_id: record.authority_id ?? previous?.authority_id ?? defaults.authority_id,
    racing_system_id: record.racing_system_id ?? previous?.racing_system_id ?? defaults.racing_system_id,
    timezone: record.timezone ?? previous?.timezone ?? defaults.timezone,
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
  const first = record.first_race_time_local ?? rows[0]?.post_time_local ?? null;
  const last = record.last_race_time_local ?? rows.at(-1)?.post_time_local ?? null;
  return {
    meeting_id: record.meeting_id,
    ...identity,
    racecourse_id: record.racecourse_id ?? previous?.racecourse_id,
    date: record.date ?? record.meeting_date ?? previous?.date,
    capability_rank: capabilityRank,
    display_status: capabilityRank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: first,
    last_race_time_local: last,
    source_trace: {
      source_id: sourceId(record, artifact),
      route_id: record.route_id ?? previous?.source_trace?.route_id ?? null,
      source_status: 'verified',
      official_source_url: url,
      source_label: record.source_label ?? previous?.source_trace?.source_label ?? null,
      extraction_method: 'adapter',
      source_snapshot_path: null,
      normalized_from_path: 'scripts/timetable/apply-official-rolling-observations.mjs',
    },
    freshness: {
      last_checked_date: checkedAt.slice(0, 10),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: 'Upserted from a verified official rolling-window observation.',
    },
    ...(record.evidence_support ? { evidence_support: structuredClone(record.evidence_support) } : {}),
    ...(record.evidence_changes ? { evidence_changes: structuredClone(record.evidence_changes) } : {}),
  };
}
function makeCanonicalDetail(meeting, record) {
  const rows = normalizedRows(record);
  if (!rows.length) return null;
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
    ...(record.evidence_support ? { evidence_support: structuredClone(record.evidence_support) } : {}),
    ...(record.evidence_changes ? { evidence_changes: structuredClone(record.evidence_changes) } : {}),
    timetable_rows: rows,
    summary_note: 'Current official rolling-window race programme observation.',
  };
}
const artifactPath = arg('artifact');
if (!artifactPath) throw new Error('--artifact=<official observation json> is required');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
const canonicalDetailsPath = arg('canonical-details', 'data/generated/timetable/canonical/meeting-details.json');
const publicPath = arg('public', 'data/generated/timetable/public/meeting-list.json');
const publicDetailsPath = arg('public-details', 'data/generated/timetable/public/meeting-details.json');
const policiesPath = arg('policies', 'src/data/publicationDisplayPolicies.json');
const readinessPath = arg('readiness');
const sourceAliasesPath = arg('source-aliases', 'data/static/timetable-source-aliases-v1.json');
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
const sourceAliases = readJson(sourceAliasesPath);
const readinessRegistry = readinessPath ? readJson(readinessPath) : loadCalendarReadinessV1(process.cwd());
const acquisitionRegistry = loadCalendarAcquisitionRegistryV1(process.cwd());
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const detailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const outcomes = { add: 0, update: 0, no_op: 0, protected_higher_rank: 0, normalized_stored_rank: 0, superseded_removed: 0, public_reprojected: 0, ignored: 0 };
const completionCounts = Object.fromEntries([
  'promoted',
  'complete_current_best_available',
  'pending_publication',
  'retry_required',
  'implementation_gap',
  'not_applicable',
].map((value) => [value, 0]));
let changed = false;

const supersededMeetingIds = Array.isArray(artifact.superseded_meeting_ids)
  ? [...new Set(artifact.superseded_meeting_ids.filter((value) => typeof value === 'string' && value))]
  : [];
for (const meetingId of supersededMeetingIds) {
  const stored = canonicalById.get(meetingId) ?? null;
  if (!stored && !detailsById.has(meetingId)) continue;
  const expectedCountry = artifact.country_id ?? defaults.country_id ?? null;
  if (stored && expectedCountry && stored.country_id !== expectedCountry) {
    throw new Error(`superseded meeting ${meetingId} belongs to ${stored.country_id}, not artifact country ${expectedCountry}`);
  }
  if (records.some((record) => record?.meeting_id === meetingId)) {
    throw new Error(`superseded meeting ${meetingId} is also present in the current observation records`);
  }
  canonicalById.delete(meetingId);
  detailsById.delete(meetingId);
  changed = true;
  outcomes.superseded_removed += 1;
}

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
  const normalizedStored = normalizeStoredCanonicalV1(storedMeeting, storedDetail);
  if (!normalizedStored.changed) continue;
  canonicalById.set(meetingId, normalizedStored.meeting);
  if (normalizedStored.detail) detailsById.set(meetingId, normalizedStored.detail);
  else detailsById.delete(meetingId);
  changed = true;
  outcomes.normalized_stored_rank += 1;
}

for (const record of records) {
  if (!record?.meeting_id) { outcomes.ignored += 1; continue; }
  const authorityMetadata = Object.fromEntries(
    ['acquisition_attempt', 'acquisition_completion', 'evidence_support', 'evidence_changes']
      .filter((key) => key in record)
      .map((key) => [key, record[key]]),
  );
  const metadataErrors = validateCalendarAuthorityMetadataV1(authorityMetadata, record.meeting_id);
  if (metadataErrors.length) throw new Error(metadataErrors.join('; '));
  const observed = observedRank(record);
  if (!RANK_INDEX.has(observed)) { outcomes.ignored += 1; continue; }
  const acquisitionProfile = chooseAcquisitionProfile(record, defaults, acquisitionRegistry);
  const acquisitionCompletion = classifyAcquisitionCompletion({ ...record, capability_rank: observed }, acquisitionProfile);
  completionCounts[acquisitionCompletion.disposition] += 1;
  let previous = canonicalById.get(record.meeting_id) ?? null;
  let previousDetail = detailsById.get(record.meeting_id) ?? null;
  const normalizedStored = normalizeStoredCanonicalV1(previous, previousDetail);
  if (normalizedStored.changed) {
    previous = normalizedStored.meeting;
    previousDetail = normalizedStored.detail;
    canonicalById.set(previous.meeting_id, previous);
    if (previousDetail) detailsById.set(previous.meeting_id, previousDetail);
    else detailsById.delete(previous.meeting_id);
    changed = true;
    outcomes.normalized_stored_rank += 1;
  }
  if (record.detail_observation?.status === 'conflict') {
    const completionUpdate = retainCurrentAcquisitionStateV1(previous, {
      acquisitionCompletion,
      ...('acquisition_attempt' in record ? { acquisitionAttempt: record.acquisition_attempt } : {}),
    });
    if (completionUpdate.changed) {
      previous = completionUpdate.meeting;
      canonicalById.set(previous.meeting_id, previous);
      changed = true;
    }
    outcomes.ignored += 1;
    continue;
  }
  const correction = record.official_correction === true;
  const checkedAt = artifact.generated_at ?? artifact.retrieved_at ?? new Date().toISOString();
  const candidate = makeCanonical(record, artifact, checkedAt, defaults, previous, acquisitionCompletion);
  const candidateDetail = makeCanonicalDetail(candidate, record);
  const accepted = acceptCanonicalObservationV1({
    previousMeeting: previous,
    previousDetail,
    candidateMeeting: candidate,
    candidateDetail,
    acquisitionCompletion,
    ...('acquisition_attempt' in record ? { acquisitionAttempt: record.acquisition_attempt } : {}),
    explicitCorrection: correction,
    evidenceChanges: record.evidence_changes ?? [],
  });
  const shouldAdvanceEvidenceFreshness = accepted.decision !== 'retained_stronger_evidence';
  const next = {
    ...accepted.meeting,
    freshness: shouldAdvanceEvidenceFreshness
      ? {
          ...(accepted.meeting.freshness ?? {}),
          last_checked_date: checkedAt.slice(0, 10),
          generated_at: checkedAt,
          stale_after_date: null,
          freshness_note: correction
            ? 'Updated from an explicit official correction.'
            : 'Upserted from a verified official rolling-window observation.',
        }
      : accepted.meeting.freshness,
  };
  const nextDetail = accepted.detail;

  const substantiveChanged = !previous || !sameSubstance(previous, next)
    || JSON.stringify(previousDetail) !== JSON.stringify(nextDetail);
  if (!substantiveChanged) {
    outcomes.no_op += 1;
    continue;
  }

  changed = true;
  canonicalById.set(next.meeting_id, next);
  if (nextDetail) detailsById.set(next.meeting_id, nextDetail);
  else detailsById.delete(next.meeting_id);

  if (accepted.decision === 'retained_stronger_evidence') outcomes.protected_higher_rank += 1;
  else outcomes[previous ? 'update' : 'add'] += 1;
}

const generatedAt = artifact.generated_at ?? artifact.retrieved_at ?? new Date().toISOString();
const sortRows = (rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
const nextCanonical = { ...canonical, generated_at: generatedAt, meetings: sortRows(canonicalById.values()) };
const nextCanonicalDetails = { ...canonicalDetails, generated_at: generatedAt, details: sortRows(detailsById.values()) };

const scopedIds = new Set([
  ...records.map((record) => record?.meeting_id).filter(Boolean),
  ...nextCanonical.meetings
    .filter((meeting) => targetAuthorityIds.has(meeting.authority_id))
    .map((meeting) => meeting.meeting_id),
  ...(publicList.meetings ?? [])
    .filter((meeting) => targetAuthorityIds.has(meeting.authority_id))
    .map((meeting) => meeting.meeting_id),
  ...supersededMeetingIds,
]);

const publicProjection = reconcilePublicProjectionV1({
  canonicalMeetings: nextCanonical,
  canonicalDetails: nextCanonicalDetails,
  policyData: policyDataset,
  readinessRegistry,
  sourceAliases,
  existingMeetingList: publicList,
  existingMeetingDetails: publicDetails,
  scopeMeetingIds: scopedIds,
  generatedAt,
});

function publicSubstance(dataset, key) {
  const copy = structuredClone(dataset);
  delete copy.generated_at;
  delete copy.publication_snapshot;
  return JSON.stringify(copy[key] ?? []);
}

const publicChanged =
  publicSubstance(publicProjection.meetingListDataset, 'meetings') !== publicSubstance(publicList, 'meetings')
  || publicSubstance(publicProjection.meetingDetailsDataset, 'details') !== publicSubstance(publicDetails, 'details');

if (publicChanged) outcomes.public_reprojected = scopedIds.size;

if (changed) {
  writeJson(canonicalPath, nextCanonical);
  writeJson(canonicalDetailsPath, nextCanonicalDetails);
}
if (changed || publicChanged) {
  writeJson(publicPath, publicProjection.meetingListDataset);
  writeJson(publicDetailsPath, publicProjection.meetingDetailsDataset);
}
changed = changed || publicChanged;

console.log(JSON.stringify({ artifact: artifactPath, observed: records.length, changed, outcomes, completion_counts: completionCounts }));
