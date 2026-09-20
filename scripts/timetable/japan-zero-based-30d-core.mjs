import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import {
  acceptCanonicalObservationV1,
  normalizeStoredCanonicalV1,
  retainCurrentAcquisitionStateV1,
} from './canonical-acceptance.mjs';

const RANKS = ['C', 'B', 'B+', 'A', 'A+'];
export const JAPAN_GROUPS = ['jra', 'nar-standard', 'banei'];
export const OUTCOMES = ['add', 'update', 'no_op', 'details_pending', 'acquisition_failed', 'conflict'];

const JAPAN_PUBLIC_POLICIES = {
  jra: 'jra-reviewed-a-plus',
  'nar-local-government-racing': 'nar-reviewed-a-plus',
  'banei-tokachi': 'banei-reviewed-a-plus',
};

function rank(value) {
  const index = RANKS.indexOf(value);
  return index < 0 ? 0 : index;
}

export function deriveJapanBestAvailableRank(meeting, rows = meeting?.timetable_rows ?? []) {
  return deriveBestAvailableRank(meeting, rows);
}

function safeRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    label: row?.label ?? null,
    post_time_local: row?.post_time_local ?? null,
    race_name: row?.race_name ?? null,
    distance_m: row?.distance_m ?? null,
    surface: row?.surface ?? null,
    course_label: row?.course_label ?? null,
    metadata_status: row?.metadata_status ?? 'verified',
    source_label: row?.source_label ?? null,
  }));
}

const JAPAN_ACQUISITION_PROFILE = Object.freeze({
  technical_capability_rank: 'A+',
  supported_observation_ranks: ['C', 'B', 'B+', 'A', 'A+'],
});

export function classifyJapanAcquisitionCompletion({
  capabilityRank,
  outcome = null,
  reason = null,
  acquisitionAttempt = undefined,
}) {
  const status = outcome === 'details_pending'
    ? 'details_pending'
    : outcome === 'acquisition_failed'
      ? 'acquisition_failed'
      : outcome === 'conflict'
        ? 'conflict'
        : 'available';
  const record = {
    capability_rank: capabilityRank,
    detail_observation: {
      status,
      ...(reason ? { reason } : {}),
    },
    ...(acquisitionAttempt !== undefined ? { acquisition_attempt: acquisitionAttempt } : {}),
  };
  return classifyAcquisitionCompletion(record, JAPAN_ACQUISITION_PROFILE);
}

export function assertJapanCompleteness(official, reconciliations, resultingPublic = []) {
  const officialIds = new Set(official.map((row) => row.meeting_id));
  const counts = new Map();
  for (const row of reconciliations) {
    if (!OUTCOMES.includes(row.outcome)) throw new Error(`invalid Japan reconciliation outcome: ${row.outcome}`);
    counts.set(row.meeting_id, (counts.get(row.meeting_id) ?? 0) + 1);
  }
  const missing = official.filter((row) => (counts.get(row.meeting_id) ?? 0) !== 1);
  if (missing.length) throw new Error(`Japan reconciliation incomplete: ${missing.map((row) => row.meeting_id).join(', ')}`);
  const unexpected = reconciliations.filter((row) => !officialIds.has(row.meeting_id));
  if (unexpected.length) throw new Error(`Japan reconciliation contains non-official meetings: ${unexpected.map((row) => row.meeting_id).join(', ')}`);

  const publicById = new Map(resultingPublic.map((row) => [row.meeting_id, row]));
  const missingPublic = official.filter((row) => !publicById.has(row.meeting_id));
  if (missingPublic.length) throw new Error(`Japan public completeness failed: ${missingPublic.map((row) => row.meeting_id).join(', ')}`);
  const lower = reconciliations.filter((row) => {
    if (!row.official_rank) return false;
    const publicRank = publicById.get(row.meeting_id)?.capability_rank ?? row.public_rank;
    return rank(publicRank) < rank(row.official_rank);
  });
  if (lower.length) throw new Error(`Japan rank completeness failed: ${lower.map((row) => row.meeting_id).join(', ')}`);
}

function isoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`invalid execution date: ${value}`);
  }
  return value;
}

export function japanLocalDateFromInstant(value) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error(`invalid Japan freshness instant: ${value}`);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const fields = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function japan30DayRange(executionDate) {
  const start = isoDate(executionDate);
  const cursor = new Date(`${start}T00:00:00Z`);
  const dates = Array.from({ length: 30 }, () => {
    const date = cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return date;
  });
  return { start, end_exclusive: cursor.toISOString().slice(0, 10), dates };
}

function sourceTrace(meeting, previous = {}) {
  return {
    ...previous,
    source_id: meeting.source_id ?? previous.source_id ?? `japan-${meeting.acquisition_group ?? 'official'}-30d`,
    route_id: previous.route_id ?? null,
    source_status: 'verified',
    official_source_url: meeting.official_source_url,
    source_label: meeting.source_label ?? previous.source_label ?? null,
    extraction_method: 'adapter',
    source_snapshot_path: null,
    normalized_from_path: 'scripts/timetable/run-japan-zero-based-30d.mjs',
  };
}

function safeMeeting(meeting, checkedAt, previous = null) {
  const rows = safeRows(meeting.timetable_rows);
  const firstRaceTime = meeting.first_race_time_local ?? rows[0]?.post_time_local ?? null;
  const lastRaceTime = meeting.last_race_time_local ?? rows.at(-1)?.post_time_local ?? null;
  const capabilityRank = deriveJapanBestAvailableRank({
    ...meeting,
    first_race_time_local: firstRaceTime,
    last_race_time_local: lastRaceTime,
  }, rows);

  return {
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racing_system_id: meeting.racing_system_id ?? previous?.racing_system_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: capabilityRank,
    display_status: capabilityRank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: firstRaceTime,
    last_race_time_local: lastRaceTime,
    source_trace: sourceTrace(meeting, previous?.source_trace),
    freshness: {
      last_checked_date: japanLocalDateFromInstant(checkedAt),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: 'Deterministically reconciled from the official Japan 30-day acquisition run.',
    },
    ...(meeting.evidence_support ? { evidence_support: structuredClone(meeting.evidence_support) } : {}),
    ...(meeting.evidence_changes ? { evidence_changes: structuredClone(meeting.evidence_changes) } : {}),
    notes: previous?.notes ?? 'Deterministic public-safe timetable fields reconciled from the official source.',
  };
}

function detailRecord(meeting, rows, checkedAt) {
  return {
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: meeting.capability_rank,
    source_trace: meeting.source_trace,
    freshness: meeting.freshness,
    ...(meeting.evidence_support ? { evidence_support: structuredClone(meeting.evidence_support) } : {}),
    ...(meeting.evidence_changes ? { evidence_changes: structuredClone(meeting.evidence_changes) } : {}),
    timetable_rows: safeRows(rows),
    summary_note: 'Deterministic public-safe race programme fields reconciled from the official source.',
  };
}

function publicPolicyId(authorityId) {
  const value = JAPAN_PUBLIC_POLICIES[authorityId];
  if (!value) throw new Error(`missing Japan public display policy for authority: ${authorityId}`);
  return value;
}

function safeEffectivePublicRank(meeting, detail) {
  return deriveJapanBestAvailableRank(meeting, detail?.timetable_rows ?? []);
}

function publicTimetableRows(detail, effectivePublicRank) {
  const aPlus = effectivePublicRank === 'A+';
  return detail.timetable_rows.map((row) => {
    const value = { label: row.label, post_time_local: row.post_time_local };
    if (aPlus) {
      value.race_name = row.race_name;
      value.distance_m = row.distance_m;
      value.surface = row.surface;
      value.course_label = row.course_label;
    }
    return value;
  });
}

function publicMeetingRecord(meeting, detail) {
  const effectivePublicRank = safeEffectivePublicRank(meeting, detail);
  const hasDetail = ['A', 'A+'].includes(effectivePublicRank);
  return {
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: meeting.capability_rank,
    max_public_rank: meeting.capability_rank,
    effective_public_rank: effectivePublicRank,
    first_race_time_local: meeting.first_race_time_local ?? null,
    last_race_time_local: meeting.last_race_time_local ?? null,
    policy_id: publicPolicyId(meeting.authority_id),
    source_status: meeting.source_trace?.source_status ?? 'verified',
    official_source_url: meeting.source_trace?.official_source_url ?? null,
    last_checked_date: meeting.freshness?.last_checked_date ?? null,
    detail_path: hasDetail ? `/timetable/meetings/${meeting.meeting_id}/` : null,
    show_live_label: false,
    show_replay_label: false,
  };
}

function publicDetailRecord(meeting, detail, publicMeeting) {
  if (!detail || !['A', 'A+'].includes(publicMeeting.effective_public_rank)) return null;
  const aPlus = publicMeeting.effective_public_rank === 'A+';
  return {
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: meeting.capability_rank,
    max_public_rank: meeting.capability_rank,
    effective_public_rank: publicMeeting.effective_public_rank,
    policy_id: publicMeeting.policy_id,
    official_source_url: publicMeeting.official_source_url,
    source_status: publicMeeting.source_status,
    last_checked_date: publicMeeting.last_checked_date,
    show_race_name: aPlus,
    show_distance: aPlus,
    show_surface: aPlus,
    show_course: aPlus,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows: publicTimetableRows(detail, publicMeeting.effective_public_rank),
  };
}

function comparableMeeting(row) {
  if (!row) return null;
  return JSON.stringify({
    rank: row.capability_rank,
    first: row.first_race_time_local ?? null,
    last: row.last_race_time_local ?? null,
    source: row.source_trace?.official_source_url ?? row.official_source_url ?? null,
  });
}

function comparableRows(row) {
  return JSON.stringify((row?.timetable_rows ?? []).map(({ label, post_time_local, race_name, distance_m, surface, course_label }) => ({
    label, post_time_local, race_name, distance_m, surface, course_label,
  })));
}

function isFailure(value) {
  return value?.status === 'acquisition_failed' || value?.status === 'race_number_discovery_incomplete';
}
function isPending(value) {
  return value?.status === 'details_pending' || value?.status === 'scheduled_pending_details';
}
function isRetryable(value) {
  return isFailure(value) || value?.status === 'scheduled_pending_details';
}

async function inspectWithRetry(adapter, meeting, attempts, retryDelayMs) {
  let result;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { result = await adapter.inspect(meeting, { attempt }); }
    catch (error) { result = { status: 'acquisition_failed', reason: String(error?.message ?? error) }; }
    if (!isRetryable(result) || attempt === attempts) break;
    if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
  const acquisitionAttempt = result?.acquisition_attempt ?? result?.meeting?.acquisition_attempt;
  const attemptMetadata = acquisitionAttempt !== undefined ? { acquisition_attempt: acquisitionAttempt } : {};
  if (isPending(result)) return { outcome: 'details_pending', reason: result.reason ?? result.status, ...attemptMetadata };
  if (isFailure(result) || !result) return { outcome: 'acquisition_failed', reason: result?.reason ?? result?.status ?? 'empty_detail_response', ...attemptMetadata };
  if (result.status === 'conflict') return { outcome: 'conflict', reason: result.reason, ...attemptMetadata };
  if (result.status !== 'ok' || !result.meeting) return { outcome: 'acquisition_failed', reason: result.reason ?? `unexpected_status:${result.status}`, ...attemptMetadata };
  return { outcome: null, meeting: result.meeting, ...attemptMetadata };
}

function ensureOfficialScheduleRow({ officialMeeting, checkedAt, canonicalMap, details, publicMap }) {
  const previousCanonical = canonicalMap.get(officialMeeting.meeting_id) ?? null;
  const previousDetail = details.get(officialMeeting.meeting_id) ?? null;
  if (previousCanonical) {
    if (!publicMap.has(officialMeeting.meeting_id)) {
      publicMap.set(officialMeeting.meeting_id, {
        ...previousCanonical,
        effective_public_rank: previousCanonical.capability_rank,
        max_public_rank: previousCanonical.capability_rank,
      });
    }
    return publicMap.get(officialMeeting.meeting_id)?.capability_rank ?? previousCanonical.capability_rank;
  }

  const scheduleOnly = safeMeeting({ ...officialMeeting, timetable_rows: [] }, checkedAt);
  const accepted = acceptCanonicalObservationV1({
    previousMeeting: previousCanonical,
    previousDetail,
    candidateMeeting: scheduleOnly,
    candidateDetail: null,
  });
  canonicalMap.set(scheduleOnly.meeting_id, accepted.meeting);
  if (accepted.detail) details.set(scheduleOnly.meeting_id, accepted.detail);
  publicMap.set(scheduleOnly.meeting_id, {
    ...accepted.meeting,
    effective_public_rank: accepted.meeting.capability_rank,
    max_public_rank: accepted.meeting.capability_rank,
  });
  return accepted.meeting.capability_rank;
}

/** Official discovery completes before canonical/public state is read or consulted. */
export async function runJapanZeroBased30d({
  executionDate,
  adapters,
  loadExisting = () => ({ canonical: [], public: [] }),
  attempts = 3,
  retryDelayMs = 250,
  checkedAt = new Date().toISOString(),
}) {
  const range = japan30DayRange(executionDate);
  for (const group of JAPAN_GROUPS) {
    if (!adapters?.[group]?.discover || !adapters[group]?.inspect) throw new Error(`missing official adapter: ${group}`);
  }

  const discoveredByGroup = {};
  for (const group of JAPAN_GROUPS) {
    const discovered = await adapters[group].discover({ ...range });
    if (!Array.isArray(discovered)) throw new Error(`${group} discovery did not return an array`);
    discoveredByGroup[group] = discovered
      .filter((row) => range.dates.includes(row.date))
      .map((row) => ({ ...row, acquisition_group: group }));
  }

  const official = JAPAN_GROUPS.flatMap((group) => discoveredByGroup[group]);
  const ids = new Set();
  for (const meeting of official) {
    if (!meeting.meeting_id || ids.has(meeting.meeting_id)) throw new Error(`duplicate or missing official meeting id: ${meeting.meeting_id}`);
    ids.add(meeting.meeting_id);
  }

  const existing = await loadExisting();
  const canonicalMap = new Map((existing.canonical ?? []).map((row) => [row.meeting_id, row]));
  const publicMap = new Map((existing.public ?? []).map((row) => [row.meeting_id, row]));
  const details = new Map((existing.details ?? []).map((row) => [row.meeting_id, row]));
  const publicDetails = new Map((existing.publicDetails ?? []).map((row) => [row.meeting_id, row]));
  const reconciliations = [];

  for (const officialMeeting of official) {
    let previousCanonical = canonicalMap.get(officialMeeting.meeting_id);
    let previousDetail = details.get(officialMeeting.meeting_id);
    const normalizedStored = normalizeStoredCanonicalV1(previousCanonical, previousDetail);
    if (normalizedStored.changed) {
      previousCanonical = normalizedStored.meeting;
      previousDetail = normalizedStored.detail;
      canonicalMap.set(officialMeeting.meeting_id, previousCanonical);
      if (previousDetail) details.set(officialMeeting.meeting_id, previousDetail);
      else details.delete(officialMeeting.meeting_id);
    }
    const inspected = await inspectWithRetry(adapters[officialMeeting.acquisition_group], officialMeeting, attempts, retryDelayMs);
    if (inspected.outcome) {
      const publicRank = ensureOfficialScheduleRow({ officialMeeting, checkedAt, canonicalMap, details, publicMap });
      const retainedCanonical = canonicalMap.get(officialMeeting.meeting_id);
      const observedScheduleRank = deriveJapanBestAvailableRank(
        safeMeeting({ ...officialMeeting, timetable_rows: [] }, checkedAt, retainedCanonical),
        [],
      );
      const acquisitionCompletion = classifyJapanAcquisitionCompletion({
        capabilityRank: observedScheduleRank,
        outcome: inspected.outcome,
        reason: inspected.reason,
        acquisitionAttempt: inspected.acquisition_attempt,
      });
      const retained = retainCurrentAcquisitionStateV1(retainedCanonical, {
        acquisitionCompletion,
        ...(inspected.acquisition_attempt !== undefined ? { acquisitionAttempt: inspected.acquisition_attempt } : {}),
      });
      canonicalMap.set(officialMeeting.meeting_id, retained.meeting);
      reconciliations.push({
        meeting_id: officialMeeting.meeting_id,
        acquisition_group: officialMeeting.acquisition_group,
        outcome: inspected.outcome,
        reason: inspected.reason,
        official_rank: 'C',
        public_rank: publicRank,
        acquisition_completion: acquisitionCompletion.disposition,
      });
      continue;
    }

    const candidate = safeMeeting({ ...officialMeeting, ...inspected.meeting }, checkedAt, previousCanonical);
    const acquisitionCompletion = classifyJapanAcquisitionCompletion({
      capabilityRank: candidate.capability_rank,
      acquisitionAttempt: inspected.acquisition_attempt,
    });
    const candidateDetail = (inspected.meeting.timetable_rows ?? []).length
      ? detailRecord(candidate, inspected.meeting.timetable_rows, checkedAt)
      : null;
    const accepted = acceptCanonicalObservationV1({
      previousMeeting: previousCanonical,
      previousDetail,
      candidateMeeting: candidate,
      candidateDetail,
      acquisitionCompletion,
      ...(inspected.acquisition_attempt !== undefined ? { acquisitionAttempt: inspected.acquisition_attempt } : {}),
      evidenceChanges: candidate.evidence_changes ?? [],
    });
    const normalized = accepted.meeting;
    const normalizedDetail = accepted.detail;
    const changed = !previousCanonical
      || comparableMeeting(previousCanonical) !== comparableMeeting(normalized)
      || comparableRows(previousDetail) !== comparableRows(normalizedDetail);
    const outcome = !previousCanonical
      ? 'add'
      : accepted.decision === 'retained_stronger_evidence'
        ? 'conflict'
        : changed ? 'update' : 'no_op';

    canonicalMap.set(normalized.meeting_id, normalized);
    const previousPublic = publicMap.get(normalized.meeting_id) ?? {};
    publicMap.set(normalized.meeting_id, {
      ...previousPublic,
      ...normalized,
      effective_public_rank: normalized.capability_rank,
      max_public_rank: normalized.capability_rank,
    });
    if (normalizedDetail) details.set(normalized.meeting_id, normalizedDetail);
    else details.delete(normalized.meeting_id);

    reconciliations.push({
      meeting_id: normalized.meeting_id,
      acquisition_group: officialMeeting.acquisition_group,
      outcome,
      ...(outcome === 'conflict' ? { reason: 'retained_stronger_canonical_evidence' } : {}),
      official_rank: accepted.observed_rank,
      public_rank: normalized.capability_rank,
      acquisition_completion: acquisitionCompletion.disposition,
    });
  }

  for (const meetingId of ids) {
    const canonical = canonicalMap.get(meetingId);
    if (!canonical) throw new Error(`missing canonical Japan meeting after reconciliation: ${meetingId}`);
    const canonicalDetail = details.get(meetingId);
    const publicMeeting = publicMeetingRecord(canonical, canonicalDetail);
    publicMap.set(meetingId, publicMeeting);
    const publicDetail = publicDetailRecord(canonical, canonicalDetail, publicMeeting);
    if (publicDetail) publicDetails.set(meetingId, publicDetail);
    else publicDetails.delete(meetingId);
  }

  const stale = [...new Map([...(existing.canonical ?? []), ...(existing.public ?? [])].map((row) => [row.meeting_id, row])).values()]
    .filter((row) => row.country_id === 'japan' && range.dates.includes(row.date) && !ids.has(row.meeting_id))
    .map((row) => ({ meeting_id: row.meeting_id, date: row.date, audit: 'canonical_public_only_not_deleted' }));

  const resultingPublic = [...publicMap.values()];
  assertJapanCompleteness(official, reconciliations, resultingPublic);
  return {
    schema_version: 'japan-zero-based-30d-reconciliation-v1',
    checked_at: checkedAt,
    range,
    official_counts: Object.fromEntries(JAPAN_GROUPS.map((group) => [group, discoveredByGroup[group].length])),
    official_meeting_count: official.length,
    reconciliations,
    stale_audit: stale,
    canonical: [...canonicalMap.values()],
    public: resultingPublic,
    details: [...details.values()],
    publicDetails: [...publicDetails.values()],
    complete: true,
    public_rank_lower_than_official: 0,
  };
}
