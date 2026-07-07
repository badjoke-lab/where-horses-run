import { createHash } from 'node:crypto';
import {
  addDays,
  datesInWindow,
  parseIncrementalArgs,
} from './nar-incremental-core.mjs';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values)].sort();
}

function stableJson(value) {
  return JSON.stringify(value);
}

export function batchPaths(batchId) {
  assert(ID_PATTERN.test(batchId), `invalid batch ID: ${batchId}`);
  const candidateRoot = `data/candidates/nar-incremental-batches/${batchId}`;
  const generatedRoot = `data/generated/timetable/nar-incremental-batches/${batchId}`;
  return Object.freeze({
    candidates: `${candidateRoot}/batch.json`,
    report: `${generatedRoot}/collection-report.json`,
    coverage: `${generatedRoot}/coverage-observation.json`,
    retries: `${generatedRoot}/retry-targets.json`,
  });
}

export function parseIncrementalV2Args(argv, matrixRecords) {
  let batchId = null;
  const forwarded = [];
  for (const value of argv) {
    if (value.startsWith('--batch-id=')) batchId = value.slice('--batch-id='.length);
    else forwarded.push(value);
  }
  assert(batchId && ID_PATTERN.test(batchId), '--batch-id is required and must use lowercase kebab-case.');
  const base = parseIncrementalArgs(forwarded, matrixRecords);
  return { ...base, batchId, paths: batchPaths(batchId) };
}

export function deriveSelectedBatchId(meetingIds, checkedAt) {
  const digest = createHash('sha256').update([...meetingIds].sort().join('\n')).digest('hex').slice(0, 12);
  const stamp = String(checkedAt).replace(/[^0-9]/g, '').slice(0, 14);
  return `selected-${digest}-${stamp}`;
}

export function tokyoDate(checkedAt) {
  const date = new Date(checkedAt);
  assert(!Number.isNaN(date.getTime()), 'checkedAt must be a valid date-time.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function normalizeDetailCandidate(meeting) {
  return {
    ...meeting,
    schema_version: 'nar-incremental-detail-candidate-v2',
    candidate_rank: 'A+',
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      reason: 'Schedule-aware NAR detail candidate requires human review before canonical promotion.',
    },
  };
}

function normalizeDetailBlocker(blocker) {
  return {
    ...blocker,
    meeting_id: blocker.meeting_id ?? `nar-${blocker.racecourse_id}-${blocker.date}`,
  };
}

function scheduleCandidateFromMeeting(meeting, blocker, checkedDate) {
  const future = meeting.date > checkedDate;
  return {
    schema_version: 'nar-schedule-meeting-candidate-v1',
    candidate_id: `schedule-${meeting.meeting_id}`,
    meeting_id: meeting.meeting_id,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: meeting.racecourse_id,
    racecourse_name_en: meeting.racecourse_name_en,
    racecourse_name_ja: meeting.racecourse_name_ja,
    venue_code: meeting.venue_code,
    date: meeting.date,
    timezone: 'Asia/Tokyo',
    capability_rank: 'C',
    schedule_state: future ? 'scheduled_pending_details' : 'detail_retry_required',
    detail_status: blocker?.status ?? 'not_observed',
    source: {
      source_id: 'nar-monthly-schedule-grid',
      official_schedule_url: meeting.official_schedule_url,
      schedule_marker: meeting.schedule_marker,
      race_list_url: meeting.race_list_url,
      race_list_linked_from_schedule: meeting.race_list_linked_from_schedule,
      storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
    },
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      reason: 'Schedule evidence establishes meeting identity; detail remains pending or requires retry.',
    },
  };
}

export function aggregateScheduleAwareRuns(monthRuns, checkedAt) {
  assert(Array.isArray(monthRuns) && monthRuns.length > 0, 'schedule-aware month runs are required.');
  const checkedDate = tokyoDate(checkedAt);
  const scheduleMeetings = new Map();
  const detailCandidates = new Map();
  const detailBlockers = new Map();
  const scheduleUrls = new Set();
  const scheduleErrors = [];

  for (const run of monthRuns) {
    if (run.error) {
      scheduleErrors.push(run.error);
      continue;
    }
    assert(run.schedule?.schema_version === 'nar-schedule-observation-scratch-v1', 'unexpected schedule scratch schema.');
    assert(run.candidates?.schema_version === 'nar-monthly-meeting-candidates-v1', 'unexpected detail scratch candidate schema.');
    assert(run.report?.schema_version === 'nar-monthly-collection-report-v1', 'unexpected detail scratch report schema.');
    if (run.schedule.official_schedule_url) scheduleUrls.add(run.schedule.official_schedule_url);

    for (const raw of run.schedule.meetings ?? []) {
      const key = raw.meeting_id;
      if (scheduleMeetings.has(key)) {
        assert(stableJson(scheduleMeetings.get(key)) === stableJson(raw), `conflicting duplicate schedule meeting: ${key}`);
      } else {
        scheduleMeetings.set(key, raw);
      }
    }

    for (const raw of run.candidates.meetings ?? []) {
      const candidate = normalizeDetailCandidate(raw);
      const key = candidate.candidate_id;
      if (detailCandidates.has(key)) {
        assert(stableJson(detailCandidates.get(key)) === stableJson(candidate), `conflicting duplicate detail candidate: ${key}`);
      } else {
        detailCandidates.set(key, candidate);
      }
    }

    for (const raw of run.candidates.blockers ?? []) {
      const blocker = normalizeDetailBlocker(raw);
      const key = blocker.meeting_id;
      if (detailBlockers.has(key)) {
        assert(stableJson(detailBlockers.get(key)) === stableJson(blocker), `conflicting duplicate detail blocker: ${key}`);
      } else {
        detailBlockers.set(key, blocker);
      }
    }
  }

  for (const meetingId of detailCandidates.keys()) detailBlockers.delete(meetingId);

  const scheduleCandidates = [];
  for (const meeting of scheduleMeetings.values()) {
    if (detailCandidates.has(meeting.meeting_id)) continue;
    scheduleCandidates.push(scheduleCandidateFromMeeting(meeting, detailBlockers.get(meeting.meeting_id), checkedDate));
  }

  return {
    checkedDate,
    scheduleUrls: [...scheduleUrls].sort(),
    scheduledMeetings: [...scheduleMeetings.values()].sort((a, b) => a.meeting_id.localeCompare(b.meeting_id)),
    detailCandidates: [...detailCandidates.values()].sort((a, b) => a.candidate_id.localeCompare(b.candidate_id)),
    scheduleCandidates: scheduleCandidates.sort((a, b) => a.meeting_id.localeCompare(b.meeting_id)),
    detailBlockers: [...detailBlockers.values()].sort((a, b) => a.meeting_id.localeCompare(b.meeting_id)),
    scheduleErrors,
  };
}

function detailSourceError(blocker, checkedDate) {
  if (blocker.date > checkedDate) return null;
  if (blocker.status === 'source_unavailable') return 'source_unavailable';
  if (blocker.status === 'parser_failure') return 'parser_failure';
  if (blocker.status === 'http_error') return 'unexpected_response';
  return 'other';
}

export function buildScheduleAwareArtifacts({ parsedArgs, aggregate, checkedAt }) {
  assert(parsedArgs?.requestedScope, 'parsed args are required.');
  assert(aggregate && Array.isArray(aggregate.scheduledMeetings), 'schedule-aware aggregate is required.');
  assert(typeof checkedAt === 'string' && !Number.isNaN(Date.parse(checkedAt)), 'checkedAt must be a valid date-time.');

  const unresolvedMeetingIds = unique(aggregate.scheduleCandidates.map((candidate) => candidate.meeting_id));
  const unresolvedDates = unique(aggregate.scheduleCandidates.map((candidate) => candidate.date));
  const sourceErrors = [];

  for (const error of aggregate.scheduleErrors) {
    sourceErrors.push({
      code: error.code ?? 'other',
      scope_ref: error.scope_ref,
      message: error.message,
    });
  }

  for (const blocker of aggregate.detailBlockers) {
    const code = detailSourceError(blocker, aggregate.checkedDate);
    if (!code) continue;
    sourceErrors.push({
      code,
      scope_ref: blocker.meeting_id,
      message: `NAR ${blocker.status} while collecting detail for ${blocker.meeting_id}.`,
    });
  }

  const failedDates = aggregate.scheduleErrors.flatMap((error) => error.unresolved_dates ?? []);
  const coverageUnresolvedDates = unique([...unresolvedDates, ...failedDates]);
  const coverageClaim = aggregate.scheduleErrors.length === 0 ? 'source_window_complete' : 'partial';
  const observedScope = aggregate.scheduleErrors.length === 0
    ? parsedArgs.requestedScope
    : { kind: 'not_observed', timezone: 'Asia/Tokyo' };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: parsedArgs.batchId,
    system_id: 'japan-nar-system',
    source_id: 'nar-schedule-detail-batch',
    checked_at: checkedAt,
    requested_scope: parsedArgs.requestedScope,
    observed_scope: observedScope,
    collection_mode: parsedArgs.collectionMode,
    records_discovered: aggregate.scheduledMeetings.length,
    records_updated: aggregate.detailCandidates.length + aggregate.scheduleCandidates.length,
    unresolved_dates: coverageUnresolvedDates,
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };

  const reasonCounts = {};
  for (const candidate of aggregate.scheduleCandidates) {
    reasonCounts[candidate.schedule_state] = (reasonCounts[candidate.schedule_state] ?? 0) + 1;
  }
  for (const error of aggregate.scheduleErrors) {
    reasonCounts.schedule_observation_error = (reasonCounts.schedule_observation_error ?? 0) + 1;
  }

  const retries = {
    schema_version: 'nar-incremental-retry-targets-v2',
    batch_id: parsedArgs.batchId,
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    system_id: 'japan-nar-system',
    source_id: 'nar-schedule-detail-batch',
    requested_scope: parsedArgs.requestedScope,
    date_targets: coverageUnresolvedDates,
    meeting_targets: unresolvedMeetingIds,
    reason_counts: reasonCounts,
    operator_mode: 'manual_irregular_retry',
    scheduled_retry: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
  };

  const candidates = {
    schema_version: 'nar-incremental-batch-v2',
    batch_id: parsedArgs.batchId,
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    collection_mode: parsedArgs.collectionMode,
    requested_scope: parsedArgs.requestedScope,
    schedule_source: {
      source_id: 'nar-monthly-schedule-grid',
      official_schedule_urls: aggregate.scheduleUrls,
      matrix_path: 'data/static/nar-flat-racecourse-compatibility-v1.json',
    },
    detail_source: {
      source_id: 'nar-race-list-deba-table',
      fixture_precondition: 'data/fixtures/timetable/nar/complete-meetings',
    },
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      canonical_write: 'disabled',
      public_write: 'disabled',
      raw_source_storage: 'disabled',
    },
    scheduled_meetings: aggregate.scheduledMeetings,
    detail_candidates: aggregate.detailCandidates,
    schedule_candidates: aggregate.scheduleCandidates,
    detail_blockers: aggregate.detailBlockers,
    schedule_errors: aggregate.scheduleErrors,
  };

  const report = {
    schema_version: 'nar-incremental-collection-report-v2',
    batch_id: parsedArgs.batchId,
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    collection_mode: parsedArgs.collectionMode,
    requested_scope: parsedArgs.requestedScope,
    observed_scope: observedScope,
    official_schedule_urls: aggregate.scheduleUrls,
    months_checked: parsedArgs.monthGroups.map((group) => group.month),
    scheduled_meetings: aggregate.scheduledMeetings.length,
    complete_detail_candidates: aggregate.detailCandidates.length,
    schedule_only_candidates: aggregate.scheduleCandidates.length,
    detail_blockers: aggregate.detailBlockers.length,
    schedule_errors: aggregate.scheduleErrors.length,
    candidate_path: parsedArgs.paths.candidates,
    coverage_observation_path: parsedArgs.paths.coverage,
    retry_targets_path: parsedArgs.paths.retries,
    promotion_eligible_candidates: 0,
    publication_effect: 'none',
    canonical_write: 'disabled',
    public_write: 'disabled',
  };

  return { candidates, report, coverage, retries };
}

export function unresolvedDatesForGroup(group) {
  return datesInWindow(group.startDate, group.endDateExclusive);
}

export { addDays };
