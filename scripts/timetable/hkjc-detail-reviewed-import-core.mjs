import { classifyHkjcDetailObservation, HKJC_DETAIL_ARTIFACT_V1 } from './hkjc-detail-artifact-core.mjs';

const IMPORT_SCHEMA = 'calendar-hkjc-detail-reviewed-import-v1';
const PACKAGE_SCHEMA = 'calendar-hkjc-detail-reviewed-import-package-v1';
const TIMEZONE = 'Asia/Hong_Kong';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVIEW_STATES = new Set(['pending_human_review', 'reviewed_public_safe']);
const EVIDENCE_TYPES = new Set(['official_page_manual_review', 'official_export_review', 'other_official_public_source_review']);
const ROW_FIELDS = ['race_number', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label', 'official_source_url'];
const ALLOWED_TOP_FIELDS = ['schema_version', 'work_id', 'implementation_unit', 'generated_at', 'source_evidence', 'window', 'meetings', 'review'];
const ALLOWED_SOURCE_FIELDS = ['official_source_url', 'checked_at', 'evidence_type'];
const ALLOWED_WINDOW_FIELDS = ['start_date', 'end_date_exclusive', 'timezone'];
const ALLOWED_MEETING_FIELDS = ['meeting_id', 'racecourse_id', 'date', 'meeting_complete', 'rows'];
const ALLOWED_REVIEW_FIELDS = ['state', 'reviewed_at', 'reviewer'];

function keysExactly(value, allowed, label, errors) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${label} contains unexpected field ${key}`);
  for (const key of allowed) if (!Object.hasOwn(value, key)) errors.push(`${label} missing ${key}`);
}

function validDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function officialHkjcUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'racing.hkjc.com';
  } catch {
    return false;
  }
}

function nullableString(value) {
  return value === null || (typeof value === 'string' && value.trim() !== '');
}

function publicSafeRow(row, meetingIndex, rowIndex, errors) {
  const label = `meetings[${meetingIndex}].rows[${rowIndex}]`;
  keysExactly(row, ROW_FIELDS, label, errors);
  if (!Number.isInteger(row?.race_number) || row.race_number < 1 || row.race_number > 30) errors.push(`${label}.race_number invalid`);
  if (row?.post_time_local !== null && !TIME_PATTERN.test(String(row.post_time_local))) errors.push(`${label}.post_time_local invalid`);
  if (!nullableString(row?.race_name)) errors.push(`${label}.race_name invalid`);
  if (row?.distance_m !== null && (!Number.isInteger(row.distance_m) || row.distance_m < 100 || row.distance_m > 10000)) errors.push(`${label}.distance_m invalid`);
  if (!nullableString(row?.surface)) errors.push(`${label}.surface invalid`);
  if (!nullableString(row?.course_label)) errors.push(`${label}.course_label invalid`);
  if (!officialHkjcUrl(row?.official_source_url)) errors.push(`${label}.official_source_url must be official racing.hkjc.com HTTPS`);
}

export function validateHkjcDetailReviewedImportInput(input) {
  const errors = [];
  keysExactly(input, ALLOWED_TOP_FIELDS, 'input', errors);
  if (input?.schema_version !== IMPORT_SCHEMA) errors.push(`schema_version must be ${IMPORT_SCHEMA}`);
  if (input?.work_id !== 'WHR-CAL-HONG-KONG-HKJC') errors.push('work_id differs');
  if (input?.implementation_unit !== 'HKJC-PILOT-06') errors.push('implementation_unit differs');
  if (!validDateTime(input?.generated_at)) errors.push('generated_at invalid');

  keysExactly(input?.source_evidence, ALLOWED_SOURCE_FIELDS, 'source_evidence', errors);
  if (!officialHkjcUrl(input?.source_evidence?.official_source_url)) errors.push('source_evidence.official_source_url must be official racing.hkjc.com HTTPS');
  if (!validDateTime(input?.source_evidence?.checked_at)) errors.push('source_evidence.checked_at invalid');
  if (!EVIDENCE_TYPES.has(input?.source_evidence?.evidence_type)) errors.push('source_evidence.evidence_type invalid');

  keysExactly(input?.window, ALLOWED_WINDOW_FIELDS, 'window', errors);
  if (!validDate(input?.window?.start_date) || !validDate(input?.window?.end_date_exclusive) || input.window.start_date >= input.window.end_date_exclusive) errors.push('window date range invalid');
  if (input?.window?.timezone !== TIMEZONE) errors.push(`window.timezone must be ${TIMEZONE}`);

  if (!Array.isArray(input?.meetings) || input.meetings.length === 0 || input.meetings.length > 10) errors.push('meetings must contain 1 through 10 records');
  const meetingIds = new Set();
  for (const [meetingIndex, meeting] of (input?.meetings ?? []).entries()) {
    const label = `meetings[${meetingIndex}]`;
    keysExactly(meeting, ALLOWED_MEETING_FIELDS, label, errors);
    if (!ID_PATTERN.test(String(meeting?.meeting_id ?? ''))) errors.push(`${label}.meeting_id invalid`);
    if (!ID_PATTERN.test(String(meeting?.racecourse_id ?? ''))) errors.push(`${label}.racecourse_id invalid`);
    if (meetingIds.has(meeting?.meeting_id)) errors.push(`${label}.meeting_id duplicate`);
    meetingIds.add(meeting?.meeting_id);
    if (!validDate(meeting?.date)) errors.push(`${label}.date invalid`);
    else if (input?.window && (meeting.date < input.window.start_date || meeting.date >= input.window.end_date_exclusive)) errors.push(`${label}.date outside window`);
    if (typeof meeting?.meeting_complete !== 'boolean') errors.push(`${label}.meeting_complete must be boolean`);
    if (!Array.isArray(meeting?.rows) || meeting.rows.length === 0 || meeting.rows.length > 30) errors.push(`${label}.rows must contain 1 through 30 records`);
    const raceNumbers = new Set();
    for (const [rowIndex, row] of (meeting?.rows ?? []).entries()) {
      publicSafeRow(row, meetingIndex, rowIndex, errors);
      if (raceNumbers.has(row?.race_number)) errors.push(`${label}.rows duplicate race_number ${row?.race_number}`);
      raceNumbers.add(row?.race_number);
    }
  }

  keysExactly(input?.review, ALLOWED_REVIEW_FIELDS, 'review', errors);
  if (!REVIEW_STATES.has(input?.review?.state)) errors.push('review.state invalid');
  if (input?.review?.state === 'pending_human_review') {
    if (input.review.reviewed_at !== null || input.review.reviewer !== null) errors.push('pending review must keep reviewed_at/reviewer null');
  }
  if (input?.review?.state === 'reviewed_public_safe') {
    if (!validDateTime(input.review.reviewed_at)) errors.push('reviewed_public_safe requires reviewed_at');
    if (typeof input.review.reviewer !== 'string' || input.review.reviewer.trim() === '') errors.push('reviewed_public_safe requires reviewer');
  }
  return errors;
}

function rankCounts(records) {
  return Object.fromEntries(HKJC_DETAIL_ARTIFACT_V1.ranks.map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}

function candidateRecord(meeting, classification, sourceId, checkedAt) {
  const sourceUrl = meeting.rows[0].official_source_url;
  return {
    candidate_id: `candidate-${meeting.meeting_id}`,
    meeting_id: meeting.meeting_id,
    country_id: HKJC_DETAIL_ARTIFACT_V1.country_id,
    authority_id: HKJC_DETAIL_ARTIFACT_V1.authority_id,
    racing_system_id: HKJC_DETAIL_ARTIFACT_V1.system_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: TIMEZONE,
    capability_rank: classification.rank,
    first_race_time_local: classification.first_race_time_local,
    last_race_time_local: classification.last_race_time_local,
    timetable_rows: classification.timetable_rows,
    source: {
      source_id: sourceId,
      official_url: sourceUrl,
      checked_at: checkedAt,
      extraction_method: 'reviewed_import',
    },
    confidence: 'high',
    review_status: 'needs_review',
    notes: `HKJC reviewed-import public-safe timetable observation classified at ${classification.rank}; candidate review and Promotion Validation remain separate.`,
  };
}

function buildReviewedArtifacts(input, { batchId, campaignId, jobId }) {
  const records = [];
  const unresolvedMeetingIds = [];
  for (const meeting of input.meetings) {
    const observations = meeting.rows.map((row) => ({
      race_number: row.race_number,
      label: `Race ${row.race_number}`,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
      source_url: row.official_source_url,
    }));
    const classification = classifyHkjcDetailObservation({
      race_observations: observations,
      meeting_complete: meeting.meeting_complete,
    });
    records.push(candidateRecord(meeting, classification, 'hkjc-detail-reviewed-import', input.source_evidence.checked_at));
    if (!meeting.meeting_complete) unresolvedMeetingIds.push(meeting.meeting_id);
  }
  records.sort((left, right) => `${left.date}:${left.meeting_id}`.localeCompare(`${right.date}:${right.meeting_id}`));
  const ranks = rankCounts(records);
  const observedScope = {
    kind: 'date_window',
    start_date: input.window.start_date,
    end_date_exclusive: input.window.end_date_exclusive,
    timezone: TIMEZONE,
  };
  const coverageClaim = unresolvedMeetingIds.length === 0 ? 'source_window_complete' : 'partial';
  const requestedScope = {
    start_date: input.window.start_date,
    end_date_exclusive: input.window.end_date_exclusive,
    timezone: TIMEZONE,
  };
  const base = `data/generated/timetable/reviewed-import/${batchId}`;
  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: input.generated_at,
    adapter_id: 'hkjc-detail-reviewed-import-v1',
    country_id: HKJC_DETAIL_ARTIFACT_V1.country_id,
    authority_id: HKJC_DETAIL_ARTIFACT_V1.authority_id,
    source_id: 'hkjc-detail-reviewed-import',
    candidate_window: requestedScope,
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Public-safe reviewed-import handoff. Import review does not approve candidates or authorize promotion/publication.',
      promotion_target: null,
    },
  };
  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: HKJC_DETAIL_ARTIFACT_V1.system_id,
    source_id: 'hkjc-detail-reviewed-import',
    checked_at: input.source_evidence.checked_at,
    requested_scope: observedScope,
    observed_scope: observedScope,
    collection_mode: 'date_window',
    records_discovered: records.length,
    records_updated: records.filter((record) => record.capability_rank !== 'C').length,
    unresolved_dates: [],
    unresolved_meeting_ids: [...unresolvedMeetingIds].sort(),
    source_errors: [],
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: campaignId,
    job_id: jobId,
    batch_id: batchId,
    system_id: HKJC_DETAIL_ARTIFACT_V1.system_id,
    runner_used: 'reviewed_import',
    requested_scope: requestedScope,
    observed_scope: observedScope,
    coverage_claim: coverageClaim,
    records_discovered: records.length,
    records_updated: coverage.records_updated,
    rank_counts: ranks,
    unresolved_dates: [],
    unresolved_meeting_ids: [...unresolvedMeetingIds].sort(),
    source_errors: [],
    artifact_refs: {
      candidate_ref: `${base}/candidates.json`,
      coverage_observation_ref: `${base}/coverage-observation.json`,
      collection_report_ref: `${base}/reviewed-import-report.json`,
    },
  };
  const report = {
    schema_version: 'calendar-hkjc-detail-reviewed-import-report-v1',
    work_id: 'WHR-CAL-HONG-KONG-HKJC',
    implementation_unit: 'HKJC-PILOT-06',
    batch_id: batchId,
    records_discovered: records.length,
    records_updated: coverage.records_updated,
    rank_counts: ranks,
    unresolved_meeting_ids: [...unresolvedMeetingIds].sort(),
    coverage_claim: coverageClaim,
    import_mode: 'reviewed_public_safe_external_input',
    network_fetch: false,
    raw_source_storage: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
    publication_effect: 'none',
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
  };
  return { candidate, coverage, manifest, report };
}

export function buildHkjcDetailReviewedImportPackage({ input, inputFileName, inputSha256, batchId, campaignId, jobId }) {
  const errors = validateHkjcDetailReviewedImportInput(input);
  if (errors.length) throw new Error(`reviewed import input invalid: ${errors.join('; ')}`);
  for (const [value, label] of [[batchId, 'batchId'], [campaignId, 'campaignId'], [jobId, 'jobId']]) {
    if (!ID_PATTERN.test(String(value ?? ''))) throw new Error(`${label} invalid`);
  }
  if (typeof inputFileName !== 'string' || inputFileName.trim() === '') throw new Error('inputFileName required');
  if (!/^[a-f0-9]{64}$/.test(String(inputSha256 ?? ''))) throw new Error('inputSha256 must be lowercase SHA-256 hex');
  const normalizedArtifacts = input.review.state === 'reviewed_public_safe'
    ? buildReviewedArtifacts(input, { batchId, campaignId, jobId })
    : null;
  return {
    schema_version: PACKAGE_SCHEMA,
    work_id: 'WHR-CAL-HONG-KONG-HKJC',
    implementation_unit: 'HKJC-PILOT-06',
    generated_at: input.generated_at,
    input_evidence: {
      filename: inputFileName,
      sha256: inputSha256,
      official_source_url: input.source_evidence.official_source_url,
      checked_at: input.source_evidence.checked_at,
      evidence_type: input.source_evidence.evidence_type,
    },
    review_state: input.review.state,
    human_review_required: true,
    normalized_artifacts: normalizedArtifacts,
    side_effect_boundary: {
      network_fetch: false,
      approval: false,
      promotion: false,
      canonical_write: false,
      public_write: false,
      publication: false,
      deployment: false,
    },
  };
}

export const HKJC_DETAIL_REVIEWED_IMPORT_V1 = Object.freeze({
  input_schema_version: IMPORT_SCHEMA,
  package_schema_version: PACKAGE_SCHEMA,
  timezone: TIMEZONE,
  source_id: 'hkjc-detail-reviewed-import',
  adapter_id: 'hkjc-detail-reviewed-import-v1',
});
