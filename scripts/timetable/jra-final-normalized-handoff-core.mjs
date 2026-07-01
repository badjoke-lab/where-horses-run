import { evaluateJraFinalConfirmation } from './jra-final-confirmation-core.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalizeOfficialUrl(value, canonicalHost) {
  const url = new URL(value);
  assert(url.protocol === 'https:', 'JRA final source URL must use HTTPS.');
  assert(['jra.jp', 'www.jra.go.jp'].includes(url.hostname), `Unexpected JRA official host: ${url.hostname}.`);
  url.hostname = canonicalHost;
  return url.toString();
}

function sortedRecords(records) {
  return [...records].sort((left, right) =>
    `${left.date}:${left.racecourse_id}:${left.meeting_id}`.localeCompare(`${right.date}:${right.racecourse_id}:${right.meeting_id}`)
  );
}

function refreshWindow(records) {
  const dates = records.map((record) => record.date).sort();
  assert(dates.length > 0, 'JRA final fixture must contain at least one meeting.');
  return { from: dates[0], to: dates.at(-1) };
}

function continuousFromOne(rows) {
  return rows.every((row, index) => row.label === `Race ${index + 1}`);
}

function missingFields(rows, confirmedFields) {
  const checks = [
    ['race_name', 'race_name'],
    ['distance_m', 'distance'],
    ['surface', 'surface'],
    ['course_label', 'course']
  ];
  return checks
    .filter(([rowKey, readinessKey]) => confirmedFields?.[readinessKey] === true && rows.some((row) => row[rowKey] == null))
    .map(([, readinessKey]) => readinessKey);
}

function metadataStatus(row, confirmedFields) {
  const required = [
    ['race_name', 'race_name'],
    ['distance_m', 'distance'],
    ['surface', 'surface'],
    ['course_label', 'course']
  ];
  return required.every(([rowKey, readinessKey]) => confirmedFields?.[readinessKey] !== true || row[rowKey] != null)
    ? 'verified'
    : 'partial';
}

export function buildJraFinalNormalizedHandoff({ planned, final, control, readinessRegistry, authorityInventory }) {
  const confirmation = evaluateJraFinalConfirmation({
    planned,
    final,
    control,
    readinessRegistry,
    authorityInventory
  });

  if (!confirmation.candidate_generation.permitted) {
    throw new Error(`JRA final fixture is not eligible for normalized handoff: ${confirmation.candidate_generation.blockers.join(', ')}`);
  }

  const readinessMatches = readinessRegistry.records.filter((record) => record.authority_source_key === control.source_key);
  assert(readinessMatches.length === 1, 'JRA readiness source must be unique.');
  const readiness = readinessMatches[0];
  const authorityMatches = authorityInventory.records.filter((record) =>
    record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
  );
  assert(authorityMatches.length === 1, 'JRA authority/source record must be unique.');
  const authority = authorityMatches[0];
  const canonicalHost = new URL(authority.official_source_url).hostname;
  const records = sortedRecords(final.records);
  const window = refreshWindow(records);

  const normalizedMeetingRecords = records.map((record) => {
    const rows = record.timetable_rows;
    return {
      meeting_id: record.meeting_id,
      country_id: 'japan',
      authority_id: 'jra',
      racecourse_id: record.racecourse_id,
      racecourse_name: record.racecourse_name,
      meeting_label_ja: record.meeting_label_ja,
      date: record.date,
      timezone: record.timezone,
      capability_rank: readiness.technical_rank,
      first_race_time_local: record.first_race_time_local,
      last_race_time_local: record.last_race_time_local,
      official_source_url: canonicalizeOfficialUrl(record.source.official_url, canonicalHost),
      continuous_from_one: continuousFromOne(rows),
      missing_fields: missingFields(rows, readiness.confirmed_fields)
    };
  });

  const normalizedDetails = records.map((record) => ({
    meeting_id: record.meeting_id,
    country_id: 'japan',
    authority_id: 'jra',
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: readiness.technical_rank,
    source_trace: {
      source_id: 'jra-calendar-date-program',
      route_id: 'jra-calendar-date-page',
      source_status: 'verified',
      official_source_url: canonicalizeOfficialUrl(record.source.official_url, canonicalHost),
      source_label: 'JRA official final programme page',
      extraction_method: 'human_reviewed_final_program_intake',
      source_snapshot_path: null,
      normalized_from_path: null
    },
    freshness: {
      last_checked_date: record.source.checked_at.slice(0, 10),
      generated_at: final.generated_at,
      stale_after_date: null,
      freshness_note: 'Human-reviewed JRA final programme fixture passed the final-confirmation contract.'
    },
    timetable_rows: record.timetable_rows.map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name ?? null,
      distance_m: row.distance_m ?? null,
      surface: row.surface ?? null,
      course_label: row.course_label ?? null,
      metadata_status: metadataStatus(row, readiness.confirmed_fields)
    })),
    summary_note: 'Reviewed JRA final programme fields prepared for the existing candidate-only adapter. Public projection remains separately bounded by Public Ceiling.'
  }));

  return {
    schema_version: 'jra-final-normalized-handoff-v1',
    work_id: 'WHR-CAL-JAPAN-JRA',
    generated_at: final.generated_at,
    confirmation,
    target_contract: {
      normalized_meetings_schema: 'jra-normalized-timetable-v0',
      normalized_details_schema: 'jra-normalized-meeting-details-v0',
      next_command: 'node scripts/generate-japan-jra-candidates.mjs',
      candidate_review_state: 'needs_review',
      automatic_repository_write_allowed: false
    },
    normalized_meetings: {
      schema_version: 'jra-normalized-timetable-v0',
      generated_at: final.generated_at,
      refresh_window: window,
      records: normalizedMeetingRecords
    },
    normalized_details: {
      schema_version: 'jra-normalized-meeting-details-v0',
      generated_at: final.generated_at,
      refresh_window: window,
      details: normalizedDetails
    },
    boundaries: {
      network_fetch_performed: false,
      repository_write_performed: false,
      candidate_generated: false,
      candidate_approved: false,
      canonical_written: false,
      public_projection_written: false
    }
  };
}
