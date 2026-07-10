const TIMEZONE = 'Asia/Hong_Kong';
const SYSTEM_ID = 'hong-kong-hkjc-system';
const COUNTRY_ID = 'hong-kong';
const AUTHORITY_ID = 'hkjc';
const SOURCE_ID = 'hkjc-racecard-public-timetable';
const ADAPTER_ID = 'hkjc-racecard-detail-artifact-v1';
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertId(value, label) {
  if (!ID_PATTERN.test(String(value ?? ''))) throw new Error(`${label} must be a kebab-case stable id`);
}

function validDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function hkjcDetailText(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compact(value) {
  return hkjcDetailText(value).replace(/\s+/g, ' ').trim();
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(?:^|\D)(\d{1,2}):(\d{2})(?:\D|$)/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function extractRaceName(text, raceNumber) {
  const specific = text.match(new RegExp(`Race\\s*${raceNumber}\\s*[-–—:]\\s*([^\\n]+)`, 'i'));
  if (specific?.[1]) return specific[1].replace(/\s+/g, ' ').trim().slice(0, 180);
  const collapsed = compact(text);
  const fallback = collapsed.match(new RegExp(`Race\\s*${raceNumber}\\s*[-–—:]\\s*(.+?)(?=\\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\\s+[A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\s+(?:Turf|All Weather Track|All Weather|Dirt),|$)`, 'i'));
  return fallback?.[1] ? fallback[1].replace(/\s+/g, ' ').trim().slice(0, 180) : null;
}

function extractPostTime(text) {
  const dated = text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Za-z]+\s+\d{1,2},\s+\d{4},\s+[^,\n]+,\s+(\d{1,2}:\d{2})/i);
  if (dated?.[1]) return normalizeTime(dated[1]);
  const labeled = text.match(/(?:Post\s*Time|Start\s*Time|Race\s*Time)\s*[:：]?\s*(\d{1,2}:\d{2})/i);
  return labeled?.[1] ? normalizeTime(labeled[1]) : null;
}

function extractSurfaceCourseDistance(text) {
  const structured = text.match(/\b(Turf|All Weather Track|All Weather|Dirt)\b,\s*"?([ABC](?:\+\d+)?)"?\s+Course,\s*(\d{3,4})M/i);
  if (structured) {
    return {
      surface: structured[1] === 'All Weather' ? 'All Weather Track' : structured[1],
      course_label: `${structured[2].toUpperCase()} Course`,
      distance_m: Number(structured[3]),
    };
  }
  const distance = text.match(/\b(\d{3,4})M\b/i);
  const surface = text.match(/\b(Turf|All Weather Track|All Weather|Dirt)\b/i);
  const course = text.match(/"?([ABC](?:\+\d+)?)"?\s+Course/i);
  return {
    surface: surface?.[1] ? (surface[1] === 'All Weather' ? 'All Weather Track' : surface[1]) : null,
    course_label: course?.[1] ? `${course[1].toUpperCase()} Course` : null,
    distance_m: distance?.[1] ? Number(distance[1]) : null,
  };
}

function officialHkjcUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'racing.hkjc.com';
  } catch {
    return false;
  }
}

export function parseHkjcPublicSafeRacecardHtml(html, { raceNumber, sourceUrl }) {
  if (!Number.isInteger(raceNumber) || raceNumber < 1 || raceNumber > 30) throw new Error('raceNumber must be an integer from 1 through 30');
  if (!officialHkjcUrl(sourceUrl)) throw new Error('sourceUrl must be an official racing.hkjc.com HTTPS URL');
  const text = hkjcDetailText(html);
  const metadata = extractSurfaceCourseDistance(text);
  const postTime = extractPostTime(text);
  const raceName = extractRaceName(text, raceNumber);
  return {
    race_number: raceNumber,
    label: `Race ${raceNumber}`,
    post_time_local: postTime,
    race_name: raceName,
    distance_m: metadata.distance_m,
    surface: metadata.surface,
    course_label: metadata.course_label,
    source_url: sourceUrl,
    missing_fields: [
      ...(!postTime ? ['post_time_local'] : []),
      ...(!raceName ? ['race_name'] : []),
      ...(metadata.distance_m == null ? ['distance_m'] : []),
      ...(!metadata.surface && !metadata.course_label ? ['surface_or_course_label'] : []),
    ],
  };
}

function continuousFromOne(numbers) {
  return numbers.length > 0 && numbers.every((value, index) => value === index + 1);
}

function publicRow(observation, includeMetadata) {
  return includeMetadata
    ? {
        label: observation.label,
        post_time_local: observation.post_time_local,
        race_name: observation.race_name,
        distance_m: observation.distance_m,
        surface: observation.surface,
        course_label: observation.course_label,
      }
    : {
        label: observation.label,
        post_time_local: observation.post_time_local,
      };
}

export function classifyHkjcDetailObservation({ race_observations: observations, meeting_complete: meetingComplete }) {
  const sorted = [...(observations ?? [])]
    .filter((row) => Number.isInteger(row?.race_number))
    .sort((left, right) => left.race_number - right.race_number);
  const unique = new Map(sorted.map((row) => [row.race_number, row]));
  const rows = [...unique.values()];
  const timedRows = rows.filter((row) => row.post_time_local);
  const timedNumbers = timedRows.map((row) => row.race_number);
  const continuousTimes = continuousFromOne(timedNumbers);
  const completeAPlus = meetingComplete === true
    && continuousTimes
    && timedRows.length >= 2
    && timedRows.every((row) => row.race_name && row.distance_m != null && (row.surface || row.course_label));

  if (completeAPlus) {
    return {
      rank: 'A+',
      first_race_time_local: timedRows[0].post_time_local,
      last_race_time_local: timedRows.at(-1).post_time_local,
      timetable_rows: timedRows.map((row) => publicRow(row, true)),
    };
  }
  if (meetingComplete === true && continuousTimes && timedRows.length >= 2) {
    return {
      rank: 'A',
      first_race_time_local: timedRows[0].post_time_local,
      last_race_time_local: timedRows.at(-1).post_time_local,
      timetable_rows: timedRows.map((row) => publicRow(row, false)),
    };
  }
  if (meetingComplete === true && timedRows.length >= 2 && timedRows.some((row) => row.race_number === 1)) {
    return {
      rank: 'B+',
      first_race_time_local: timedRows.find((row) => row.race_number === 1).post_time_local,
      last_race_time_local: timedRows.at(-1).post_time_local,
      timetable_rows: [],
    };
  }
  const first = timedRows.find((row) => row.race_number === 1);
  if (first) {
    return {
      rank: 'B',
      first_race_time_local: first.post_time_local,
      last_race_time_local: null,
      timetable_rows: [],
    };
  }
  return {
    rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
  };
}

function sourceErrorFromPage(result, meetingId) {
  if (result?.ok === true && typeof result.body === 'string') return null;
  const code = result?.error_code ?? (result?.status === 429 ? 'rate_limited' : result?.status ? 'unexpected_response' : 'source_unavailable');
  return {
    code: ['source_unavailable', 'parser_failure', 'rate_limited', 'unexpected_response', 'other'].includes(code) ? code : 'other',
    scope_ref: `${meetingId}:race-${result?.race_number ?? 'unknown'}`,
    message: String(result?.error_message ?? `HKJC racecard acquisition failed for ${meetingId} Race ${result?.race_number ?? 'unknown'}.`).slice(0, 500),
  };
}

function meetingCandidate({ meeting, classification, generatedAt, sourceUrl }) {
  return {
    candidate_id: `candidate-${meeting.meeting_id}`,
    meeting_id: meeting.meeting_id,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racing_system_id: SYSTEM_ID,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: TIMEZONE,
    capability_rank: classification.rank,
    first_race_time_local: classification.first_race_time_local,
    last_race_time_local: classification.last_race_time_local,
    timetable_rows: classification.timetable_rows,
    source: {
      source_id: SOURCE_ID,
      official_url: sourceUrl,
      checked_at: generatedAt,
      extraction_method: 'adapter_candidate',
    },
    confidence: classification.rank === 'C' ? 'medium' : 'high',
    review_status: 'needs_review',
    notes: `HKJC artifact-only public-safe timetable detail observation classified at ${classification.rank}; human review remains required and no participant, betting, result, payout, prediction, raw-source, embedded-video, or direct-stream data is retained.`,
  };
}

function requestedScope(startDate, endDateExclusive) {
  return { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: TIMEZONE };
}

function coverageScope(startDate, endDateExclusive) {
  return { kind: 'date_window', ...requestedScope(startDate, endDateExclusive) };
}

function artifactRefs(batchId) {
  const base = `data/generated/timetable/actions-multi-job/${batchId}`;
  return {
    candidate_ref: `${base}/candidates.json`,
    coverage_observation_ref: `${base}/coverage-observation.json`,
    collection_report_ref: `${base}/collection-report.json`,
  };
}

export function buildHkjcDetailArtifacts({
  startDate,
  endDateExclusive,
  generatedAt,
  batchId,
  campaignId,
  jobId,
  meetingInputs,
  runnerUsed = 'github_actions',
}) {
  if (!validDate(startDate) || !validDate(endDateExclusive) || startDate >= endDateExclusive) throw new Error('invalid detail artifact date window');
  if (!validDateTime(generatedAt)) throw new Error('generatedAt must be a valid date-time');
  for (const [value, label] of [[batchId, 'batchId'], [campaignId, 'campaignId'], [jobId, 'jobId']]) assertId(value, label);
  if (!['github_actions', 'local', 'reviewed_import'].includes(runnerUsed)) throw new Error('runnerUsed invalid');
  if (!Array.isArray(meetingInputs) || meetingInputs.length === 0) throw new Error('meetingInputs must contain at least one bounded meeting');

  const records = [];
  const sourceErrors = [];
  const unresolvedMeetingIds = [];
  const reports = [];
  let observedMeetingCount = 0;

  for (const input of meetingInputs) {
    const meeting = input?.meeting ?? {};
    assertId(meeting.meeting_id, 'meeting.meeting_id');
    assertId(meeting.racecourse_id, 'meeting.racecourse_id');
    if (!validDate(meeting.date) || meeting.date < startDate || meeting.date >= endDateExclusive) throw new Error(`meeting ${meeting.meeting_id} outside requested window`);
    const pageResults = Array.isArray(input.page_results) ? input.page_results : [];
    const observations = [];
    const meetingErrors = [];

    for (const result of pageResults) {
      const acquisitionError = sourceErrorFromPage(result, meeting.meeting_id);
      if (acquisitionError) {
        meetingErrors.push(acquisitionError);
        continue;
      }
      try {
        observations.push(parseHkjcPublicSafeRacecardHtml(result.body, {
          raceNumber: result.race_number,
          sourceUrl: result.final_url ?? result.requested_url,
        }));
      } catch (error) {
        meetingErrors.push({
          code: 'parser_failure',
          scope_ref: `${meeting.meeting_id}:race-${result?.race_number ?? 'unknown'}`,
          message: String(error.message).slice(0, 500),
        });
      }
    }

    const classification = classifyHkjcDetailObservation({
      race_observations: observations,
      meeting_complete: input.meeting_complete === true,
    });
    const sourceUrl = observations[0]?.source_url ?? pageResults.find((result) => officialHkjcUrl(result?.final_url ?? result?.requested_url))?.final_url ?? pageResults.find((result) => officialHkjcUrl(result?.requested_url))?.requested_url;
    if (!sourceUrl || !officialHkjcUrl(sourceUrl)) throw new Error(`meeting ${meeting.meeting_id} has no official HKJC source URL`);

    records.push(meetingCandidate({ meeting, classification, generatedAt, sourceUrl }));
    sourceErrors.push(...meetingErrors);
    if (meetingErrors.length > 0 || input.meeting_complete !== true) unresolvedMeetingIds.push(meeting.meeting_id);
    if (observations.length > 0 || input.meeting_complete === true) observedMeetingCount += 1;
    reports.push({
      meeting_id: meeting.meeting_id,
      observed_page_count: observations.length,
      meeting_complete: input.meeting_complete === true,
      rank: classification.rank,
      source_error_count: meetingErrors.length,
      unresolved: meetingErrors.length > 0 || input.meeting_complete !== true,
    });
  }

  records.sort((left, right) => `${left.date}:${left.meeting_id}`.localeCompare(`${right.date}:${right.meeting_id}`));
  const uniqueUnresolved = [...new Set(unresolvedMeetingIds)].sort();
  const claim = sourceErrors.length === 0 && uniqueUnresolved.length === 0
    ? 'source_window_complete'
    : observedMeetingCount > 0
      ? 'partial'
      : 'none';
  const observedScope = observedMeetingCount > 0 ? coverageScope(startDate, endDateExclusive) : { kind: 'not_observed', timezone: TIMEZONE };
  const rankCounts = Object.fromEntries(RANKS.map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
  const requested = requestedScope(startDate, endDateExclusive);
  const refs = artifactRefs(batchId);

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
      summary: 'HKJC artifact-only public-safe timetable detail candidates. Human review and Promotion Validation remain required; Registry detail activation is separate.',
      promotion_target: null,
    },
  };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: generatedAt,
    requested_scope: coverageScope(startDate, endDateExclusive),
    observed_scope: observedScope,
    collection_mode: 'date_window',
    records_discovered: records.length,
    records_updated: records.filter((record) => record.capability_rank !== 'C').length,
    unresolved_dates: [],
    unresolved_meeting_ids: uniqueUnresolved,
    source_errors: sourceErrors,
    coverage_claim: claim,
    completion_audit_ref: null,
  };

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
    records_updated: coverage.records_updated,
    rank_counts: rankCounts,
    unresolved_dates: [],
    unresolved_meeting_ids: uniqueUnresolved,
    source_errors: sourceErrors,
    artifact_refs: refs,
  };

  const report = {
    schema_version: 'calendar-hkjc-detail-artifact-report-v1',
    work_id: 'WHR-CAL-HONG-KONG-HKJC',
    implementation_unit: 'HKJC-PILOT-05',
    batch_id: batchId,
    generated_at: generatedAt,
    requested_scope: requested,
    meeting_reports: reports,
    records_discovered: records.length,
    records_updated: coverage.records_updated,
    rank_counts: rankCounts,
    unresolved_meeting_ids: uniqueUnresolved,
    source_error_count: sourceErrors.length,
    coverage_claim: claim,
    candidate_mode: 'review_only',
    publication_effect: 'none',
    raw_source_storage: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
  };

  return { candidate, coverage, manifest, report };
}

export const HKJC_DETAIL_ARTIFACT_V1 = Object.freeze({
  timezone: TIMEZONE,
  system_id: SYSTEM_ID,
  country_id: COUNTRY_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  ranks: RANKS,
});
