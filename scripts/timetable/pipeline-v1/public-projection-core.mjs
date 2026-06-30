const RANKS = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];
const PUBLIC_READINESS = new Set(['ready', 'prototype_ready', 'manual_ready']);
const PUBLIC_AUTOMATION = new Set(['automatic', 'semi_automatic', 'manual_import', 'manual_confirmation']);
const PUBLIC_SOURCE_STATUS = new Set(['verified', 'partial', 'stale']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rankIndex(rank, label) {
  const index = RANKS.indexOf(rank);
  assert(index >= 0, `${label} has unsupported rank ${rank}`);
  return index;
}

function lowerRank(...ranks) {
  assert(ranks.length > 0, 'lowerRank requires at least one rank');
  return ranks.reduce((lowest, rank) =>
    rankIndex(rank, 'rank') < rankIndex(lowest, 'rank') ? rank : lowest
  );
}

function atLeast(rank, minimum) {
  return rankIndex(rank, 'rank') >= rankIndex(minimum, 'minimum rank');
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
    assert(!index.has(record.authority_source_key), `duplicate Calendar Readiness authority_source_key ${record.authority_source_key}`);
    index.set(record.authority_source_key, record);
  }
  return index;
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
  const directKey = `${record.country_id}/${record.authority_id}/${sourceId}`;
  let readiness = readinessIndex.get(directKey);
  let canonicalSourceId = sourceId;
  let aliasId = null;

  if (!readiness) {
    const alias = aliasIndex.get(directKey);
    assert(alias, `${record.meeting_id} source ${directKey} has no Calendar Readiness record or reviewed alias`);
    canonicalSourceId = alias.canonical_source_id;
    aliasId = alias.legacy_source_id;
    const canonicalKey = `${record.country_id}/${record.authority_id}/${canonicalSourceId}`;
    readiness = readinessIndex.get(canonicalKey);
    assert(readiness, `${record.meeting_id} alias target ${canonicalKey} has no Calendar Readiness record`);
  }

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

function resolveDecision(record, policyData, readinessIndex, aliasIndex) {
  const resolved = resolveReadiness(record, readinessIndex, aliasIndex);
  const policy = findPolicy(record, policyData, resolved.canonicalSourceId);
  const maximumPublicRank = lowerRank(policy.max_public_rank, resolved.readiness.public_ceiling);
  const effectivePublicRank = lowerRank(record.capability_rank, maximumPublicRank);
  const eligibilityReason = publicEligibility(resolved.readiness);
  const include =
    !eligibilityReason &&
    policy.include_in_public_list === true &&
    !['not_listed', 'D'].includes(effectivePublicRank);
  const showAPlus = effectivePublicRank === 'A+';
  const fields = resolved.readiness.confirmed_fields ?? {};

  return {
    policy_id: policy.id,
    policy_max_public_rank: policy.max_public_rank,
    readiness_id: resolved.readiness.readiness_id,
    readiness_public_ceiling: resolved.readiness.public_ceiling,
    canonical_source_id: resolved.canonicalSourceId,
    source_alias_id: resolved.aliasId,
    max_public_rank: maximumPublicRank,
    effective_public_rank: effectivePublicRank,
    include_in_public_list: include,
    exclusion_reason: include ? null : eligibilityReason ?? 'policy:excluded',
    show_race_name: showAPlus && policy.a_plus_fields.show_race_name === true && fields.race_name === true,
    show_distance: showAPlus && policy.a_plus_fields.show_distance === true && fields.distance === true,
    show_surface: showAPlus && policy.a_plus_fields.show_surface === true && fields.surface === true,
    show_course: showAPlus && policy.a_plus_fields.show_course === true && fields.course === true,
    show_live_label: policy.show_live_label === true,
    show_replay_label: policy.show_replay_label === true
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

function projectDetail(detail, decision) {
  if (!decision.include_in_public_list || !['A', 'A+'].includes(decision.effective_public_rank)) return null;
  assert(Array.isArray(detail.timetable_rows), `${detail.meeting_id} canonical detail has no timetable_rows`);

  const timetableRows = detail.timetable_rows.map((row) => {
    const publicRow = {
      label: row.label,
      post_time_local: row.post_time_local
    };
    if (decision.show_race_name && row.race_name) publicRow.race_name = row.race_name;
    if (decision.show_distance && row.distance_m != null) publicRow.distance_m = row.distance_m;
    if (decision.show_surface && row.surface) publicRow.surface = row.surface;
    if (decision.show_course && row.course_label) publicRow.course_label = row.course_label;
    return publicRow;
  });

  return {
    meeting_id: detail.meeting_id,
    country_id: detail.country_id,
    authority_id: detail.authority_id,
    racecourse_id: detail.racecourse_id,
    date: detail.date,
    timezone: detail.timezone,
    capability_rank: detail.capability_rank,
    max_public_rank: decision.max_public_rank,
    effective_public_rank: decision.effective_public_rank,
    policy_id: decision.policy_id,
    official_source_url: detail.source_trace.official_source_url,
    source_status: detail.source_trace.source_status,
    last_checked_date: detail.freshness.last_checked_date,
    show_race_name: decision.show_race_name,
    show_distance: decision.show_distance,
    show_surface: decision.show_surface,
    show_course: decision.show_course,
    show_live_label: decision.show_live_label,
    show_replay_label: decision.show_replay_label,
    timetable_rows: timetableRows
  };
}

export function buildPublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases
}) {
  assertCanonicalDataset(canonicalMeetings, 'canonical-timetable-v0', 'meetings', 'canonical meetings');
  assertCanonicalDataset(canonicalDetails, 'canonical-meeting-details-v0', 'details', 'canonical details');
  assertUnique(canonicalMeetings.meetings, 'meeting_id', 'canonical meetings');
  assertUnique(canonicalDetails.details, 'meeting_id', 'canonical details');

  const readinessIndex = buildReadinessIndex(readinessRegistry);
  const aliasIndex = buildAliasIndex(sourceAliases);
  const meetingById = new Map(canonicalMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
  const decisions = new Map();
  const excluded = [];

  for (const meeting of canonicalMeetings.meetings) {
    const decision = resolveDecision(meeting, policyData, readinessIndex, aliasIndex);
    decisions.set(meeting.meeting_id, decision);
    if (!decision.include_in_public_list) {
      excluded.push({ meeting_id: meeting.meeting_id, reason: decision.exclusion_reason });
    }
  }

  const projectedDetails = [];
  for (const detail of canonicalDetails.details) {
    const meeting = meetingById.get(detail.meeting_id);
    assert(meeting, `canonical detail ${detail.meeting_id} has no canonical meeting`);
    for (const field of ['country_id', 'authority_id', 'racecourse_id', 'date', 'timezone']) {
      assert(detail[field] === meeting[field], `canonical detail ${detail.meeting_id} disagrees with meeting on ${field}`);
    }
    const detailDecision = resolveDecision(detail, policyData, readinessIndex, aliasIndex);
    const meetingDecision = decisions.get(detail.meeting_id);
    assert(detailDecision.max_public_rank === meetingDecision.max_public_rank, `detail ${detail.meeting_id} max public rank differs from meeting`);
    assert(detailDecision.effective_public_rank === meetingDecision.effective_public_rank, `detail ${detail.meeting_id} effective public rank differs from meeting`);
    const projected = projectDetail(detail, detailDecision);
    if (projected) projectedDetails.push(projected);
  }
  sortDetails(projectedDetails);
  const projectedDetailIds = new Set(projectedDetails.map((detail) => detail.meeting_id));

  const projectedMeetings = canonicalMeetings.meetings
    .map((meeting) => {
      const decision = decisions.get(meeting.meeting_id);
      if (!decision.include_in_public_list) return null;
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
        detail_path: projectedDetailIds.has(meeting.meeting_id) ? `/timetable/meetings/${meeting.meeting_id}/` : null,
        show_live_label: decision.show_live_label,
        show_replay_label: decision.show_replay_label
      };
    })
    .filter(Boolean);
  sortMeetingRows(projectedMeetings);

  const generatedAt = deterministicGeneratedAt(canonicalMeetings, canonicalDetails);
  return {
    meetingListDataset: {
      schema_version: 'public-timetable-meeting-list-v0',
      generated_at: generatedAt,
      canonical_source: 'data/generated/timetable/canonical/meetings.json',
      policy_source: 'src/data/publicationDisplayPolicies.json',
      readiness_source: 'data/static/calendar-readiness-registry.json',
      source_aliases_source: 'data/static/timetable-source-aliases-v1.json',
      meetings: projectedMeetings
    },
    meetingDetailsDataset: {
      schema_version: 'public-timetable-meeting-details-v0',
      generated_at: generatedAt,
      canonical_source: 'data/generated/timetable/canonical/meeting-details.json',
      policy_source: 'src/data/publicationDisplayPolicies.json',
      readiness_source: 'data/static/calendar-readiness-registry.json',
      source_aliases_source: 'data/static/timetable-source-aliases-v1.json',
      details: projectedDetails
    },
    audit: {
      schema_version: 'public-timetable-projection-audit-v1',
      generated_at: generatedAt,
      canonical_meeting_count: canonicalMeetings.meetings.length,
      public_meeting_count: projectedMeetings.length,
      canonical_detail_count: canonicalDetails.details.length,
      public_detail_count: projectedDetails.length,
      excluded_meetings: excluded.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
      decisions: [...decisions.entries()]
        .map(([meeting_id, decision]) => ({ meeting_id, ...decision }))
        .sort((left, right) => left.meeting_id.localeCompare(right.meeting_id))
    }
  };
}

export const publicProjectionRanksV1 = RANKS;
