const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const SERIOUS_STATUSES = new Set([
  'blocked_or_bot_page',
  'network_error',
  'empty_response',
  'redirect_unexpected',
  'unsupported_page_structure',
]);

function exactDateKey(record) {
  return `${record.date}:${record.racecourse_id}`;
}

function meetingIdFromStatus(row) {
  if (!row?.meeting_date || !row?.racecourse_id) return null;
  return `hkjc-${row.racecourse_id}-${row.meeting_date}`;
}

function publicRows(detail, rank) {
  if (!detail || !['A', 'A+'].includes(rank)) return [];
  return (detail.timetable_rows ?? []).map((row) => ({
    label: row.label,
    post_time_local: row.post_time_local,
    ...(rank === 'A+' && row.race_name ? { race_name: row.race_name } : {}),
    ...(rank === 'A+' && row.distance_m != null ? { distance_m: row.distance_m } : {}),
    ...(rank === 'A+' && row.surface ? { surface: row.surface } : {}),
    ...(rank === 'A+' && row.course_label ? { course_label: row.course_label } : {}),
  }));
}

function rankCounts(records) {
  return Object.fromEntries(RANKS.map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}

function seriousSourceErrors(refreshReport) {
  const errors = [];
  for (const row of refreshReport?.statuses ?? []) {
    const serious = SERIOUS_STATUSES.has(row.status)
      || (row.status === 'http_status_error' && row.http_status != null && row.http_status !== 404);
    if (!serious) continue;
    const meetingId = meetingIdFromStatus(row);
    errors.push({
      code: row.status === 'blocked_or_bot_page' ? 'rate_limited'
        : row.status === 'network_error' ? 'source_unavailable'
          : row.status === 'unsupported_page_structure' ? 'parser_failure'
            : 'unexpected_response',
      scope_ref: meetingId ? `${meetingId}:race-${row.race_number ?? 'unknown'}` : 'hkjc-racecard-detail',
      message: String(row.failure_reason ?? `HKJC detail acquisition ${row.status}`).slice(0, 500),
    });
  }
  return errors;
}

export function buildHkjcLiveBestAvailableArtifacts({ scheduleArtifacts, normalized, details, refreshReport }) {
  const scheduleRecords = scheduleArtifacts?.candidate?.records ?? [];
  const normalizedByKey = new Map((normalized?.records ?? []).map((record) => [exactDateKey(record), record]));
  const detailById = new Map((details?.details ?? []).map((detail) => [detail.meeting_id, detail]));

  const records = scheduleRecords.map((record) => {
    const observed = normalizedByKey.get(exactDateKey(record));
    if (!observed || !RANK_INDEX.has(observed.capability_rank) || RANK_INDEX.get(observed.capability_rank) <= RANK_INDEX.get(record.capability_rank)) {
      return record;
    }
    return {
      ...record,
      capability_rank: observed.capability_rank,
      first_race_time_local: observed.first_race_time_local,
      last_race_time_local: observed.last_race_time_local,
      timetable_rows: publicRows(detailById.get(record.meeting_id), observed.capability_rank),
      source: {
        source_id: 'hkjc-racecard-public-timetable',
        official_url: observed.official_source_url,
        checked_at: normalized.generated_at,
        extraction_method: 'live_racecard_adapter',
      },
      confidence: 'high',
      notes: `Official HKJC fixture identity enriched from the official racecard route to current best-available rank ${observed.capability_rank}; review remains required before promotion/publication.`,
    };
  });

  const sourceErrors = [
    ...(scheduleArtifacts.coverage?.source_errors ?? []),
    ...seriousSourceErrors(refreshReport),
  ];
  const unresolvedMeetingIds = [...new Set(sourceErrors
    .map((error) => String(error.scope_ref ?? '').split(':race-')[0])
    .filter((value) => value.startsWith('hkjc-')))];
  const counts = rankCounts(records);
  const updatedCount = records.filter((record) => record.capability_rank !== 'C').length;
  const coverageClaim = sourceErrors.length > 0
    ? scheduleArtifacts.coverage?.coverage_claim === 'none' ? 'none' : 'partial'
    : scheduleArtifacts.coverage?.coverage_claim ?? 'partial';

  const candidate = {
    ...scheduleArtifacts.candidate,
    adapter_id: 'hkjc-live-best-available-v1',
    records,
    review: {
      ...scheduleArtifacts.candidate.review,
      summary: 'HKJC best-available live acquisition: official fixture identity plus official racecard enrichment. C/B/B+/A/A+ are observation states, not publication requirements; review remains required.',
    },
  };
  const coverage = {
    ...scheduleArtifacts.coverage,
    records_discovered: records.length,
    records_updated: updatedCount,
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
  };
  const manifest = {
    ...scheduleArtifacts.manifest,
    records_discovered: records.length,
    records_updated: updatedCount,
    rank_counts: counts,
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
  };
  const report = {
    schema_version: 'calendar-hkjc-live-best-available-report-v1',
    batch_id: scheduleArtifacts.manifest.batch_id,
    records_discovered: records.length,
    records_updated: updatedCount,
    rank_counts: counts,
    coverage_claim: coverageClaim,
    source_error_count: sourceErrors.length,
    schedule_only_execution: false,
    operator_detail_route_invoked: false,
    live_racecard_route_invoked: true,
    current_observation_ranks_preserved: true,
    publication_effect: 'none',
    canonical_write_enabled: false,
    public_write_enabled: false,
    automatic_approval_enabled: false,
    automatic_promotion_enabled: false,
    automatic_publication_enabled: false,
  };
  return { candidate, coverage, manifest, report };
}
