const RANKS = ['C', 'B', 'B+', 'A', 'A+'];
export const JAPAN_GROUPS = ['jra', 'nar-standard', 'banei'];
export const OUTCOMES = ['add', 'update', 'no_op', 'details_pending', 'acquisition_failed', 'conflict'];

function rank(value) {
  const index = RANKS.indexOf(value);
  return index < 0 ? 0 : index;
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
  const lower = reconciliations.filter((row) => {
    if (!['add', 'update', 'no_op'].includes(row.outcome) || !row.official_rank) return false;
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

function safeRows(rows = []) {
  return rows.map((row) => ({
    label: row.label ?? null,
    post_time_local: row.post_time_local ?? null,
    race_name: row.race_name ?? null,
    distance_m: row.distance_m ?? null,
    surface: row.surface ?? null,
    course_label: row.course_label ?? null,
    metadata_status: 'verified',
    source_label: row.source_label ?? null,
  }));
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
  const base = previous ?? {};
  return {
    ...base,
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racing_system_id: meeting.racing_system_id ?? base.racing_system_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: meeting.capability_rank ?? 'C',
    display_status: meeting.capability_rank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: meeting.first_race_time_local ?? rows[0]?.post_time_local ?? null,
    last_race_time_local: meeting.last_race_time_local ?? rows.at(-1)?.post_time_local ?? null,
    source_trace: sourceTrace(meeting, base.source_trace),
    freshness: {
      ...(base.freshness ?? {}),
      last_checked_date: checkedAt.slice(0, 10),
      generated_at: checkedAt,
      stale_after_date: null,
      freshness_note: 'Deterministically reconciled from the official Japan 30-day acquisition run.',
    },
    notes: base.notes ?? 'Deterministic public-safe timetable fields reconciled from the official source.',
  };
}

function detailRecord(meeting, rows, checkedAt, previous = null) {
  const base = previous ?? {};
  return {
    ...base,
    meeting_id: meeting.meeting_id,
    country_id: 'japan',
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: meeting.capability_rank,
    source_trace: meeting.source_trace,
    freshness: meeting.freshness,
    timetable_rows: safeRows(rows),
    summary_note: 'Deterministic public-safe race programme fields reconciled from the official source.',
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
  return JSON.stringify((row?.timetable_rows ?? []).map(({ label, post_time_local, race_name, distance_m, surface, course_label }) => ({ label, post_time_local, race_name, distance_m, surface, course_label })));
}
function isFailure(value) { return value?.status === 'acquisition_failed' || value?.status === 'race_number_discovery_incomplete'; }
function isPending(value) { return value?.status === 'details_pending' || value?.status === 'scheduled_pending_details'; }
function isRetryable(value) { return isFailure(value) || value?.status === 'scheduled_pending_details'; }

async function inspectWithRetry(adapter, meeting, attempts, retryDelayMs) {
  let result;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { result = await adapter.inspect(meeting, { attempt }); }
    catch (error) { result = { status: 'acquisition_failed', reason: String(error?.message ?? error) }; }
    if (!isRetryable(result) || attempt === attempts) break;
    if (retryDelayMs) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
  if (isPending(result)) return { outcome: 'details_pending', reason: result.reason ?? result.status };
  if (isFailure(result) || !result) return { outcome: 'acquisition_failed', reason: result?.reason ?? result?.status ?? 'empty_detail_response' };
  if (result.status === 'conflict') return { outcome: 'conflict', reason: result.reason };
  if (result.status !== 'ok' || !result.meeting) return { outcome: 'acquisition_failed', reason: result.reason ?? `unexpected_status:${result.status}` };
  return { outcome: null, meeting: result.meeting };
}

/** Official discovery completes before canonical/public state is read or consulted. */
export async function runJapanZeroBased30d({ executionDate, adapters, loadExisting = () => ({ canonical: [], public: [] }), attempts = 3, retryDelayMs = 250, checkedAt = new Date().toISOString() }) {
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

  // Deliberately after all three official enumerations: existing rows can never seed discovery.
  const existing = await loadExisting();
  const canonicalMap = new Map((existing.canonical ?? []).map((row) => [row.meeting_id, row]));
  const publicMap = new Map((existing.public ?? []).map((row) => [row.meeting_id, row]));
  const details = new Map((existing.details ?? []).map((row) => [row.meeting_id, row]));
  const reconciliations = [];

  for (const officialMeeting of official) {
    const inspected = await inspectWithRetry(adapters[officialMeeting.acquisition_group], officialMeeting, attempts, retryDelayMs);
    if (inspected.outcome) {
      reconciliations.push({
        meeting_id: officialMeeting.meeting_id,
        acquisition_group: officialMeeting.acquisition_group,
        outcome: inspected.outcome,
        reason: inspected.reason,
      });
      continue;
    }

    const previousCanonical = canonicalMap.get(officialMeeting.meeting_id);
    const previousDetail = details.get(officialMeeting.meeting_id);
    const normalized = safeMeeting({ ...officialMeeting, ...inspected.meeting }, checkedAt, previousCanonical);
    if (previousCanonical && rank(previousCanonical.capability_rank) > rank(normalized.capability_rank)) {
      reconciliations.push({
        meeting_id: normalized.meeting_id,
        acquisition_group: officialMeeting.acquisition_group,
        outcome: 'conflict',
        reason: 'official_rank_regression',
      });
      continue;
    }

    const normalizedDetail = ['A', 'A+'].includes(normalized.capability_rank)
      ? detailRecord(normalized, inspected.meeting.timetable_rows, checkedAt, previousDetail)
      : null;
    const changed = !previousCanonical
      || comparableMeeting(previousCanonical) !== comparableMeeting(normalized)
      || (normalizedDetail && comparableRows(previousDetail) !== comparableRows(normalizedDetail));
    const outcome = !previousCanonical ? 'add' : changed ? 'update' : 'no_op';

    canonicalMap.set(normalized.meeting_id, normalized);
    const previousPublic = publicMap.get(normalized.meeting_id) ?? {};
    publicMap.set(normalized.meeting_id, {
      ...previousPublic,
      ...normalized,
      effective_public_rank: normalized.capability_rank,
      max_public_rank: normalized.capability_rank,
    });
    if (normalizedDetail) details.set(normalized.meeting_id, normalizedDetail);

    reconciliations.push({
      meeting_id: normalized.meeting_id,
      acquisition_group: officialMeeting.acquisition_group,
      outcome,
      official_rank: normalized.capability_rank,
      public_rank: normalized.capability_rank,
    });
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
    complete: true,
    public_rank_lower_than_official: 0,
  };
}
