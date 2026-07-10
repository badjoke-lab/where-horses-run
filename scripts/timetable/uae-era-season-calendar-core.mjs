const TIMEZONE = 'Asia/Dubai';
const COUNTRY_ID = 'united-arab-emirates';
const SYSTEM_ID = 'uae-national-racing-system';
const AUTHORITY_ID = 'emirates-racing-authority';
const SOURCE_ID = 'era-season-calendar';
const ADAPTER_ID = 'uae-era-season-calendar-artifact-v1';
const TRUSTED_RACECOURSE_IDS = Object.freeze(['meydan-racecourse']);
const SOURCE_ERROR_CODES = Object.freeze(['source_unavailable', 'parser_failure', 'rate_limited', 'unexpected_response', 'other']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, allowed) {
  return isObject(value)
    && Object.keys(value).every((key) => allowed.includes(key))
    && allowed.every((key) => Object.hasOwn(value, key));
}

function validDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function officialEraUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'emiratesracing.com' || url.hostname.endsWith('.emiratesracing.com'));
  } catch {
    return false;
  }
}

function assertId(value, label) {
  if (!ID_PATTERN.test(String(value ?? ''))) throw new Error(`${label} must be a stable kebab-case id`);
}

export function validateUaeEraReviewedMeetingV1(meeting) {
  const errors = [];
  const allowed = ['meeting_id', 'racecourse_id', 'date'];
  if (!exactKeys(meeting, allowed)) return ['reviewed meeting fields differ from C-level contract'];
  if (!ID_PATTERN.test(String(meeting.meeting_id ?? ''))) errors.push('meeting_id invalid');
  if (!TRUSTED_RACECOURSE_IDS.includes(meeting.racecourse_id)) errors.push(`racecourse_id ${meeting.racecourse_id} is outside PILOT-01 trusted mapping`);
  if (!validDate(meeting.date)) errors.push('date invalid');
  return errors;
}

export function buildUaeEraSeasonCalendarArtifacts({
  startDate,
  endDateExclusive,
  generatedAt,
  checkedAt,
  officialSourceUrl,
  batchId,
  campaignId,
  jobId,
  reviewedMeetings = [],
  windowComplete = false,
  unresolvedDates = [],
  sourceErrors = [],
  runnerUsed = 'reviewed_import',
}) {
  if (!validDate(startDate) || !validDate(endDateExclusive) || startDate >= endDateExclusive) throw new Error('invalid requested date window');
  if (!validDateTime(generatedAt)) throw new Error('generatedAt must be a valid date-time');
  if (!validDateTime(checkedAt)) throw new Error('checkedAt must be a valid date-time');
  if (!officialEraUrl(officialSourceUrl)) throw new Error('officialSourceUrl must be official emiratesracing.com HTTPS');
  for (const [value, label] of [[batchId, 'batchId'], [campaignId, 'campaignId'], [jobId, 'jobId']]) assertId(value, label);
  if (!['github_actions', 'local', 'reviewed_import'].includes(runnerUsed)) throw new Error('runnerUsed invalid');
  if (!Array.isArray(reviewedMeetings)) throw new Error('reviewedMeetings must be an array');
  if (!Array.isArray(unresolvedDates) || unresolvedDates.some((date) => !validDate(date))) throw new Error('unresolvedDates invalid');
  if (!Array.isArray(sourceErrors)) throw new Error('sourceErrors must be an array');

  const meetingIds = new Set();
  const records = [];
  for (const meeting of reviewedMeetings) {
    const validation = validateUaeEraReviewedMeetingV1(meeting);
    if (validation.length) throw new Error(`invalid reviewed meeting: ${validation.join('; ')}`);
    if (meetingIds.has(meeting.meeting_id)) throw new Error(`duplicate meeting_id ${meeting.meeting_id}`);
    meetingIds.add(meeting.meeting_id);
    if (meeting.date < startDate || meeting.date >= endDateExclusive) throw new Error(`meeting ${meeting.meeting_id} outside requested window`);
    records.push({
      candidate_id: `candidate-${meeting.meeting_id}`,
      meeting_id: meeting.meeting_id,
      country_id: COUNTRY_ID,
      authority_id: AUTHORITY_ID,
      racing_system_id: SYSTEM_ID,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: TIMEZONE,
      capability_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: SOURCE_ID,
        official_url: officialSourceUrl,
        checked_at: checkedAt,
        extraction_method: 'manual_import',
      },
      confidence: 'high',
      review_status: 'needs_review',
      notes: 'UAE ERA reviewed season-calendar observation limited to meeting date and trusted racecourse identity. No time or programme-detail claim is made.',
    });
  }
  records.sort((left, right) => `${left.date}:${left.meeting_id}`.localeCompare(`${right.date}:${right.meeting_id}`));

  const normalizedErrors = sourceErrors.map((error, index) => {
    if (!isObject(error)) throw new Error(`sourceErrors[${index}] must be an object`);
    if (!exactKeys(error, ['code', 'scope_ref', 'message'])) throw new Error(`sourceErrors[${index}] fields differ`);
    if (!SOURCE_ERROR_CODES.includes(error.code)) throw new Error(`sourceErrors[${index}].code invalid`);
    if (typeof error.scope_ref !== 'string' || error.scope_ref.trim() === '') throw new Error(`sourceErrors[${index}].scope_ref invalid`);
    if (typeof error.message !== 'string' || error.message.trim() === '') throw new Error(`sourceErrors[${index}].message invalid`);
    return { code: error.code, scope_ref: error.scope_ref, message: error.message.slice(0, 500) };
  });

  const uniqueUnresolvedDates = [...new Set(unresolvedDates)].sort();
  const coverageClaim = windowComplete === true && normalizedErrors.length === 0 && uniqueUnresolvedDates.length === 0
    ? 'source_window_complete'
    : records.length > 0
      ? 'partial'
      : 'none';
  const requestedScope = { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: TIMEZONE };
  const observedScope = records.length > 0
    ? { kind: 'date_window', ...requestedScope }
    : { kind: 'not_observed', timezone: TIMEZONE };
  const artifactBase = `data/generated/timetable/uae-era/${batchId}`;

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: generatedAt,
    adapter_id: ADAPTER_ID,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    source_id: SOURCE_ID,
    candidate_window: requestedScope,
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'UAE ERA C-level reviewed season-calendar candidates. Human review and separate Promotion Validation remain required.',
      promotion_target: null,
    },
  };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: checkedAt,
    requested_scope: { kind: 'date_window', ...requestedScope },
    observed_scope: observedScope,
    collection_mode: 'date_window',
    records_discovered: records.length,
    records_updated: 0,
    unresolved_dates: uniqueUnresolvedDates,
    unresolved_meeting_ids: [],
    source_errors: normalizedErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };

  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: campaignId,
    job_id: jobId,
    batch_id: batchId,
    system_id: SYSTEM_ID,
    runner_used: runnerUsed,
    requested_scope: requestedScope,
    observed_scope: observedScope,
    coverage_claim: coverageClaim,
    records_discovered: records.length,
    records_updated: 0,
    rank_counts: { C: records.length, B: 0, 'B+': 0, A: 0, 'A+': 0 },
    unresolved_dates: uniqueUnresolvedDates,
    unresolved_meeting_ids: [],
    source_errors: normalizedErrors,
    artifact_refs: {
      candidate_ref: `${artifactBase}/candidates.json`,
      coverage_observation_ref: `${artifactBase}/coverage-observation.json`,
      collection_report_ref: `${artifactBase}/collection-report.json`,
    },
  };

  const report = {
    schema_version: 'calendar-uae-era-season-calendar-report-v1',
    work_id: 'WHR-CAL-UAE-ERA',
    implementation_unit: 'UAE-PILOT-01',
    batch_id: batchId,
    generated_at: generatedAt,
    records_discovered: records.length,
    records_updated: 0,
    rank_counts: manifest.rank_counts,
    unresolved_dates: uniqueUnresolvedDates,
    source_error_count: normalizedErrors.length,
    coverage_claim: coverageClaim,
    candidate_mode: 'review_only',
    network_fetch: false,
    raw_source_storage: 'disabled',
    registry_activation: false,
    canonical_write: 'disabled',
    public_write: 'disabled',
    publication_effect: 'none',
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
  };

  return { candidate, coverage, manifest, report };
}

export const UAE_ERA_SEASON_CALENDAR_V1 = Object.freeze({
  timezone: TIMEZONE,
  country_id: COUNTRY_ID,
  system_id: SYSTEM_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  trusted_racecourse_ids: TRUSTED_RACECOURSE_IDS,
  capability_rank: 'C',
});
