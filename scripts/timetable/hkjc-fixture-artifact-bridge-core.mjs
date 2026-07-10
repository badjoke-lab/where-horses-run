const TIMEZONE = 'Asia/Hong_Kong';
const SYSTEM_ID = 'hong-kong-hkjc-system';
const COUNTRY_ID = 'hong-kong';
const AUTHORITY_ID = 'hkjc';
const SOURCE_ID = 'hkjc-fixture-list';
const ADAPTER_ID = 'hkjc-fixture-artifact-bridge-v1';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertDate(value, label) {
  if (!datePattern.test(String(value ?? '')) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${label} must be a real YYYY-MM-DD date`);
  }
}

function assertId(value, label) {
  if (!idPattern.test(String(value ?? ''))) throw new Error(`${label} must be a kebab-case stable id`);
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;|&#47;/gi, '/')
    .replace(/&#x3A;|&#58;/gi, ':');
}

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|span|td|tr|p|li|h[1-6])>/gi, '\n')
    .replace(/<img\b[^>]*(?:alt|title)=["']?([^"'>]+)["']?[^>]*>/gi, ' Image: $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
}

function sessionType(token) {
  const value = String(token ?? '').toUpperCase();
  if (value === 'N') return 'night';
  if (value === 'T') return 'twilight';
  if (value === 'D') return 'day';
  return 'unknown';
}

function racecourseFromCode(code) {
  const normalized = String(code).toUpperCase();
  if (normalized === 'HV') {
    return { racecourse_id: 'happy-valley-racecourse', racecourse_name: 'Happy Valley' };
  }
  if (normalized === 'ST') {
    return { racecourse_id: 'sha-tin-racecourse', racecourse_name: 'Sha Tin' };
  }
  throw new Error(`Unsupported HKJC racecourse code: ${code}`);
}

export function hkjcFixtureUrl(year, month) {
  return `https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=${String(month).padStart(2, '0')}&CalYear=${year}`;
}

export function enumerateHkjcFixtureMonths(startDate, endDateExclusive) {
  assertDate(startDate, 'startDate');
  assertDate(endDateExclusive, 'endDateExclusive');
  if (startDate >= endDateExclusive) throw new Error('startDate must be before endDateExclusive');

  const [startYear, startMonth] = startDate.split('-').map(Number);
  const inclusiveEnd = new Date(`${endDateExclusive}T00:00:00Z`);
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
  const endYear = inclusiveEnd.getUTCFullYear();
  const endMonth = inclusiveEnd.getUTCMonth() + 1;

  const months = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month, key: monthKey(year, month), url: hkjcFixtureUrl(year, month) });
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return months;
}

export function parseHkjcFixtureHtml(html, { year, month, sourceUrl }) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('parseHkjcFixtureHtml requires valid year/month');
  }
  if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('https://racing.hkjc.com/')) {
    throw new Error('parseHkjcFixtureHtml requires an official HKJC HTTPS sourceUrl');
  }

  const text = stripHtml(html);
  const meetings = [];
  const pattern = /(?:^|\s|\|)(\d{1,2})\s+Image:\s*(ST|HV)\s+Image:\s*([DTN])\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const day = Number(match[1]);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) continue;
    const racecourse = racecourseFromCode(match[2]);
    meetings.push({
      date,
      ...racecourse,
      racecourse_code: match[2].toUpperCase(),
      session_type: sessionType(match[3]),
      official_fixture_url: sourceUrl,
    });
  }

  const unique = new Map();
  for (const meeting of meetings) unique.set(`${meeting.date}:${meeting.racecourse_id}`, meeting);
  return [...unique.values()].sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
}

function sourceErrorFromMonthResult(result) {
  if (result.ok && typeof result.body === 'string') return null;
  const code = result.error_code ?? (result.status === 429 ? 'rate_limited' : result.status ? 'unexpected_response' : 'source_unavailable');
  return {
    code,
    scope_ref: `month:${monthKey(result.year, result.month)}`,
    message: String(result.error_message ?? `HKJC fixture acquisition failed for ${monthKey(result.year, result.month)}.`).slice(0, 500),
  };
}

function candidateRecord(meeting, generatedAt) {
  const meetingId = `hkjc-${meeting.racecourse_id}-${meeting.date}`;
  return {
    candidate_id: `${meetingId}-fixture-candidate`,
    meeting_id: meetingId,
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
      official_url: meeting.official_fixture_url,
      checked_at: generatedAt,
      extraction_method: 'fixture_parser',
    },
    confidence: 'high',
    review_status: 'needs_review',
    notes: `Official HKJC fixture page confirms meeting identity at ${meeting.racecourse_name}; race times and programme rows are not claimed by this fixture-only bridge.`,
  };
}

function requestedScope(startDate, endDateExclusive) {
  return { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: TIMEZONE };
}

function coverageRequestedScope(startDate, endDateExclusive) {
  return { kind: 'date_window', ...requestedScope(startDate, endDateExclusive) };
}

function logicalArtifactRefs(batchId) {
  const base = `data/generated/timetable/actions-multi-job/${batchId}`;
  return {
    candidate_ref: `${base}/candidates.json`,
    coverage_observation_ref: `${base}/coverage-observation.json`,
    collection_report_ref: `${base}/collection-report.json`,
  };
}

export function buildHkjcFixtureArtifacts({
  startDate,
  endDateExclusive,
  generatedAt,
  batchId,
  campaignId,
  jobId,
  monthResults,
  runnerUsed = 'github_actions',
}) {
  assertDate(startDate, 'startDate');
  assertDate(endDateExclusive, 'endDateExclusive');
  if (startDate >= endDateExclusive) throw new Error('startDate must be before endDateExclusive');
  for (const [value, label] of [[batchId, 'batchId'], [campaignId, 'campaignId'], [jobId, 'jobId']]) assertId(value, label);
  if (!['github_actions', 'local', 'reviewed_import'].includes(runnerUsed)) throw new Error('runnerUsed invalid');
  if (Number.isNaN(Date.parse(generatedAt))) throw new Error('generatedAt must be an ISO date-time');

  const requestedMonths = enumerateHkjcFixtureMonths(startDate, endDateExclusive);
  const resultByKey = new Map((monthResults ?? []).map((result) => [monthKey(result.year, result.month), result]));
  const sourceErrors = [];
  const parsedMeetings = [];
  let successfulMonths = 0;

  for (const month of requestedMonths) {
    const result = resultByKey.get(month.key);
    if (!result) {
      sourceErrors.push({
        code: 'source_unavailable',
        scope_ref: `month:${month.key}`,
        message: `No acquisition result was supplied for HKJC fixture month ${month.key}.`,
      });
      continue;
    }

    const acquisitionError = sourceErrorFromMonthResult(result);
    if (acquisitionError) {
      sourceErrors.push(acquisitionError);
      continue;
    }

    const parsed = parseHkjcFixtureHtml(result.body, { year: month.year, month: month.month, sourceUrl: result.final_url ?? month.url });
    if (parsed.length === 0) {
      sourceErrors.push({
        code: 'parser_failure',
        scope_ref: `month:${month.key}`,
        message: `HKJC fixture page returned successfully but no fixture meeting markers were parsed for ${month.key}.`,
      });
      continue;
    }
    successfulMonths += 1;
    parsedMeetings.push(...parsed);
  }

  const filtered = parsedMeetings.filter((meeting) => startDate <= meeting.date && meeting.date < endDateExclusive);
  const deduped = new Map();
  for (const meeting of filtered) deduped.set(`${meeting.date}:${meeting.racecourse_id}`, meeting);
  const meetings = [...deduped.values()].sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
  const records = meetings.map((meeting) => candidateRecord(meeting, generatedAt));

  const claim = sourceErrors.length === 0
    ? 'source_window_complete'
    : successfulMonths > 0
      ? 'partial'
      : 'none';
  const observedScope = successfulMonths > 0
    ? coverageRequestedScope(startDate, endDateExclusive)
    : { kind: 'not_observed', timezone: TIMEZONE };
  const requested = requestedScope(startDate, endDateExclusive);
  const refs = logicalArtifactRefs(batchId);

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: generatedAt,
    adapter_id: ADAPTER_ID,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    source_id: SOURCE_ID,
    candidate_window: requested,
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Artifact-only HKJC official fixture-window acquisition. Meeting identities are C-level review candidates only; no race times or programme rows are claimed.',
      promotion_target: null,
    },
  };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: generatedAt,
    requested_scope: coverageRequestedScope(startDate, endDateExclusive),
    observed_scope: observedScope,
    collection_mode: 'date_window',
    records_discovered: records.length,
    records_updated: records.length,
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: sourceErrors,
    coverage_claim: claim,
    completion_audit_ref: null,
  };

  const rankCounts = { C: records.length, B: 0, 'B+': 0, A: 0, 'A+': 0 };
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: campaignId,
    job_id: jobId,
    batch_id: batchId,
    system_id: SYSTEM_ID,
    runner_used: runnerUsed,
    requested_scope: requested,
    observed_scope: observedScope,
    coverage_claim: claim,
    records_discovered: records.length,
    records_updated: records.length,
    rank_counts: rankCounts,
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: sourceErrors,
    artifact_refs: refs,
  };

  const report = {
    schema_version: 'calendar-hkjc-fixture-artifact-report-v1',
    work_id: 'WHR-CAL-HONG-KONG-HKJC',
    implementation_unit: 'HKJC-PILOT-02',
    batch_id: batchId,
    system_id: SYSTEM_ID,
    generated_at: generatedAt,
    requested_scope: requested,
    requested_months: requestedMonths.map((month) => month.key),
    successful_month_count: successfulMonths,
    source_error_count: sourceErrors.length,
    records_discovered: records.length,
    rank_counts: rankCounts,
    coverage_claim: claim,
    artifact_refs: { ...refs, result_manifest_ref: `data/generated/timetable/actions-multi-job/${batchId}/result-manifest.json` },
    artifact_transport: 'external_directory_or_github_actions_upload_artifact_only',
    publication_effect: 'none',
    canonical_write_enabled: false,
    public_write_enabled: false,
    automatic_approval_enabled: false,
    automatic_promotion_enabled: false,
    automatic_publication_enabled: false,
  };

  return { candidate, coverage, manifest, report };
}

export const HKJC_FIXTURE_BRIDGE_CONSTANTS = Object.freeze({
  timezone: TIMEZONE,
  system_id: SYSTEM_ID,
  country_id: COUNTRY_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
});
