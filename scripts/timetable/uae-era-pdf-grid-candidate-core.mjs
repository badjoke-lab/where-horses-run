const TIMEZONE = 'Asia/Dubai';
const COUNTRY_ID = 'united-arab-emirates';
const SYSTEM_ID = 'uae-national-racing-system';
const AUTHORITY_ID = 'emirates-racing-authority';
const SOURCE_ID = 'era-season-calendar';
const ADAPTER_ID = 'uae-era-pdf-grid-actions-v1';
const PDF_URL = 'https://d2xuc5ucjmnf40.cloudfront.net/downloads/UAE-ERA-Race-Fixture-2026-27.pdf';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function realDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function approvedMappingByLabel(mappingDecision) {
  const result = new Map();
  const mappings = mappingDecision?.venue_mapping_approval?.mappings;
  if (!Array.isArray(mappings) || mappings.length !== 5) throw new Error('PILOT-05 mapping decision must contain five mappings');
  for (const mapping of mappings) {
    if (mapping.approved_for_canonical_identity_registration !== true) {
      throw new Error(`mapping not approved for ${mapping.official_article_label}`);
    }
    if (!ID_PATTERN.test(mapping.canonical_id ?? '')) throw new Error(`invalid canonical ID for ${mapping.official_article_label}`);
    result.set(mapping.official_article_label, mapping.canonical_id);
  }
  return result;
}

export function buildUaeEraPdfGridArtifactsV1({
  gridObservations,
  mappingDecision,
  job,
  batchId,
  generatedAt,
  checkedAt,
  runnerUsed = 'github_actions',
}) {
  if (gridObservations?.schema_version !== 'calendar-uae-era-pilot-04-grid-observations-v1') {
    throw new Error('grid observation schema differs');
  }
  if (gridObservations.work_id !== 'WHR-CAL-UAE-ERA' || gridObservations.implementation_unit !== 'UAE-PILOT-04') {
    throw new Error('grid observation Work identity differs');
  }
  if (gridObservations.parser_mode !== 'coordinate_aware_public_safe_grid') throw new Error('grid parser mode differs');
  if (gridObservations.observation_count !== 64 || gridObservations.observations?.length !== 64) {
    throw new Error('grid observations must close to 64 before candidate generation');
  }
  if (gridObservations.pairing_evidence?.weekday_calendar_validation !== 'pass') throw new Error('weekday calendar validation must pass');
  if (gridObservations.pairing_evidence?.duplicate_date_venue_observations !== 0) throw new Error('duplicate date/venue observations are not allowed');

  if (mappingDecision?.schema_version !== 'calendar-uae-era-pilot-05-boundary-mapping-decision-v1') {
    throw new Error('mapping decision schema differs');
  }
  if (mappingDecision.source_boundary_reconciliation?.decision?.coverage_state !== 'count_closed_reviewed_pdf_fixture_window') {
    throw new Error('PILOT-05 fixture-window decision is not accepted');
  }
  const acceptedWindow = {
    start_date: mappingDecision.source_boundary_reconciliation.decision.accepted_fixture_window_start,
    end_date_exclusive: mappingDecision.source_boundary_reconciliation.decision.accepted_fixture_window_end_exclusive,
    timezone: TIMEZONE,
  };
  if (!realDate(acceptedWindow.start_date) || !realDate(acceptedWindow.end_date_exclusive)) throw new Error('accepted fixture window invalid');

  if (!isObject(job) || job.schema_version !== 'calendar-collection-job-v1') throw new Error('Collection Job v1 required');
  if (job.system_id !== SYSTEM_ID) throw new Error('Collection Job system differs');
  if (job.collection_mode !== 'source_visible_horizon') throw new Error('UAE PDF grid core requires source_visible_horizon');
  if (job.rank_strategy !== 'best_available' || job.target_rank !== null) throw new Error('UAE PDF grid core requires best_available rank strategy');
  if (JSON.stringify(job.requested_scope) !== JSON.stringify(acceptedWindow)) throw new Error('Collection Job requested scope must equal reviewed PDF fixture window');
  if (!ID_PATTERN.test(batchId ?? '')) throw new Error('batchId must be stable kebab-case');
  if (!validDateTime(generatedAt) || !validDateTime(checkedAt)) throw new Error('generatedAt and checkedAt must be valid date-times');
  if (!['github_actions', 'local', 'reviewed_import'].includes(runnerUsed)) throw new Error('runnerUsed invalid');

  const mappingByLabel = approvedMappingByLabel(mappingDecision);
  const records = [];
  const meetingIds = new Set();
  for (const observation of gridObservations.observations) {
    const racecourseId = mappingByLabel.get(observation.venue_label);
    if (!racecourseId) throw new Error(`approved mapping missing for ${observation.venue_label}`);
    if (!realDate(observation.date)) throw new Error(`invalid observation date ${observation.date}`);
    if (observation.date < acceptedWindow.start_date || observation.date >= acceptedWindow.end_date_exclusive) {
      throw new Error(`observation outside reviewed fixture window: ${observation.date}`);
    }
    const meetingId = `uae-${racecourseId}-${observation.date}`;
    if (meetingIds.has(meetingId)) throw new Error(`duplicate meeting ID ${meetingId}`);
    meetingIds.add(meetingId);
    records.push({
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: COUNTRY_ID,
      authority_id: AUTHORITY_ID,
      racing_system_id: SYSTEM_ID,
      racecourse_id: racecourseId,
      date: observation.date,
      timezone: TIMEZONE,
      capability_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: SOURCE_ID,
        official_url: PDF_URL,
        checked_at: checkedAt,
        extraction_method: 'fixture_parser',
      },
      confidence: 'high',
      review_status: 'needs_review',
      notes: 'ERA fixture PDF coordinate-grid observation. C-level meeting date and approved racecourse identity only; no race-time or programme-detail claim.',
    });
  }
  records.sort((left, right) => `${left.date}:${left.racecourse_id}`.localeCompare(`${right.date}:${right.racecourse_id}`));
  if (records.length !== 64) throw new Error('candidate record count must close to 64');

  const observedScope = {
    kind: 'source_visible_horizon',
    ...acceptedWindow,
  };
  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: generatedAt,
    adapter_id: ADAPTER_ID,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    source_id: SOURCE_ID,
    candidate_window: structuredClone(acceptedWindow),
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'UAE ERA count-closed reviewed PDF fixture-window candidates. Human review and separate Promotion Validation remain required.',
      promotion_target: null,
    },
  };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: checkedAt,
    requested_scope: structuredClone(observedScope),
    observed_scope: structuredClone(observedScope),
    collection_mode: 'source_visible_horizon',
    records_discovered: records.length,
    records_updated: 0,
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: [],
    coverage_claim: 'source_window_complete',
    completion_audit_ref: null,
  };

  const artifactBase = `data/generated/timetable/uae-era-pdf-grid-batches/${batchId}`;
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: job.campaign_id,
    job_id: job.job_id,
    batch_id: batchId,
    system_id: SYSTEM_ID,
    runner_used: runnerUsed,
    requested_scope: structuredClone(job.requested_scope),
    observed_scope: structuredClone(observedScope),
    coverage_claim: 'source_window_complete',
    records_discovered: records.length,
    records_updated: 0,
    rank_counts: { C: records.length, B: 0, 'B+': 0, A: 0, 'A+': 0 },
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: [],
    artifact_refs: {
      candidate_ref: `${artifactBase}/candidates.json`,
      coverage_observation_ref: `${artifactBase}/coverage-observation.json`,
      collection_report_ref: `${artifactBase}/collection-report.json`,
    },
  };

  const report = {
    schema_version: 'calendar-uae-era-pdf-grid-report-v1',
    work_id: 'WHR-CAL-UAE-ERA',
    implementation_unit: 'UAE-PILOT-06',
    batch_id: batchId,
    generated_at: generatedAt,
    records_discovered: records.length,
    records_updated: 0,
    rank_counts: structuredClone(manifest.rank_counts),
    fixture_window: structuredClone(acceptedWindow),
    coverage_claim: 'source_window_complete',
    candidate_mode: 'review_only',
    candidate_review_state: 'needs_review',
    promotion_target: null,
    raw_pdf_storage: 'disabled',
    raw_text_storage: 'disabled',
    registry_write: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
    publication_effect: 'none',
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
  };

  return { candidate, coverage, manifest, report };
}

export const UAE_ERA_PDF_GRID_V1 = Object.freeze({
  timezone: TIMEZONE,
  country_id: COUNTRY_ID,
  system_id: SYSTEM_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  pdf_url: PDF_URL,
  capability_rank: 'C',
});
