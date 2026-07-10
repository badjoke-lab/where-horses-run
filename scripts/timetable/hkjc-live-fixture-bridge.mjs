import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import {
  validateCollectionResultManifestV1,
  validateCollectionResultManifestAgainstCoverageV1,
} from './collection-result-manifest-validation.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueEntryAgainstManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';

const INPUT_SCHEMA = 'calendar-hkjc-live-fixture-bridge-input-v1';
const OUTPUT_SCHEMA = 'calendar-hkjc-live-fixture-bridge-v1';
const ADAPTER_ID = 'hong-kong-hkjc-live-fixture-adapter-v1';
const SYSTEM_ID = 'hong-kong-hkjc-system';
const SOURCE_ID = 'hkjc-fixture-list';
const TIMEZONE = 'Asia/Hong_Kong';
const ALLOWED_PAGE_STATUSES = Object.freeze([
  'success',
  'source_unavailable',
  'rate_limited',
  'parser_failure',
  'unexpected_response',
]);

function isoDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) throw new Error(`invalid ISO date ${value}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`invalid real date ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function enumerateMonths(startDate, endDateExclusive) {
  const start = isoDateParts(startDate);
  const endBoundary = new Date(`${endDateExclusive}T00:00:00Z`);
  endBoundary.setUTCDate(endBoundary.getUTCDate() - 1);
  const end = isoDateParts(endBoundary.toISOString().slice(0, 10));
  const months = [];
  let year = start.year;
  let month = start.month;
  while (year < end.year || (year === end.year && month <= end.month)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return months;
}

function monthBounds(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? '');
  if (!match) throw new Error(`invalid page month ${month}`);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) throw new Error(`invalid page month ${month}`);
  const start = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return { start, endExclusive: end };
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

function stripMarkup(value) {
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

function racecourseFromCode(code) {
  if (code === 'HV') return { racecourse_id: 'happy-valley-racecourse', label: 'Happy Valley' };
  if (code === 'ST') return { racecourse_id: 'sha-tin-racecourse', label: 'Sha Tin' };
  throw new Error(`unsupported HKJC racecourse code ${code}`);
}

export function parseHkjcFixturePageV1({ month, content, source_url: sourceUrl }) {
  const bounds = monthBounds(month);
  if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('https://racing.hkjc.com/')) {
    throw new Error(`HKJC fixture source URL invalid for ${month}`);
  }
  if (typeof content !== 'string' || content.trim() === '') throw new Error(`HKJC fixture page content missing for ${month}`);
  const text = stripMarkup(content);
  const records = [];
  const seen = new Set();
  const pattern = /(?:^|\s|\|)(\d{1,2})\s+Image:\s*(ST|HV)\s+Image:\s*([DTN])\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const day = Number(match[1]);
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const parts = isoDateParts(date);
    if (`${parts.year}-${String(parts.month).padStart(2, '0')}` !== month) throw new Error(`fixture day ${day} lies outside ${month}`);
    const code = match[2].toUpperCase();
    const racecourse = racecourseFromCode(code);
    const meetingId = `hkjc-${racecourse.racecourse_id}-${date}`;
    if (seen.has(meetingId)) throw new Error(`duplicate HKJC meeting identity ${meetingId}`);
    seen.add(meetingId);
    records.push({
      meeting_id: meetingId,
      date,
      racecourse_id: racecourse.racecourse_id,
      racecourse_label: racecourse.label,
      racecourse_code: code,
      session_code: match[3].toUpperCase(),
      source_url: sourceUrl,
    });
  }
  return {
    month,
    observed_scope: {
      kind: 'date_window',
      start_date: bounds.start,
      end_date_exclusive: bounds.endExclusive,
      timezone: TIMEZONE,
    },
    records: records.sort((a, b) => a.meeting_id.localeCompare(b.meeting_id)),
  };
}

function assertInput(input) {
  if (input?.schema_version !== INPUT_SCHEMA) throw new Error('HKJC live fixture bridge input schema differs');
  if (!validDateTime(input.generated_at)) throw new Error('HKJC bridge generated_at invalid');
  for (const key of ['campaign_id', 'job_id', 'batch_id']) {
    if (typeof input[key] !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input[key])) throw new Error(`${key} must be lowercase kebab-case`);
  }
  if (input.runner_used !== 'github_actions') throw new Error('HKJC live fixture bridge currently requires github_actions runner evidence');
  const scope = input.requested_scope;
  if (!scope || scope.timezone !== TIMEZONE) throw new Error('HKJC bridge timezone differs');
  isoDateParts(scope.start_date);
  isoDateParts(scope.end_date_exclusive);
  if (scope.start_date >= scope.end_date_exclusive) throw new Error('HKJC bridge requested window is empty or reversed');
  if (!Array.isArray(input.page_results) || input.page_results.length === 0) throw new Error('HKJC bridge page_results must not be empty');
}

function sourceErrorFor(page) {
  const codeMap = {
    source_unavailable: 'source_unavailable',
    rate_limited: 'rate_limited',
    parser_failure: 'parser_failure',
    unexpected_response: 'unexpected_response',
  };
  return {
    code: codeMap[page.status] ?? 'other',
    scope_ref: page.month,
    message: `HKJC official fixture page status ${page.status} for ${page.month}.`,
  };
}

function intersectScope(scope, monthScope) {
  const start = scope.start_date > monthScope.start_date ? scope.start_date : monthScope.start_date;
  const end = scope.end_date_exclusive < monthScope.end_date_exclusive ? scope.end_date_exclusive : monthScope.end_date_exclusive;
  return start < end ? { start, endExclusive: end } : null;
}

function observedScopeFor(successfulIntervals, requestedScope, allRequiredMonthsSuccessful) {
  if (successfulIntervals.length === 0) return { kind: 'not_observed', timezone: TIMEZONE };
  if (allRequiredMonthsSuccessful) {
    return {
      kind: 'date_window',
      start_date: requestedScope.start_date,
      end_date_exclusive: requestedScope.end_date_exclusive,
      timezone: TIMEZONE,
    };
  }
  return {
    kind: 'source_visible_horizon',
    start_date: successfulIntervals[0].start,
    end_date_exclusive: successfulIntervals.at(-1).endExclusive,
    timezone: TIMEZONE,
  };
}

export function buildHkjcLiveFixtureBridgeV1(input) {
  assertInput(input);
  const requiredMonths = enumerateMonths(input.requested_scope.start_date, input.requested_scope.end_date_exclusive);
  const pageByMonth = new Map();
  for (const page of input.page_results) {
    if (!ALLOWED_PAGE_STATUSES.includes(page?.status)) throw new Error(`unsupported HKJC fixture page status ${page?.status}`);
    if (pageByMonth.has(page.month)) throw new Error(`duplicate HKJC fixture page month ${page.month}`);
    pageByMonth.set(page.month, page);
  }
  for (const month of pageByMonth.keys()) {
    if (!requiredMonths.includes(month)) throw new Error(`HKJC fixture page month ${month} lies outside requested scope`);
  }

  const sourceErrors = [];
  const successfulIntervals = [];
  const parsedRecords = [];
  for (const month of requiredMonths) {
    const page = pageByMonth.get(month);
    if (!page) {
      sourceErrors.push({ code: 'source_unavailable', scope_ref: month, message: `HKJC official fixture page result missing for ${month}.` });
      continue;
    }
    if (page.status !== 'success') {
      sourceErrors.push(sourceErrorFor(page));
      continue;
    }
    let parsed;
    try {
      parsed = parseHkjcFixturePageV1(page);
    } catch (error) {
      sourceErrors.push({ code: 'parser_failure', scope_ref: month, message: `HKJC fixture parser failed for ${month}: ${error.message}`.slice(0, 500) });
      continue;
    }
    const interval = intersectScope(input.requested_scope, parsed.observed_scope);
    if (interval) successfulIntervals.push(interval);
    for (const record of parsed.records) {
      if (input.requested_scope.start_date <= record.date && record.date < input.requested_scope.end_date_exclusive) parsedRecords.push(record);
    }
  }

  successfulIntervals.sort((a, b) => a.start.localeCompare(b.start));
  const seenMeetings = new Set();
  for (const record of parsedRecords) {
    if (seenMeetings.has(record.meeting_id)) throw new Error(`duplicate HKJC meeting across fixture pages ${record.meeting_id}`);
    seenMeetings.add(record.meeting_id);
  }
  parsedRecords.sort((a, b) => a.meeting_id.localeCompare(b.meeting_id));

  const allRequiredMonthsSuccessful = requiredMonths.length > 0
    && requiredMonths.every((month) => pageByMonth.get(month)?.status === 'success')
    && sourceErrors.length === 0;
  const observedScope = observedScopeFor(successfulIntervals, input.requested_scope, allRequiredMonthsSuccessful);
  const coverageClaim = successfulIntervals.length === 0
    ? 'none'
    : allRequiredMonthsSuccessful ? 'source_window_complete' : 'partial';

  const candidateRecords = parsedRecords.map((record) => ({
    candidate_id: `candidate-${record.meeting_id}`,
    meeting_id: record.meeting_id,
    country_id: 'hong-kong',
    authority_id: 'hkjc',
    racing_system_id: SYSTEM_ID,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: TIMEZONE,
    capability_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: SOURCE_ID,
      official_url: record.source_url,
      checked_at: input.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'HKJC official fixture-window meeting identity. Schedule bridge only; no race times or racecard detail inferred.',
  }));

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: input.generated_at,
    adapter_id: ADAPTER_ID,
    country_id: 'hong-kong',
    authority_id: 'hkjc',
    source_id: SOURCE_ID,
    candidate_window: structuredClone(input.requested_scope),
    records: candidateRecords,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'HKJC official fixture-window acquisition bridge. C-level meeting identity only; no automatic promotion or publication.',
      promotion_target: null,
    },
  };

  const requestedCoverageScope = {
    kind: 'date_window',
    start_date: input.requested_scope.start_date,
    end_date_exclusive: input.requested_scope.end_date_exclusive,
    timezone: TIMEZONE,
  };
  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: input.batch_id,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: input.generated_at,
    requested_scope: requestedCoverageScope,
    observed_scope: observedScope,
    collection_mode: 'date_window',
    records_discovered: candidateRecords.length,
    records_updated: candidateRecords.length,
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };
  const coverageValidation = validateCoverageObservation(coverage);
  if (!coverageValidation.valid) throw new Error(`HKJC Coverage Observation invalid: ${coverageValidation.errors.join('; ')}`);

  const outputRoot = `data/generated/timetable/hkjc-live-fixture-bridge/${input.batch_id}`;
  const manifestRef = `${outputRoot}/result-manifest.json`;
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: input.campaign_id,
    job_id: input.job_id,
    batch_id: input.batch_id,
    system_id: SYSTEM_ID,
    runner_used: input.runner_used,
    requested_scope: structuredClone(input.requested_scope),
    observed_scope: structuredClone(observedScope),
    coverage_claim: coverageClaim,
    records_discovered: candidateRecords.length,
    records_updated: candidateRecords.length,
    rank_counts: { C: candidateRecords.length, B: 0, 'B+': 0, A: 0, 'A+': 0 },
    unresolved_dates: [],
    unresolved_meeting_ids: [],
    source_errors: structuredClone(sourceErrors),
    artifact_refs: {
      candidate_ref: `${outputRoot}/candidate.json`,
      coverage_observation_ref: `${outputRoot}/coverage-observation.json`,
      collection_report_ref: `${outputRoot}/collection-report.json`,
    },
  };
  const manifestErrors = [
    ...validateCollectionResultManifestV1(manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(manifest, coverage),
  ];
  if (manifestErrors.length) throw new Error(`HKJC Result Manifest invalid: ${manifestErrors.join('; ')}`);

  const reviewQueue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: input.generated_at,
    entries: [buildReviewQueueEntryFromManifestV1(manifest, {
      review_state: 'review_ready',
      promotion_state: 'not_ready',
      manifest_ref: manifestRef,
    })],
  };
  const reviewErrors = [
    ...validateReviewQueueV1(reviewQueue),
    ...validateReviewQueueEntryAgainstManifestV1(reviewQueue.entries[0], manifest),
  ];
  if (reviewErrors.length) throw new Error(`HKJC Review Queue invalid: ${reviewErrors.join('; ')}`);

  const report = {
    schema_version: 'calendar-hkjc-live-fixture-collection-report-v1',
    campaign_id: input.campaign_id,
    job_id: input.job_id,
    batch_id: input.batch_id,
    system_id: SYSTEM_ID,
    adapter_id: ADAPTER_ID,
    requested_scope: structuredClone(input.requested_scope),
    observed_scope: structuredClone(observedScope),
    required_months: requiredMonths,
    successful_month_count: successfulIntervals.length,
    records_discovered: candidateRecords.length,
    coverage_claim: coverageClaim,
    source_error_count: sourceErrors.length,
    publication_effect: 'none',
  };

  return {
    schema_version: OUTPUT_SCHEMA,
    generated_at: input.generated_at,
    system_id: SYSTEM_ID,
    adapter_id: ADAPTER_ID,
    candidate,
    coverage_observation: coverage,
    result_manifest: manifest,
    review_queue: reviewQueue,
    collection_report: report,
    boundaries: {
      network_fetch_performed_by_core: false,
      approval: false,
      promotion: false,
      canonical_write: false,
      public_write: false,
      publication: false,
      deployment: false,
      scheduler_execution: false,
    },
  };
}

export const hkjcLiveFixtureBridgeV1Contract = Object.freeze({
  input_schema_version: INPUT_SCHEMA,
  output_schema_version: OUTPUT_SCHEMA,
  system_id: SYSTEM_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  output_rank: 'C',
  registry_activation: false,
});
