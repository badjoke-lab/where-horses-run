import fs from 'node:fs';
import path from 'node:path';
import { validateCalendarAuthorityMetadataV1 } from './calendar-authority-metadata.mjs';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { acceptCanonicalObservationV1 } from './canonical-acceptance.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { reconcilePublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((value, index) => [value, index]));
const MANIFEST_PATH = 'data/static/calendar-reviewed-public-observations.json';
const CANONICAL_PATH = 'data/generated/timetable/canonical/meetings.json';
const CANONICAL_DETAILS_PATH = 'data/generated/timetable/canonical/meeting-details.json';
const PUBLIC_PATH = 'data/generated/timetable/public/meeting-list.json';
const PUBLIC_DETAILS_PATH = 'data/generated/timetable/public/meeting-details.json';
const POLICIES_PATH = 'src/data/publicationDisplayPolicies.json';
const ARTIFACT_PATH = '.calendar-unified/reviewed-public-observations.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function rank(value) {
  return RANK_INDEX.get(value) ?? -1;
}
function assertHttps(url, meetingId) {
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error(`reviewed observation missing HTTPS official source for ${meetingId}`);
  }
}
function normalizeMeetingDetail(meeting, detail, origin, fallbackLastCheckedDate = null) {
  if (!meeting?.meeting_id) throw new Error(`reviewed supplement ${origin} has no meeting_id`);
  if (!RANK_INDEX.has(meeting.capability_rank)) {
    throw new Error(`reviewed supplement ${origin} has invalid rank for ${meeting.meeting_id}`);
  }
  const officialSourceUrl = meeting.official_source_url ?? detail?.official_source_url ?? null;
  assertHttps(officialSourceUrl, meeting.meeting_id);
  if (meeting.source_status && meeting.source_status !== 'verified') {
    throw new Error(`reviewed supplement ${origin} is not verified for ${meeting.meeting_id}`);
  }
  return {
    ...meeting,
    official_source_url: officialSourceUrl,
    last_checked_date: meeting.last_checked_date ?? detail?.last_checked_date ?? fallbackLastCheckedDate,
    source_id: `reviewed-public:${origin}`,
    source_label: 'Human-reviewed official timetable observation',
    reviewed: true,
    ...(Array.isArray(detail?.timetable_rows) ? { timetable_rows: detail.timetable_rows } : {}),
  };
}
function normalizeKawasaki(data, origin) {
  if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v2') {
    throw new Error(`unexpected Kawasaki reviewed schema in ${origin}: ${data.schema_version}`);
  }
  if (!Array.isArray(data.meetings)) throw new Error(`Kawasaki reviewed supplement ${origin} has no meetings`);
  return data.meetings.map((item) => {
    if (!item?.date || !Array.isArray(item.timetable_rows) || item.timetable_rows.length === 0) {
      throw new Error(`malformed Kawasaki reviewed meeting in ${origin}`);
    }
    const meetingId = `nar-kawasaki-racecourse-${item.date}`;
    assertHttps(item.source_url, meetingId);
    return {
      meeting_id: meetingId,
      country_id: 'japan',
      authority_id: 'nar-local-government-racing',
      racecourse_id: 'kawasaki-racecourse',
      date: item.date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      first_race_time_local: item.timetable_rows[0]?.post_time_local ?? null,
      last_race_time_local: item.timetable_rows.at(-1)?.post_time_local ?? null,
      official_source_url: item.source_url,
      last_checked_date: data.last_checked_date ?? null,
      source_id: `reviewed-public:${origin}`,
      source_label: 'Human-reviewed official timetable observation',
      source_status: 'verified',
      reviewed: true,
      timetable_rows: item.timetable_rows,
    };
  });
}
function recordsFromSupplement(spec) {
  const data = readJson(spec.path);
  if (spec.mode === 'meeting_detail') {
    if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v1') {
      throw new Error(`unexpected reviewed schema in ${spec.path}: ${data.schema_version}`);
    }
    return [normalizeMeetingDetail(data.meeting, data.detail, spec.path, data.last_checked_date ?? null)];
  }
  if (spec.mode === 'records') {
    if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v1' || !Array.isArray(data.records)) {
      throw new Error(`unexpected reviewed records schema in ${spec.path}`);
    }
    return data.records.map(({ meeting, detail }) => (
      normalizeMeetingDetail(meeting, detail, spec.path, data.last_checked_date ?? null)
    ));
  }
  if (spec.mode === 'kawasaki_meetings') return normalizeKawasaki(data, spec.path);
  throw new Error(`unknown reviewed supplement mode ${spec.mode} for ${spec.path}`);
}
function reviewedSourceTrace(previous, record) {
  return {
    ...(previous?.source_trace ?? {}),
    source_id: previous?.source_trace?.source_id ?? record.source_id,
    route_id: previous?.source_trace?.route_id ?? null,
    source_status: 'verified',
    official_source_url: record.official_source_url,
    source_label: record.source_label,
    extraction_method: 'human_reviewed',
    source_snapshot_path: null,
    normalized_from_path: 'scripts/timetable/apply-reviewed-calendar-observations.mjs',
  };
}
function reviewedFreshness(previous, record, generatedAt) {
  return {
    ...(previous?.freshness ?? {}),
    last_checked_date: record.last_checked_date ?? previous?.freshness?.last_checked_date ?? null,
    generated_at: generatedAt,
    stale_after_date: previous?.freshness?.stale_after_date ?? null,
    freshness_note: 'Restored from a frozen human-reviewed official timetable observation; last_checked_date is the review date.',
  };
}
const manifest = readJson(MANIFEST_PATH);
if (manifest.schema_version !== 'reviewed-calendar-public-observations-v1') {
  throw new Error(`unsupported reviewed Calendar manifest schema: ${manifest.schema_version}`);
}

const reviewedById = new Map();
function addReviewed(record, origin) {
  if (!record?.meeting_id || !RANK_INDEX.has(record.capability_rank)) {
    throw new Error(`invalid reviewed Calendar observation from ${origin}`);
  }
  assertHttps(record.official_source_url, record.meeting_id);
  if (reviewedById.has(record.meeting_id)) {
    throw new Error(`duplicate reviewed Calendar observation for ${record.meeting_id}`);
  }
  reviewedById.set(record.meeting_id, {
    ...record,
    source_id: record.source_id ?? `reviewed-public:${origin}`,
    source_label: record.source_label ?? 'Human-reviewed official timetable observation',
    source_status: 'verified',
    reviewed: true,
  });
}

for (const spec of manifest.supplements ?? []) {
  for (const record of recordsFromSupplement(spec)) addReviewed(record, spec.path);
}
for (const record of manifest.records ?? []) addReviewed(record, MANIFEST_PATH);

const canonical = readJson(CANONICAL_PATH);
const canonicalDetails = readJson(CANONICAL_DETAILS_PATH);
const publicList = readJson(PUBLIC_PATH);
const publicDetails = readJson(PUBLIC_DETAILS_PATH);
const policyDataset = readJson(POLICIES_PATH);
const sourceAliases = readJson('data/static/timetable-source-aliases-v1.json');
const readinessRegistry = loadCalendarReadinessV1(process.cwd());
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const canonicalDetailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const generatedAt = new Date().toISOString();
const selected = [];
const outcomes = {
  registered: reviewedById.size,
  canonical_rank_repairs: 0,
  canonical_detail_repairs: 0,
  canonical_time_repairs: 0,
  public_repairs: 0,
  public_detail_repairs: 0,
  already_preserved: 0,
};
let changed = false;

for (const record of reviewedById.values()) {
  const previous = canonicalById.get(record.meeting_id);
  if (!previous) {
    throw new Error(`reviewed Calendar observation has no canonical mother-set meeting: ${record.meeting_id}`);
  }

  const previousDetail = canonicalDetailsById.get(record.meeting_id) ?? null;
  const reviewedRows = Array.isArray(record.timetable_rows) ? record.timetable_rows : [];
  const reviewedEvidenceRank = deriveBestAvailableRank(record, reviewedRows);
  const hasReviewedEvidenceChanges = (record.evidence_changes ?? []).length > 0;
  if (!hasReviewedEvidenceChanges && rank(record.capability_rank) > rank(reviewedEvidenceRank)) {
    throw new Error(`reviewed observation rank exceeds its evidence-derived rank for ${record.meeting_id}: declared=${record.capability_rank} evidence=${reviewedEvidenceRank}`);
  }

  const candidateMeeting = {
    meeting_id: record.meeting_id,
    country_id: record.country_id ?? previous.country_id,
    authority_id: record.authority_id ?? previous.authority_id,
    racing_system_id: record.racing_system_id ?? previous.racing_system_id,
    racecourse_id: record.racecourse_id ?? previous.racecourse_id,
    date: record.date ?? previous.date,
    timezone: record.timezone ?? previous.timezone,
    capability_rank: reviewedEvidenceRank,
    display_status: reviewedEvidenceRank === 'C' ? 'partial' : 'displayable',
    first_race_time_local: record.first_race_time_local ?? reviewedRows[0]?.post_time_local ?? null,
    last_race_time_local: record.last_race_time_local ?? reviewedRows.at(-1)?.post_time_local ?? null,
    source_trace: reviewedSourceTrace(previous, record),
    freshness: reviewedFreshness(previous, record, generatedAt),
    ...('acquisition_attempt' in record ? { acquisition_attempt: structuredClone(record.acquisition_attempt) } : {}),
    ...(record.evidence_support ? { evidence_support: structuredClone(record.evidence_support) } : {}),
    ...(record.evidence_changes ? { evidence_changes: structuredClone(record.evidence_changes) } : {}),
  };
  const candidateDetail = reviewedRows.length
    ? {
        meeting_id: candidateMeeting.meeting_id,
        country_id: candidateMeeting.country_id,
        authority_id: candidateMeeting.authority_id,
        racecourse_id: candidateMeeting.racecourse_id,
        date: candidateMeeting.date,
        timezone: candidateMeeting.timezone,
        capability_rank: reviewedEvidenceRank,
        source_trace: candidateMeeting.source_trace,
        freshness: candidateMeeting.freshness,
        ...(record.evidence_support ? { evidence_support: structuredClone(record.evidence_support) } : {}),
        ...(record.evidence_changes ? { evidence_changes: structuredClone(record.evidence_changes) } : {}),
        timetable_rows: reviewedRows,
        summary_note: 'Frozen human-reviewed official race programme observation.',
      }
    : null;

  const reviewedAuthorityMetadata = Object.fromEntries(
    ['acquisition_attempt', 'evidence_support', 'evidence_changes']
      .filter((key) => key in record)
      .map((key) => [key, record[key]]),
  );
  const reviewedMetadataErrors = validateCalendarAuthorityMetadataV1(
    reviewedAuthorityMetadata,
    `reviewed:${record.meeting_id}`,
  );
  if (reviewedMetadataErrors.length) throw new Error(reviewedMetadataErrors.join('; '));

  const accepted = acceptCanonicalObservationV1({
    previousMeeting: previous,
    previousDetail,
    candidateMeeting,
    candidateDetail,
    ...('acquisition_attempt' in record ? { acquisitionAttempt: record.acquisition_attempt } : {}),
    evidenceChanges: record.evidence_changes ?? [],
  });
  const meeting = accepted.meeting;
  const detail = accepted.detail;
  const canonicalChanged = JSON.stringify(previous) !== JSON.stringify(meeting);
  const detailChanged = JSON.stringify(previousDetail) !== JSON.stringify(detail);

  if (canonicalChanged) {
    canonicalById.set(record.meeting_id, meeting);
    changed = true;
    selected.push(record);
    if (rank(meeting.capability_rank) > rank(previous.capability_rank)) outcomes.canonical_rank_repairs += 1;
    if ((!previous.first_race_time_local && meeting.first_race_time_local)
      || (!previous.last_race_time_local && meeting.last_race_time_local)) outcomes.canonical_time_repairs += 1;
  }
  if (detailChanged) {
    if (detail) canonicalDetailsById.set(record.meeting_id, detail);
    else canonicalDetailsById.delete(record.meeting_id);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.canonical_detail_repairs += 1;
  }

  if (!canonicalChanged && !detailChanged) {
    outcomes.already_preserved += 1;
  }
}

writeJson(ARTIFACT_PATH, {
  schema_version: 'reviewed-calendar-official-observation-artifact-v1',
  generated_at: generatedAt,
  source_id: 'reviewed-calendar-public-observations',
  records: selected,
});

const sortRows = (rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
const nextCanonical = { ...canonical, generated_at: generatedAt, meetings: sortRows(canonicalById.values()) };
const nextCanonicalDetails = { ...canonicalDetails, generated_at: generatedAt, details: sortRows(canonicalDetailsById.values()) };
const reviewedScopeIds = new Set([...reviewedById.keys()]);

const publicProjection = reconcilePublicProjectionV1({
  canonicalMeetings: nextCanonical,
  canonicalDetails: nextCanonicalDetails,
  policyData: policyDataset,
  readinessRegistry,
  sourceAliases,
  existingMeetingList: publicList,
  existingMeetingDetails: publicDetails,
  scopeMeetingIds: reviewedScopeIds,
  generatedAt,
});

function publicRowsOnly(dataset, key) {
  return JSON.stringify(dataset[key] ?? []);
}
const publicChanged =
  publicRowsOnly(publicProjection.meetingListDataset, 'meetings') !== publicRowsOnly(publicList, 'meetings')
  || publicRowsOnly(publicProjection.meetingDetailsDataset, 'details') !== publicRowsOnly(publicDetails, 'details');

if (publicChanged) {
  outcomes.public_repairs = reviewedScopeIds.size;
  outcomes.public_detail_repairs = publicProjection.audit.decisions
    .filter((decision) => ['A', 'A+'].includes(decision.effective_public_rank))
    .length;
}

if (changed) {
  writeJson(CANONICAL_PATH, nextCanonical);
  writeJson(CANONICAL_DETAILS_PATH, nextCanonicalDetails);
}
if (changed || publicChanged) {
  writeJson(PUBLIC_PATH, publicProjection.meetingListDataset);
  writeJson(PUBLIC_DETAILS_PATH, publicProjection.meetingDetailsDataset);
}
changed = changed || publicChanged;

const finalCanonical = readJson(CANONICAL_PATH);
const finalCanonicalDetails = readJson(CANONICAL_DETAILS_PATH);
const finalPublic = readJson(PUBLIC_PATH);
const finalPublicDetails = readJson(PUBLIC_DETAILS_PATH);
const finalCanonicalById = new Map((finalCanonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalCanonicalDetailsById = new Map((finalCanonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const finalPublicById = new Map((finalPublic.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalPublicDetailsById = new Map((finalPublicDetails.details ?? []).map((row) => [row.meeting_id, row]));

for (const record of reviewedById.values()) {
  const reviewedRows = Array.isArray(record.timetable_rows) ? record.timetable_rows : [];
  const reviewedEvidenceRank = deriveBestAvailableRank(record, reviewedRows);
  const hasReviewedEvidenceChanges = (record.evidence_changes ?? []).length > 0;
  const meeting = finalCanonicalById.get(record.meeting_id);
  if (!meeting || (!hasReviewedEvidenceChanges && rank(meeting.capability_rank) < rank(reviewedEvidenceRank))) {
    throw new Error(`reviewed canonical evidence was not preserved for ${record.meeting_id}`);
  }
  if (rank(reviewedEvidenceRank) >= rank('B') && !meeting.first_race_time_local) {
    throw new Error(`reviewed first-race time was not preserved for ${record.meeting_id}`);
  }
  if (rank(reviewedEvidenceRank) >= rank('B+') && !meeting.last_race_time_local) {
    throw new Error(`reviewed last-race time was not preserved for ${record.meeting_id}`);
  }
  if (rank(reviewedEvidenceRank) >= rank('A')) {
    const canonicalDetail = finalCanonicalDetailsById.get(record.meeting_id);
    if (!canonicalDetail || !(canonicalDetail.timetable_rows ?? []).length) {
      throw new Error(`reviewed canonical race detail was not preserved for ${record.meeting_id}`);
    }
  }

  const decision = publicProjection.audit.decisions.find((item) => item.meeting_id === record.meeting_id);
  const publicMeeting = finalPublicById.get(record.meeting_id) ?? null;
  const publicDetail = finalPublicDetailsById.get(record.meeting_id) ?? null;
  if (decision?.include_in_public_list) {
    if (!publicMeeting || publicMeeting.effective_public_rank !== decision.effective_public_rank) {
      throw new Error(`reviewed public projection differs from shared publication authority for ${record.meeting_id}`);
    }
    if (['A', 'A+'].includes(decision.effective_public_rank) && !publicDetail) {
      throw new Error(`reviewed public detail was not projected by shared publication authority for ${record.meeting_id}`);
    }
  } else if (publicMeeting || publicDetail) {
    throw new Error(`reviewed observation bypassed shared publication exclusion for ${record.meeting_id}`);
  }
}

console.log(JSON.stringify({ manifest: MANIFEST_PATH, artifact: ARTIFACT_PATH, changed, outcomes }));
