const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export const NAR_INCREMENTAL_PATHS = Object.freeze({
  candidates: 'data/candidates/nar-incremental-meeting-candidates.json',
  report: 'data/generated/timetable/nar-incremental-collection-report.json',
  coverage: 'data/generated/timetable/nar-coverage-observation.json',
  retries: 'data/generated/timetable/nar-retry-targets.json',
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function isRealDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function addDays(date, days) {
  assert(isRealDate(date), `invalid date: ${date}`);
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function datesInWindow(startDate, endDateExclusive) {
  assert(isRealDate(startDate), 'start_date must be a real YYYY-MM-DD date');
  assert(isRealDate(endDateExclusive), 'end_date_exclusive must be a real YYYY-MM-DD date');
  assert(startDate < endDateExclusive, 'end_date_exclusive must be after start_date');
  const output = [];
  for (let date = startDate; date < endDateExclusive; date = addDays(date, 1)) output.push(date);
  return output;
}

export function monthsInWindow(startDate, endDateExclusive) {
  const dates = datesInWindow(startDate, endDateExclusive);
  return [...new Set(dates.map((date) => date.slice(0, 7)))];
}

export function monthWindow(month) {
  assert(MONTH_PATTERN.test(month), `invalid month: ${month}`);
  const [year, mm] = month.split('-').map(Number);
  assert(mm >= 1 && mm <= 12, `invalid month: ${month}`);
  const startDate = `${year}-${String(mm).padStart(2, '0')}-01`;
  const next = new Date(Date.UTC(year, mm, 1));
  const endDateExclusive = next.toISOString().slice(0, 10);
  return { startDate, endDateExclusive };
}

export function intersectWindow(startA, endA, startB, endB) {
  const startDate = [startA, startB].sort().at(-1);
  const endDateExclusive = [endA, endB].sort()[0];
  assert(startDate < endDateExclusive, 'windows do not intersect');
  return { startDate, endDateExclusive };
}

export function parseMeetingId(meetingId, matrixRecords) {
  assert(typeof meetingId === 'string' && meetingId.startsWith('nar-'), `invalid NAR meeting ID: ${meetingId}`);
  assert(Array.isArray(matrixRecords), 'matrix records are required');
  const matches = [];
  for (const record of matrixRecords) {
    const prefix = `nar-${record.racecourse_id}-`;
    if (!meetingId.startsWith(prefix)) continue;
    const date = meetingId.slice(prefix.length);
    if (!isRealDate(date)) continue;
    matches.push({
      meeting_id: meetingId,
      racecourse_id: record.racecourse_id,
      venue_code: record.venue_code,
      date,
      month: date.slice(0, 7),
    });
  }
  assert(matches.length === 1, `meeting ID does not resolve uniquely in the NAR matrix: ${meetingId}`);
  return matches[0];
}

export function raceListUrl(venueCode, date) {
  assert(/^\d{2}$/.test(String(venueCode)), `invalid venue code: ${venueCode}`);
  assert(isRealDate(date), `invalid meeting date: ${date}`);
  const url = new URL('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList');
  url.searchParams.set('k_babaCode', String(venueCode));
  url.searchParams.set('k_raceDate', date.replaceAll('-', '/'));
  return url.toString();
}

export function parseIncrementalArgs(argv, matrixRecords) {
  const args = {
    startDate: null,
    endDateExclusive: null,
    meetingIds: [],
    checkedAt: null,
    dryRun: false,
  };

  for (const value of argv) {
    if (value === '--dry-run') args.dryRun = true;
    else if (value.startsWith('--start-date=')) args.startDate = value.slice('--start-date='.length);
    else if (value.startsWith('--end-date-exclusive=')) args.endDateExclusive = value.slice('--end-date-exclusive='.length);
    else if (value.startsWith('--meeting-id=')) args.meetingIds.push(value.slice('--meeting-id='.length));
    else if (value.startsWith('--meeting-ids=')) args.meetingIds.push(...value.slice('--meeting-ids='.length).split(',').filter(Boolean));
    else if (value.startsWith('--checked-at=')) args.checkedAt = value.slice('--checked-at='.length);
    else throw new Error(`Unknown argument: ${value}`);
  }

  args.meetingIds = [...new Set(args.meetingIds)].sort();
  const hasWindow = args.startDate !== null || args.endDateExclusive !== null;
  const hasSelected = args.meetingIds.length > 0;
  assert(hasWindow !== hasSelected, 'provide either a date window or selected meeting IDs');

  if (hasWindow) {
    assert(isRealDate(args.startDate), '--start-date must be a real YYYY-MM-DD date');
    assert(isRealDate(args.endDateExclusive), '--end-date-exclusive must be a real YYYY-MM-DD date');
    assert(args.startDate < args.endDateExclusive, '--end-date-exclusive must be after --start-date');
    const days = datesInWindow(args.startDate, args.endDateExclusive);
    assert(days.length <= 93, 'ordinary incremental date window must not exceed 93 days');
    return {
      ...args,
      collectionMode: 'date_window',
      requestedScope: {
        kind: 'date_window',
        start_date: args.startDate,
        end_date_exclusive: args.endDateExclusive,
        timezone: 'Asia/Tokyo',
      },
      monthGroups: monthsInWindow(args.startDate, args.endDateExclusive).map((month) => {
        const boundary = monthWindow(month);
        const intersection = intersectWindow(args.startDate, args.endDateExclusive, boundary.startDate, boundary.endDateExclusive);
        return { month, ...intersection, meetingIds: [] };
      }),
    };
  }

  const resolved = args.meetingIds.map((meetingId) => parseMeetingId(meetingId, matrixRecords));
  const grouped = new Map();
  for (const item of resolved) {
    if (!grouped.has(item.month)) grouped.set(item.month, []);
    grouped.get(item.month).push(item);
  }
  return {
    ...args,
    collectionMode: 'selected_meetings',
    requestedScope: {
      kind: 'selected_meetings',
      meeting_ids: args.meetingIds,
      timezone: 'Asia/Tokyo',
    },
    monthGroups: [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => ({
        month,
        startDate: items.map((item) => item.date).sort()[0],
        endDateExclusive: addDays(items.map((item) => item.date).sort().at(-1), 1),
        meetingIds: items.map((item) => item.meeting_id).sort(),
      })),
  };
}

function stableJson(value) {
  return JSON.stringify(value);
}

function normalizeCandidate(meeting) {
  return {
    ...meeting,
    schema_version: 'nar-incremental-meeting-candidate-v1',
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      reason: 'Incremental NAR candidate requires human review before canonical promotion.',
    },
  };
}

function normalizeBlocker(blocker) {
  return {
    ...blocker,
    meeting_id: `nar-${blocker.racecourse_id}-${blocker.date}`,
  };
}

export function aggregateMonthlyScratch(monthlyRuns) {
  assert(Array.isArray(monthlyRuns) && monthlyRuns.length > 0, 'monthly scratch runs are required');
  const candidates = new Map();
  const blockers = new Map();
  const scheduleUrls = new Set();
  let meetingsDiscovered = 0;

  for (const run of monthlyRuns) {
    const candidateSet = run.candidates;
    const report = run.report;
    assert(candidateSet?.schema_version === 'nar-monthly-meeting-candidates-v1', 'unexpected scratch candidate schema');
    assert(report?.schema_version === 'nar-monthly-collection-report-v1', 'unexpected scratch report schema');
    if (report.official_schedule_url) scheduleUrls.add(report.official_schedule_url);
    meetingsDiscovered += Number(report.meetings_discovered ?? 0);

    for (const raw of candidateSet.meetings ?? []) {
      const candidate = normalizeCandidate(raw);
      const key = candidate.candidate_id;
      if (candidates.has(key)) {
        assert(stableJson(candidates.get(key)) === stableJson(candidate), `conflicting duplicate candidate: ${key}`);
      } else {
        candidates.set(key, candidate);
      }
    }

    for (const raw of candidateSet.blockers ?? []) {
      const blocker = normalizeBlocker(raw);
      const key = blocker.meeting_id;
      if (blockers.has(key)) {
        assert(stableJson(blockers.get(key)) === stableJson(blocker), `conflicting duplicate blocker: ${key}`);
      } else {
        blockers.set(key, blocker);
      }
    }
  }

  for (const meetingId of candidates.keys()) blockers.delete(meetingId);

  return {
    scheduleUrls: [...scheduleUrls].sort(),
    meetingsDiscovered,
    meetings: [...candidates.values()].sort((a, b) => a.candidate_id.localeCompare(b.candidate_id)),
    blockers: [...blockers.values()].sort((a, b) => a.meeting_id.localeCompare(b.meeting_id)),
  };
}

function sourceErrorFromBlocker(blocker) {
  const status = blocker.status;
  if (status === 'source_unavailable') return 'source_unavailable';
  if (status === 'parser_failure') return 'parser_failure';
  if (status === 'http_error') return 'unexpected_response';
  return null;
}

function unique(values) {
  return [...new Set(values)].sort();
}

export function buildCoverageAndRetries({ parsedArgs, aggregate, checkedAt }) {
  assert(parsedArgs?.requestedScope, 'parsed args are required');
  assert(aggregate && Array.isArray(aggregate.meetings) && Array.isArray(aggregate.blockers), 'aggregate is required');
  assert(typeof checkedAt === 'string' && !Number.isNaN(Date.parse(checkedAt)), 'checkedAt must be an ISO date-time');

  const completeDates = aggregate.meetings.map((meeting) => meeting.date);
  const blockerDates = aggregate.blockers.map((blocker) => blocker.date);
  const discoveredDates = unique([...completeDates, ...blockerDates]);
  let observedScope;
  let unresolvedDates = [];

  if (parsedArgs.collectionMode === 'selected_meetings') {
    observedScope = {
      kind: 'selected_meetings',
      meeting_ids: parsedArgs.requestedScope.meeting_ids,
      timezone: 'Asia/Tokyo',
    };
  } else if (discoveredDates.length > 0) {
    const horizonEnd = [addDays(discoveredDates.at(-1), 1), parsedArgs.requestedScope.end_date_exclusive].sort()[0];
    observedScope = {
      kind: 'source_visible_horizon',
      start_date: parsedArgs.requestedScope.start_date,
      end_date_exclusive: horizonEnd,
      timezone: 'Asia/Tokyo',
    };
    unresolvedDates = horizonEnd < parsedArgs.requestedScope.end_date_exclusive
      ? datesInWindow(horizonEnd, parsedArgs.requestedScope.end_date_exclusive)
      : [];
  } else {
    observedScope = { kind: 'not_observed', timezone: 'Asia/Tokyo' };
    unresolvedDates = datesInWindow(parsedArgs.requestedScope.start_date, parsedArgs.requestedScope.end_date_exclusive);
  }

  unresolvedDates = unique([...unresolvedDates, ...blockerDates]);
  const unresolvedMeetingIds = unique(aggregate.blockers.map((blocker) => blocker.meeting_id));
  const sourceErrors = aggregate.blockers
    .map((blocker) => ({ blocker, code: sourceErrorFromBlocker(blocker) }))
    .filter((entry) => entry.code)
    .map(({ blocker, code }) => ({
      code,
      scope_ref: blocker.meeting_id,
      message: `NAR ${blocker.status} while collecting ${blocker.meeting_id}.`,
    }));

  const coverageClaim = discoveredDates.length > 0 || parsedArgs.collectionMode === 'selected_meetings' ? 'partial' : 'none';
  const runId = `nar-incremental-${checkedAt.replace(/[^0-9]/g, '').slice(0, 14)}`;

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: runId,
    system_id: 'japan-nar-system',
    source_id: 'nar-race-list-deba-table',
    checked_at: checkedAt,
    requested_scope: parsedArgs.requestedScope,
    observed_scope: observedScope,
    collection_mode: parsedArgs.collectionMode,
    records_discovered: aggregate.meetings.length + aggregate.blockers.length,
    records_updated: aggregate.meetings.length,
    unresolved_dates: unresolvedDates,
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };

  const reasonCounts = {};
  for (const blocker of aggregate.blockers) reasonCounts[blocker.status] = (reasonCounts[blocker.status] ?? 0) + 1;
  const uniqueBlockerDates = unique(blockerDates);
  const horizonPendingCount = unresolvedDates.filter((date) => !uniqueBlockerDates.includes(date)).length;
  if (horizonPendingCount > 0) reasonCounts.source_horizon_pending = horizonPendingCount;

  const retries = {
    schema_version: 'nar-incremental-retry-targets-v1',
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    system_id: 'japan-nar-system',
    source_id: 'nar-race-list-deba-table',
    requested_scope: parsedArgs.requestedScope,
    date_targets: unresolvedDates,
    meeting_targets: unresolvedMeetingIds,
    reason_counts: reasonCounts,
    operator_mode: 'manual_irregular_retry',
    scheduled_retry: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
  };

  return { coverage, retries, observedScope };
}

export function buildIncrementalArtifacts({ parsedArgs, aggregate, checkedAt }) {
  const { coverage, retries, observedScope } = buildCoverageAndRetries({ parsedArgs, aggregate, checkedAt });
  const candidates = {
    schema_version: 'nar-incremental-meeting-candidates-v1',
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    collection_mode: parsedArgs.collectionMode,
    requested_scope: parsedArgs.requestedScope,
    source: {
      source_id: 'nar-race-list-deba-table',
      official_schedule_urls: aggregate.scheduleUrls,
      matrix_path: 'data/static/nar-flat-racecourse-compatibility-v1.json',
      fixture_precondition: 'data/fixtures/timetable/nar/complete-meetings',
    },
    review: {
      status: 'needs_review',
      promotion_eligible: false,
      canonical_write: 'disabled',
      public_write: 'disabled',
      raw_source_storage: 'disabled',
    },
    meetings: aggregate.meetings,
    blockers: aggregate.blockers,
  };

  const report = {
    schema_version: 'nar-incremental-collection-report-v1',
    generated_at: checkedAt,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    collection_mode: parsedArgs.collectionMode,
    requested_scope: parsedArgs.requestedScope,
    observed_scope: observedScope,
    official_schedule_urls: aggregate.scheduleUrls,
    months_checked: parsedArgs.monthGroups.map((group) => group.month),
    meetings_discovered: aggregate.meetings.length + aggregate.blockers.length,
    complete_meeting_candidates: aggregate.meetings.length,
    blocked_meetings: aggregate.blockers.length,
    candidate_path: NAR_INCREMENTAL_PATHS.candidates,
    coverage_observation_path: NAR_INCREMENTAL_PATHS.coverage,
    retry_targets_path: NAR_INCREMENTAL_PATHS.retries,
    promotion_eligible_candidates: 0,
    publication_effect: 'none',
    canonical_write: 'disabled',
    public_write: 'disabled',
  };

  return { candidates, report, coverage, retries };
}
