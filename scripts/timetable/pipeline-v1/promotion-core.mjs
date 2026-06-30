const RANK_ORDER = new Map([
  ['C', 0],
  ['B', 1],
  ['B+', 2],
  ['A', 3],
  ['A+', 4]
]);

const ALLOWED_READINESS = new Set(['ready', 'prototype_ready', 'manual_ready']);
const BLOCKED_AUTOMATION = new Set(['blocked', 'link_only', 'not_applicable']);
const BLOCKED_SOURCE_STATUS = new Set(['not_verified', 'unavailable']);
const PROMOTION_TARGET = 'canonical-timetable-v0';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseDateTime(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label} must be a non-empty ISO date-time`);
  const timestamp = Date.parse(value);
  assert(!Number.isNaN(timestamp), `${label} must be a valid ISO date-time`);
  return timestamp;
}

function rankAtMost(actual, maximum, label) {
  assert(RANK_ORDER.has(actual), `${label} has unsupported rank ${actual}`);
  assert(RANK_ORDER.has(maximum), `${label} has unsupported reviewed maximum ${maximum}`);
  assert(RANK_ORDER.get(actual) <= RANK_ORDER.get(maximum), `${label} rank ${actual} exceeds reviewed maximum ${maximum}`);
}

function hostOf(value, label) {
  try {
    const url = new URL(value);
    assert(url.protocol === 'https:', `${label} must use HTTPS`);
    return url.hostname.toLowerCase();
  } catch (error) {
    if (error instanceof Error && error.message.includes('must use HTTPS')) throw error;
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
}

function sourceStatusToCanonical(value) {
  if (value === 'verified') return 'verified';
  if (value === 'partial') return 'partial';
  if (value === 'stale') return 'stale';
  if (value === 'unavailable') return 'unavailable';
  return 'unknown';
}

function extractionMethodToCanonical(value) {
  if (value === 'manual_import') return 'manual_review';
  if (value === 'fixture_parser') return 'normalizer';
  if (value === 'adapter_candidate') return 'adapter';
  if (value === 'reviewed_snapshot') return 'snapshot';
  throw new Error(`unsupported extraction method ${value}`);
}

function metadataStatus(confidence) {
  if (confidence === 'high') return 'verified';
  if (confidence === 'medium') return 'partial';
  return 'pending';
}

function assertDataset(dataset, schemaVersion, collectionKey, label) {
  assert(dataset && typeof dataset === 'object', `${label} must be an object`);
  assert(dataset.schema_version === schemaVersion, `${label} must use ${schemaVersion}`);
  assert(Array.isArray(dataset[collectionKey]), `${label}.${collectionKey} must be an array`);
  if ('input_sources' in dataset) assert(Array.isArray(dataset.input_sources), `${label}.input_sources must be an array`);
}

function findAuthoritySource(candidate, inventory) {
  const matches = inventory.records.filter((record) =>
    record.country_id === candidate.country_id &&
    record.authority_id === candidate.authority_id &&
    record.official_source_id === candidate.source_id
  );
  assert(matches.length === 1, `candidate source must match exactly one authority/source inventory record: ${candidate.country_id}/${candidate.authority_id}/${candidate.source_id}`);
  return matches[0];
}

function findReadiness(candidate, registry) {
  const key = `${candidate.country_id}/${candidate.authority_id}/${candidate.source_id}`;
  const matches = registry.records.filter((record) => record.authority_source_key === key);
  assert(matches.length === 1, `candidate source must match exactly one Calendar Readiness record: ${key}`);
  return matches[0];
}

function assertConfirmedFields(record, readiness) {
  const fields = readiness.confirmed_fields ?? {};
  assert(fields.meeting_date === true, `${record.candidate_id} source does not confirm meeting_date`);
  assert(fields.racecourse === true, `${record.candidate_id} source does not confirm racecourse`);

  if (record.capability_rank !== 'C') {
    assert(fields.first_race_time === true, `${record.candidate_id} source does not confirm first_race_time`);
  }
  if (['B+', 'A', 'A+'].includes(record.capability_rank)) {
    assert(fields.last_race_time === true, `${record.candidate_id} source does not confirm last_race_time`);
  }
  if (['A', 'A+'].includes(record.capability_rank)) {
    assert(fields.per_race_post_times === true, `${record.candidate_id} source does not confirm per_race_post_times`);
  }

  for (const [index, row] of (record.timetable_rows ?? []).entries()) {
    if (row.race_name != null) assert(fields.race_name === true, `${record.candidate_id} row ${index + 1} contains unconfirmed race_name`);
    if (row.distance_m != null) assert(fields.distance === true, `${record.candidate_id} row ${index + 1} contains unconfirmed distance`);
    if (row.surface != null) assert(fields.surface === true, `${record.candidate_id} row ${index + 1} contains unconfirmed surface`);
    if (row.course_label != null) assert(fields.course === true, `${record.candidate_id} row ${index + 1} contains unconfirmed course`);
  }
}

function assertRankShape(record) {
  const rows = record.timetable_rows ?? [];
  if (record.capability_rank === 'C') {
    assert(record.first_race_time_local === null && record.last_race_time_local === null && rows.length === 0, `${record.candidate_id} C record contains timetable detail`);
  } else if (record.capability_rank === 'B') {
    assert(typeof record.first_race_time_local === 'string' && record.last_race_time_local === null && rows.length === 0, `${record.candidate_id} B record must contain first time only`);
  } else if (record.capability_rank === 'B+') {
    assert(typeof record.first_race_time_local === 'string' && typeof record.last_race_time_local === 'string' && rows.length === 0, `${record.candidate_id} B+ record must contain first and last time only`);
  } else {
    assert(rows.length > 0, `${record.candidate_id} A/A+ record requires timetable rows`);
    assert(record.first_race_time_local === rows[0].post_time_local, `${record.candidate_id} first time must equal first timetable row`);
    assert(record.last_race_time_local === rows.at(-1).post_time_local, `${record.candidate_id} last time must equal last timetable row`);
  }
}

function assertIdentityCollision(existing, record, label) {
  if (!existing) return;
  for (const field of ['country_id', 'authority_id', 'racecourse_id', 'date', 'timezone']) {
    assert(existing[field] === record[field], `${label} ${record.meeting_id} identity collision on ${field}`);
  }
}

function makeSourceTrace(record, authoritySource, inputPath) {
  return {
    source_id: record.source.source_id,
    route_id: null,
    source_status: sourceStatusToCanonical(authoritySource.source_status),
    official_source_url: record.source.official_url,
    source_label: authoritySource.authority_name_en ?? null,
    extraction_method: extractionMethodToCanonical(record.source.extraction_method),
    source_snapshot_path: null,
    normalized_from_path: inputPath
  };
}

function makeFreshness(record, review) {
  return {
    last_checked_date: record.source.checked_at.slice(0, 10),
    generated_at: record.source.checked_at,
    stale_after_date: null,
    freshness_note: `Promoted from approved timetable-candidate-v1 by ${review.reviewer} at ${review.reviewed_at}.`
  };
}

function makeMeeting(record, authoritySource, inputPath, review) {
  return {
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    display_status: ['A', 'A+'].includes(record.capability_rank) ? 'displayable' : 'partial',
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    source_trace: makeSourceTrace(record, authoritySource, inputPath),
    freshness: makeFreshness(record, review),
    notes: record.notes || null
  };
}

function makeDetail(record, authoritySource, inputPath, review) {
  if (!['A', 'A+'].includes(record.capability_rank)) return null;
  return {
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    source_trace: makeSourceTrace(record, authoritySource, inputPath),
    freshness: makeFreshness(record, review),
    timetable_rows: record.timetable_rows.map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name ?? null,
      distance_m: row.distance_m ?? null,
      surface: row.surface ?? null,
      course_label: row.course_label ?? null,
      metadata_status: metadataStatus(record.confidence),
      source_label: null
    })),
    summary_note: record.notes || null
  };
}

function sortMeetings(records) {
  return records.sort((a, b) => `${a.date}:${a.country_id}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.country_id}:${b.racecourse_id}:${b.meeting_id}`));
}

export function promoteApprovedCandidateV1({
  candidate,
  meetingsDataset,
  detailsDataset,
  authorityInventory,
  readinessRegistry,
  inputPath
}) {
  assert(candidate?.schema_version === 'timetable-candidate-v1', 'candidate must use timetable-candidate-v1');
  assert(authorityInventory?.schema_version === 'authority-source-inventory-v1', 'authority inventory schema is invalid');
  assert(readinessRegistry?.schema_version === 'calendar-readiness-registry-v1', 'Calendar Readiness registry schema is invalid');
  assertDataset(meetingsDataset, 'canonical-timetable-v0', 'meetings', 'meetings dataset');
  assertDataset(detailsDataset, 'canonical-meeting-details-v0', 'details', 'meeting-details dataset');
  assert(typeof inputPath === 'string' && inputPath.trim() && !inputPath.includes('..'), 'inputPath must be a repository-relative path');

  const review = candidate.review ?? {};
  assert(review.status === 'approved', 'candidate envelope is not approved');
  assert(typeof review.reviewer === 'string' && review.reviewer.trim(), 'approved candidate requires reviewer');
  const reviewedAt = parseDateTime(review.reviewed_at, 'review.reviewed_at');
  assert(review.promotion_target === PROMOTION_TARGET, `promotion_target must be ${PROMOTION_TARGET}`);
  const generatedAt = parseDateTime(candidate.generated_at, 'candidate.generated_at');
  assert(generatedAt <= reviewedAt, 'candidate.generated_at must not be after review.reviewed_at');
  assert(Array.isArray(candidate.records) && candidate.records.length > 0, 'approved candidate must contain at least one record');
  assert(candidate.records.every((record) => record.review_status === 'approved'), 'approved envelope may contain approved records only');

  const authoritySource = findAuthoritySource(candidate, authorityInventory);
  const readiness = findReadiness(candidate, readinessRegistry);
  assert(authoritySource.adapter_candidate_status !== 'blocked', 'authority/source inventory blocks candidate promotion');
  assert(ALLOWED_READINESS.has(readiness.readiness), `Calendar Readiness ${readiness.readiness} does not permit canonical promotion`);
  assert(!BLOCKED_AUTOMATION.has(readiness.automation_mode), `automation mode ${readiness.automation_mode} does not permit canonical promotion`);
  assert(!BLOCKED_SOURCE_STATUS.has(readiness.source_status), `source status ${readiness.source_status} does not permit canonical promotion`);
  assert(readiness.system_id && typeof readiness.system_id === 'string', 'Calendar Readiness system_id is required');
  assert(authoritySource.capability_rank === readiness.technical_rank, 'authority/source and readiness technical ranks disagree');

  const existingMeetings = new Map(meetingsDataset.meetings.map((record) => [record.meeting_id, record]));
  const existingDetails = new Map(detailsDataset.details.map((record) => [record.meeting_id, record]));
  const candidateMeetingIds = new Set();
  const promotedMeetings = [];
  const promotedDetails = [];
  const removedDetailIds = [];

  for (const record of candidate.records) {
    assert(record.country_id === candidate.country_id, `${record.candidate_id} country_id differs from envelope`);
    assert(record.authority_id === candidate.authority_id, `${record.candidate_id} authority_id differs from envelope`);
    assert(record.source?.source_id === candidate.source_id, `${record.candidate_id} source_id differs from envelope`);
    assert(record.racing_system_id === readiness.system_id, `${record.candidate_id} racing_system_id differs from Calendar Readiness`);
    assert(record.timezone === candidate.candidate_window.timezone, `${record.candidate_id} timezone differs from candidate window`);
    assert(record.date >= candidate.candidate_window.start_date && record.date < candidate.candidate_window.end_date_exclusive, `${record.candidate_id} date is outside candidate window`);
    assert(!candidateMeetingIds.has(record.meeting_id), `duplicate meeting_id in approved candidate: ${record.meeting_id}`);
    candidateMeetingIds.add(record.meeting_id);

    if (readiness.racecourse_ids.length > 0) {
      assert(readiness.racecourse_ids.includes(record.racecourse_id), `${record.candidate_id} racecourse_id is outside reviewed readiness scope`);
    }

    rankAtMost(record.capability_rank, authoritySource.capability_rank, record.candidate_id);
    rankAtMost(record.capability_rank, readiness.technical_rank, record.candidate_id);
    assertRankShape(record);
    assertConfirmedFields(record, readiness);

    const checkedAt = parseDateTime(record.source.checked_at, `${record.candidate_id}.source.checked_at`);
    assert(checkedAt <= reviewedAt, `${record.candidate_id} source.checked_at must not be after review.reviewed_at`);
    const minimumCheckedDate = [authoritySource.last_checked_date, readiness.checked_date].sort().at(-1);
    assert(record.source.checked_at.slice(0, 10) >= minimumCheckedDate, `${record.candidate_id} source check predates reviewed source records`);
    assert(hostOf(record.source.official_url, `${record.candidate_id}.source.official_url`) === hostOf(authoritySource.official_source_url, 'authority source URL'), `${record.candidate_id} official source hostname differs from inventory`);

    assertIdentityCollision(existingMeetings.get(record.meeting_id), record, 'canonical meeting');
    assertIdentityCollision(existingDetails.get(record.meeting_id), record, 'canonical meeting detail');

    promotedMeetings.push(makeMeeting(record, authoritySource, inputPath, review));
    const detail = makeDetail(record, authoritySource, inputPath, review);
    if (detail) promotedDetails.push(detail);
    else if (existingDetails.has(record.meeting_id)) removedDetailIds.push(record.meeting_id);
  }

  for (const record of promotedMeetings) existingMeetings.set(record.meeting_id, record);
  for (const meetingId of removedDetailIds) existingDetails.delete(meetingId);
  for (const record of promotedDetails) existingDetails.set(record.meeting_id, record);

  const inputSources = [...new Set([...(meetingsDataset.input_sources ?? []), inputPath])].sort();
  const detailInputSources = [...new Set([...(detailsDataset.input_sources ?? []), inputPath])].sort();

  return {
    meetingsDataset: {
      ...meetingsDataset,
      generated_at: review.reviewed_at,
      input_sources: inputSources,
      meetings: sortMeetings([...existingMeetings.values()])
    },
    detailsDataset: {
      ...detailsDataset,
      generated_at: review.reviewed_at,
      input_sources: detailInputSources,
      details: sortMeetings([...existingDetails.values()])
    },
    summary: {
      schema_version: 'timetable-promotion-summary-v1',
      reviewed_at: review.reviewed_at,
      reviewer: review.reviewer,
      input_path: inputPath,
      source_key: `${candidate.country_id}/${candidate.authority_id}/${candidate.source_id}`,
      promoted_meeting_ids: promotedMeetings.map((record) => record.meeting_id).sort(),
      promoted_detail_ids: promotedDetails.map((record) => record.meeting_id).sort(),
      removed_detail_ids: removedDetailIds.sort(),
      public_projection_written: false
    }
  };
}

export const promotionTargetV1 = PROMOTION_TARGET;
