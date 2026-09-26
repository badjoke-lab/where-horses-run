import { attachPublicationSnapshotV1 } from '../calendar-authority-metadata.mjs';

const RANKS = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];
const PUBLIC_READINESS = new Set(['ready', 'prototype_ready', 'manual_ready']);
const PUBLIC_AUTOMATION = new Set(['automatic', 'semi_automatic', 'manual_import', 'manual_confirmation']);
const PUBLIC_SOURCE_STATUS = new Set(['verified', 'partial', 'stale']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rankIndex(rank, label = 'rank') {
  const index = RANKS.indexOf(rank);
  assert(index >= 0, `${label} has unsupported rank ${rank}`);
  return index;
}

function atLeast(rank, minimum) {
  return rankIndex(rank, 'rank') >= rankIndex(minimum, 'minimum rank');
}

function lowerRank(...ranks) {
  const valid = ranks.filter((rank) => rank != null);
  assert(valid.length > 0, 'lowerRank requires at least one rank');
  return valid.reduce((lowest, rank) =>
    rankIndex(rank, 'rank') < rankIndex(lowest, 'rank') ? rank : lowest
  );
}

function matches(value, allowed) {
  return !allowed || allowed.length === 0 || allowed.includes(value);
}

function findPolicy(record, policyData, canonicalSourceId) {
  assert(policyData?.schema_version === 'publication-display-policies-v0', 'publication policy schema is invalid');
  assert(policyData.default_policy && Array.isArray(policyData.policies), 'publication policy data is incomplete');

  return (
    [...policyData.policies]
      .sort((left, right) => right.priority - left.priority)
      .find((policy) =>
        matches(record.country_id, policy.match?.country_ids) &&
        matches(record.authority_id, policy.match?.authority_ids) &&
        matches(canonicalSourceId, policy.match?.source_ids)
      ) ?? policyData.default_policy
  );
}

function buildReadinessIndex(readinessRegistry) {
  assert(readinessRegistry?.schema_version === 'calendar-readiness-registry-v1', 'Calendar Readiness registry schema is invalid');
  assert(Array.isArray(readinessRegistry.records), 'Calendar Readiness records must be an array');
  const index = new Map();
  for (const record of readinessRegistry.records) {
    assert(typeof record.authority_source_key === 'string' && record.authority_source_key, `readiness ${record.readiness_id ?? 'unknown'} has no authority_source_key`);
    const records = index.get(record.authority_source_key) ?? [];
    records.push(record);
    index.set(record.authority_source_key, records);
  }
  return index;
}

function normalizeRacecourseKey(value) {
  return String(value ?? '').replace(/-racecourse$/, '');
}

function chooseReadiness(records, canonicalRecord, key) {
  assert(records.length > 0, `${canonicalRecord.meeting_id} has no Calendar Readiness record for ${key}`);
  if (records.length === 1) return records[0];

  const racecourseKey = normalizeRacecourseKey(canonicalRecord.racecourse_id);
  const racecourseMatches = records.filter((record) =>
    Array.isArray(record.racecourse_ids)
    && record.racecourse_ids.some((racecourseId) => normalizeRacecourseKey(racecourseId) === racecourseKey)
  );
  if (racecourseMatches.length === 1) return racecourseMatches[0];

  const systemMatches = records.filter((record) =>
    canonicalRecord.racing_system_id && record.system_id === canonicalRecord.racing_system_id
  );
  if (systemMatches.length === 1) return systemMatches[0];

  const broadMatches = records.filter((record) =>
    ['countrywide', 'authority_wide'].includes(record.coverage_scope) &&
    (!Array.isArray(record.racecourse_ids)
      || record.racecourse_ids.length === 0
      || record.racecourse_ids.some((racecourseId) => normalizeRacecourseKey(racecourseId) === racecourseKey))
  );
  if (broadMatches.length === 1) return broadMatches[0];

  throw new Error(`${canonicalRecord.meeting_id} has ambiguous Calendar Readiness records for ${key}: ${records.map((record) => record.readiness_id).join(', ')}`);
}

function buildAliasIndex(sourceAliases) {
  assert(sourceAliases?.schema_version === 'timetable-source-aliases-v1', 'source alias schema is invalid');
  assert(Array.isArray(sourceAliases.aliases), 'source aliases must be an array');
  const index = new Map();
  for (const alias of sourceAliases.aliases) {
    const key = `${alias.country_id}/${alias.authority_id}/${alias.legacy_source_id}`;
    assert(!index.has(key), `duplicate source alias ${key}`);
    assert(alias.canonical_source_id !== alias.legacy_source_id, `source alias ${key} must migrate to a different canonical ID`);
    index.set(key, alias);
  }
  return index;
}

function resolveReadiness(record, readinessIndex, aliasIndex) {
  const sourceId = record.source_trace?.source_id;
  assert(typeof sourceId === 'string' && sourceId, `${record.meeting_id} has no canonical source ID`);
  const authorityPrefix = `${record.country_id}/${record.authority_id}/`;
  const directKey = `${authorityPrefix}${sourceId}`;
  let readinessKey = directKey;
  let readinessRecords = readinessIndex.get(directKey) ?? [];
  let canonicalSourceId = sourceId;
  let aliasId = null;

  if (readinessRecords.length === 0) {
    const alias = aliasIndex.get(directKey);
    if (alias) {
      canonicalSourceId = alias.canonical_source_id;
      aliasId = alias.legacy_source_id;
      readinessKey = `${authorityPrefix}${canonicalSourceId}`;
      readinessRecords = readinessIndex.get(readinessKey) ?? [];
    } else if (sourceId.startsWith('reviewed-public:')) {
      let reviewedCandidates = [...readinessIndex.entries()]
        .filter(([key]) => key.startsWith(authorityPrefix))
        .flatMap(([, rows]) => rows);
      let reviewedKey = `${authorityPrefix}<reviewed>`;

      if (reviewedCandidates.length === 0) {
        const countryPrefix = `${record.country_id}/`;
        reviewedCandidates = [...readinessIndex.entries()]
          .filter(([key]) => key.startsWith(countryPrefix))
          .flatMap(([, rows]) => rows);
        reviewedKey = `${countryPrefix}<reviewed>`;
      }

      const readiness = chooseReadiness(reviewedCandidates, record, reviewedKey);
      const readinessParts = readiness.authority_source_key.split('/');
      canonicalSourceId = readinessParts.at(-1);
      return {
        readiness,
        canonicalSourceId,
        aliasId: sourceId,
      };
    } else {
      throw new Error(`${record.meeting_id} source ${directKey} has no Calendar Readiness record or reviewed alias`);
    }
  }

  const readiness = chooseReadiness(readinessRecords, record, readinessKey);
  return { readiness, canonicalSourceId, aliasId };
}

function publicEligibility(readiness) {
  if (!PUBLIC_READINESS.has(readiness.readiness)) return `readiness:${readiness.readiness}`;
  if (!PUBLIC_AUTOMATION.has(readiness.automation_mode)) return `automation:${readiness.automation_mode}`;
  if (!PUBLIC_SOURCE_STATUS.has(readiness.source_status)) return `source_status:${readiness.source_status}`;
  if (readiness.confirmed_fields?.meeting_date !== true) return 'field:meeting_date';
  if (readiness.confirmed_fields?.racecourse !== true) return 'field:racecourse';
  return null;
}

function structuralPublicRank(record, hasDetail) {
  if (!['A', 'A+'].includes(record.capability_rank) || hasDetail) return record.capability_rank;
  if (record.first_race_time_local && record.last_race_time_local) return 'B+';
  if (record.first_race_time_local) return 'B';
  return 'C';
}

export function resolvePublicProjectionDecisionV1(record, policyData, readinessIndex, aliasIndex, hasDetail = false) {
  const resolved = resolveReadiness(record, readinessIndex, aliasIndex);
  const policy = findPolicy(record, policyData, resolved.canonicalSourceId);
  const maxPublicRank = record.capability_rank;
  const effectivePublicRank = structuralPublicRank(record, hasDetail);
  const eligibilityReason = publicEligibility(resolved.readiness);
  const include =
    !eligibilityReason &&
    policy.include_in_public_list === true &&
    !['not_listed', 'D'].includes(effectivePublicRank);
  const policyFields = policy.detail_fields ?? {};
  const confirmedFields = resolved.readiness.confirmed_fields ?? {};

  return {
    policy_id: policy.id,
    policy_max_public_rank: policy.max_public_rank,
    readiness_id: resolved.readiness.readiness_id,
    readiness_public_ceiling: resolved.readiness.public_ceiling,
    canonical_source_id: resolved.canonicalSourceId,
    source_alias_id: resolved.aliasId,
    max_public_rank: maxPublicRank,
    effective_public_rank: effectivePublicRank,
    include_in_public_list: include,
    exclusion_reason: include ? null : eligibilityReason ?? 'policy:excluded',
    show_race_name: policyFields.show_race_name === true && confirmedFields.race_name === true,
    show_distance: policyFields.show_distance === true && confirmedFields.distance === true,
    show_surface: policyFields.show_surface === true && confirmedFields.surface === true,
    show_course: policyFields.show_course === true && confirmedFields.course === true,
    show_live_label: policy.show_live_label === true,
    show_replay_label: policy.show_replay_label === true,
  };
}

function assertCanonicalDataset(dataset, schemaVersion, key, label) {
  assert(dataset?.schema_version === schemaVersion, `${label} must use ${schemaVersion}`);
  assert(Array.isArray(dataset[key]), `${label}.${key} must be an array`);
  assert(typeof dataset.generated_at === 'string' && !Number.isNaN(Date.parse(dataset.generated_at)), `${label}.generated_at must be a valid ISO date-time`);
}

function deterministicGeneratedAt(meetingsDataset, detailsDataset) {
  return [meetingsDataset.generated_at, detailsDataset.generated_at]
    .sort((left, right) => Date.parse(left) - Date.parse(right))
    .at(-1);
}

function sortMeetingRows(records) {
  return records.sort((left, right) =>
    `${left.date}:${left.country_id}:${left.racecourse_id}:${left.meeting_id}`.localeCompare(
      `${right.date}:${right.country_id}:${right.racecourse_id}:${right.meeting_id}`
    )
  );
}

function sortDetails(records) {
  return records.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id));
}

function assertUnique(records, key, label) {
  const seen = new Set();
  for (const record of records) {
    assert(typeof record[key] === 'string' && record[key], `${label} has no ${key}`);
    assert(!seen.has(record[key]), `${label} has duplicate ${key} ${record[key]}`);
    seen.add(record[key]);
  }
}

function assertDetailIdentity(meeting, detail) {
  for (const field of ['country_id', 'authority_id', 'racecourse_id', 'date', 'timezone']) {
    assert(detail[field] === meeting[field], `canonical detail ${detail.meeting_id} disagrees with meeting on ${field}`);
  }
}

export function projectPublicDetailV1(meeting, detail, decision) {
  if (!detail || !decision.include_in_public_list || !atLeast(decision.effective_public_rank, 'A')) return null;
  assert(Array.isArray(detail.timetable_rows), `${detail.meeting_id} canonical detail has no timetable_rows`);
  assertDetailIdentity(meeting, detail);

  const timetableRows = detail.timetable_rows.map((row) => {
    const publicRow = {
      label: row.label,
      post_time_local: row.post_time_local,
    };
    if (decision.show_race_name && row.race_name) publicRow.race_name = row.race_name;
    if (decision.show_distance && row.distance_m != null) publicRow.distance_m = row.distance_m;
    if (decision.show_surface && row.surface) publicRow.surface = row.surface;
    if (decision.show_course && row.course_label) publicRow.course_label = row.course_label;
    return publicRow;
  });

  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    max_public_rank: decision.max_public_rank,
    effective_public_rank: decision.effective_public_rank,
    policy_id: decision.policy_id,
    official_source_url: meeting.source_trace.official_source_url,
    source_status: meeting.source_trace.source_status,
    last_checked_date: meeting.freshness.last_checked_date,
    show_race_name: decision.show_race_name,
    show_distance: decision.show_distance,
    show_surface: decision.show_surface,
    show_course: decision.show_course,
    show_live_label: decision.show_live_label,
    show_replay_label: decision.show_replay_label,
    timetable_rows: timetableRows,
  };
}

export function projectPublicMeetingV1(meeting, detail, decision) {
  if (!decision.include_in_public_list) return null;
  const hasProjectedDetail = Boolean(projectPublicDetailV1(meeting, detail, decision));
  return {
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    max_public_rank: decision.max_public_rank,
    effective_public_rank: decision.effective_public_rank,
    first_race_time_local: atLeast(decision.effective_public_rank, 'B') ? meeting.first_race_time_local ?? null : null,
    last_race_time_local: atLeast(decision.effective_public_rank, 'B+') ? meeting.last_race_time_local ?? null : null,
    policy_id: decision.policy_id,
    source_status: meeting.source_trace.source_status,
    official_source_url: meeting.source_trace.official_source_url,
    last_checked_date: meeting.freshness.last_checked_date,
    detail_path: hasProjectedDetail ? `/timetable/meetings/${meeting.meeting_id}/` : null,
    show_live_label: decision.show_live_label,
    show_replay_label: decision.show_replay_label,
  };
}

function publicDatasetBase(existing, {
  schemaVersion,
  generatedAt,
  canonicalSource,
}) {
  return {
    ...(existing ?? {}),
    schema_version: schemaVersion,
    generated_at: generatedAt,
    canonical_source: canonicalSource,
    policy_source: 'src/data/publicationDisplayPolicies.json',
    readiness_source: 'data/static/calendar-readiness-registry.json',
    source_aliases_source: 'data/static/timetable-source-aliases-v1.json',
  };
}

export function reconcilePublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases,
  existingMeetingList = null,
  existingMeetingDetails = null,
  scopeMeetingIds = null,
  excludedMeetingIds = [],
  generatedAt = null,
}) {
  assertCanonicalDataset(canonicalMeetings, 'canonical-timetable-v0', 'meetings', 'canonical meetings');
  assertCanonicalDataset(canonicalDetails, 'canonical-meeting-details-v0', 'details', 'canonical details');
  assertUnique(canonicalMeetings.meetings, 'meeting_id', 'canonical meetings');
  assertUnique(canonicalDetails.details, 'meeting_id', 'canonical details');

  const readinessIndex = buildReadinessIndex(readinessRegistry);
  const aliasIndex = buildAliasIndex(sourceAliases);
  const canonicalById = new Map(canonicalMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
  const detailById = new Map(canonicalDetails.details.map((detail) => [detail.meeting_id, detail]));
  const existingMeetings = new Map((existingMeetingList?.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
  const existingDetails = new Map((existingMeetingDetails?.details ?? []).map((detail) => [detail.meeting_id, detail]));
  const excluded = new Set(excludedMeetingIds ?? []);

  const fullProjection = scopeMeetingIds == null;
  const scope = new Set(
    fullProjection
      ? [...canonicalById.keys(), ...existingMeetings.keys(), ...existingDetails.keys(), ...excluded]
      : [...scopeMeetingIds, ...excluded],
  );

  const publicMeetingById = fullProjection ? new Map() : new Map(existingMeetings);
  const publicDetailById = fullProjection ? new Map() : new Map(existingDetails);
  const decisions = [];
  const excludedMeetings = [];

  for (const meetingId of scope) {
    const meeting = canonicalById.get(meetingId) ?? null;
    if (!meeting || excluded.has(meetingId)) {
      publicMeetingById.delete(meetingId);
      publicDetailById.delete(meetingId);
      excludedMeetings.push({ meeting_id: meetingId, reason: excluded.has(meetingId) ? 'explicit:excluded' : 'canonical:missing' });
      continue;
    }

    const detail = detailById.get(meetingId) ?? null;
    const decision = resolvePublicProjectionDecisionV1(meeting, policyData, readinessIndex, aliasIndex, Boolean(detail));
    decisions.push({ meeting_id: meetingId, ...decision });

    if (!decision.include_in_public_list) {
      publicMeetingById.delete(meetingId);
      publicDetailById.delete(meetingId);
      excludedMeetings.push({ meeting_id: meetingId, reason: decision.exclusion_reason });
      continue;
    }

    const projectedDetail = projectPublicDetailV1(meeting, detail, decision);
    const projectedMeeting = projectPublicMeetingV1(meeting, detail, decision);
    publicMeetingById.set(meetingId, projectedMeeting);
    if (projectedDetail) publicDetailById.set(meetingId, projectedDetail);
    else publicDetailById.delete(meetingId);
  }

  const effectiveGeneratedAt = generatedAt ?? deterministicGeneratedAt(canonicalMeetings, canonicalDetails);
  const projectedMeetings = sortMeetingRows([...publicMeetingById.values()]);
  const projectedDetails = sortDetails([...publicDetailById.values()]);

  const snapshotDatasets = attachPublicationSnapshotV1(
    {
      ...publicDatasetBase(existingMeetingList, {
        schemaVersion: 'public-timetable-meeting-list-v0',
        generatedAt: effectiveGeneratedAt,
        canonicalSource: 'data/generated/timetable/canonical/meetings.json',
      }),
      meetings: projectedMeetings,
    },
    {
      ...publicDatasetBase(existingMeetingDetails, {
        schemaVersion: 'public-timetable-meeting-details-v0',
        generatedAt: effectiveGeneratedAt,
        canonicalSource: 'data/generated/timetable/canonical/meeting-details.json',
      }),
      details: projectedDetails,
    },
    effectiveGeneratedAt,
  );

  return {
    ...snapshotDatasets,
    audit: {
      schema_version: 'public-timetable-projection-audit-v2',
      generated_at: effectiveGeneratedAt,
      mode: fullProjection ? 'full' : 'scoped',
      scope_meeting_count: scope.size,
      canonical_meeting_count: canonicalMeetings.meetings.length,
      public_meeting_count: projectedMeetings.length,
      canonical_detail_count: canonicalDetails.details.length,
      public_detail_count: projectedDetails.length,
      excluded_meetings: excludedMeetings.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
      decisions: decisions.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
    },
  };
}

export function buildPublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases,
}) {
  return reconcilePublicProjectionV1({
    canonicalMeetings,
    canonicalDetails,
    policyData,
    readinessRegistry,
    sourceAliases,
  });
}

export const publicProjectionRanksV1 = RANKS;
