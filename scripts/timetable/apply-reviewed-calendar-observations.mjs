import fs from 'node:fs';
import path from 'node:path';

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
function capRank(value, ceiling) {
  return rank(value) <= rank(ceiling) ? value : ceiling;
}
function assertHttps(url, meetingId) {
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error(`reviewed observation missing HTTPS official source for ${meetingId}`);
  }
}
function choosePolicy(authorityId, policyDataset) {
  const matches = (policyDataset.policies ?? [])
    .filter((policy) => (policy.match?.authority_ids ?? []).includes(authorityId))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matches[0] ?? policyDataset.default_policy;
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
    source_id: record.source_id,
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
function publicDetailFromCanonical(meeting, detail, listRow, policy, previousPublicDetail) {
  if (!detail || !['A', 'A+'].includes(listRow.effective_public_rank)) return null;
  const fields = policy.a_plus_fields ?? {};
  const showPlus = listRow.effective_public_rank === 'A+';
  return {
    ...(previousPublicDetail ?? {}),
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    max_public_rank: listRow.max_public_rank,
    effective_public_rank: listRow.effective_public_rank,
    policy_id: listRow.policy_id,
    official_source_url: listRow.official_source_url,
    source_status: 'verified',
    last_checked_date: listRow.last_checked_date,
    show_race_name: showPlus && fields.show_race_name === true,
    show_distance: showPlus && fields.show_distance === true,
    show_surface: showPlus && fields.show_surface === true,
    show_course: showPlus && fields.show_course === true,
    show_live_label: policy.show_live_label ?? false,
    show_replay_label: policy.show_replay_label ?? false,
    timetable_rows: (detail.timetable_rows ?? []).map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
      ...(showPlus && fields.show_race_name === true && row.race_name ? { race_name: row.race_name } : {}),
      ...(showPlus && fields.show_distance === true && Number.isFinite(row.distance_m) ? { distance_m: row.distance_m } : {}),
      ...(showPlus && fields.show_surface === true && row.surface ? { surface: row.surface } : {}),
      ...(showPlus && fields.show_course === true && row.course_label ? { course_label: row.course_label } : {}),
    })),
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
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const canonicalDetailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const publicById = new Map((publicList.meetings ?? []).map((row) => [row.meeting_id, row]));
const publicDetailsById = new Map((publicDetails.details ?? []).map((row) => [row.meeting_id, row]));
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

  let meeting = previous;
  let repairedCanonical = false;
  const rankNeedsRepair = rank(previous.capability_rank) < rank(record.capability_rank);
  const firstNeedsRepair = rank(record.capability_rank) >= rank('B')
    && record.first_race_time_local && !previous.first_race_time_local;
  const lastNeedsRepair = rank(record.capability_rank) >= rank('B+')
    && record.last_race_time_local && !previous.last_race_time_local;

  if (rankNeedsRepair || firstNeedsRepair || lastNeedsRepair) {
    meeting = {
      ...previous,
      capability_rank: rankNeedsRepair ? record.capability_rank : previous.capability_rank,
      display_status: (rankNeedsRepair ? record.capability_rank : previous.capability_rank) === 'C' ? 'partial' : 'displayable',
      first_race_time_local: previous.first_race_time_local ?? record.first_race_time_local ?? null,
      last_race_time_local: previous.last_race_time_local ?? record.last_race_time_local ?? null,
      source_trace: reviewedSourceTrace(previous, record),
      freshness: reviewedFreshness(previous, record, generatedAt),
    };
    canonicalById.set(record.meeting_id, meeting);
    repairedCanonical = true;
    changed = true;
    selected.push(record);
    if (rankNeedsRepair) outcomes.canonical_rank_repairs += 1;
    if (firstNeedsRepair || lastNeedsRepair) outcomes.canonical_time_repairs += 1;
  }

  let detail = canonicalDetailsById.get(record.meeting_id) ?? null;
  const reviewedRows = Array.isArray(record.timetable_rows) ? record.timetable_rows : [];
  const detailNeedsRepair = rank(record.capability_rank) >= rank('A') && !detail && reviewedRows.length > 0;
  if (detailNeedsRepair) {
    detail = {
      meeting_id: meeting.meeting_id,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: meeting.timezone,
      capability_rank: meeting.capability_rank,
      source_trace: repairedCanonical ? meeting.source_trace : reviewedSourceTrace(meeting, record),
      freshness: repairedCanonical ? meeting.freshness : reviewedFreshness(meeting, record, generatedAt),
      timetable_rows: reviewedRows,
      summary_note: 'Frozen human-reviewed official race programme observation.',
    };
    canonicalDetailsById.set(record.meeting_id, detail);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.canonical_detail_repairs += 1;
  }

  const policy = choosePolicy(meeting.authority_id, policyDataset);
  const ceiling = policy.max_public_rank ?? 'C';
  let desiredPublicRank = capRank(meeting.capability_rank, ceiling);
  if (rank(desiredPublicRank) >= rank('A') && (!detail || !(detail.timetable_rows ?? []).length)) {
    desiredPublicRank = meeting.first_race_time_local && meeting.last_race_time_local
      ? 'B+'
      : meeting.first_race_time_local ? 'B' : 'C';
  }
  const minimumReviewedPublicRank = capRank(record.capability_rank, ceiling);
  if (rank(desiredPublicRank) < rank(minimumReviewedPublicRank)) {
    throw new Error(`reviewed data cannot satisfy policy-projected minimum rank for ${record.meeting_id}`);
  }

  const previousPublic = publicById.get(record.meeting_id) ?? null;
  const publicNeedsRepair = !previousPublic
    || rank(previousPublic.effective_public_rank) < rank(minimumReviewedPublicRank)
    || (record.first_race_time_local && !previousPublic.first_race_time_local)
    || (rank(record.capability_rank) >= rank('B+') && record.last_race_time_local && !previousPublic.last_race_time_local);

  let publicMeeting = previousPublic;
  if (publicNeedsRepair) {
    publicMeeting = {
      meeting_id: meeting.meeting_id,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: meeting.timezone,
      capability_rank: meeting.capability_rank,
      max_public_rank: ceiling,
      effective_public_rank: desiredPublicRank,
      first_race_time_local: meeting.first_race_time_local ?? record.first_race_time_local ?? null,
      last_race_time_local: meeting.last_race_time_local ?? record.last_race_time_local ?? null,
      policy_id: policy.id,
      source_status: 'verified',
      official_source_url: meeting.source_trace?.official_source_url ?? record.official_source_url,
      last_checked_date: meeting.freshness?.last_checked_date ?? record.last_checked_date ?? null,
      detail_path: ['A', 'A+'].includes(desiredPublicRank) ? `/timetable/meetings/${meeting.meeting_id}/` : null,
      show_live_label: policy.show_live_label ?? previousPublic?.show_live_label ?? false,
      show_replay_label: policy.show_replay_label ?? previousPublic?.show_replay_label ?? false,
    };
    publicById.set(record.meeting_id, publicMeeting);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.public_repairs += 1;
  }

  const previousPublicDetail = publicDetailsById.get(record.meeting_id) ?? null;
  const publicDetailNeedsRepair = rank(minimumReviewedPublicRank) >= rank('A') && !previousPublicDetail;
  if (publicDetailNeedsRepair) {
    const repaired = publicDetailFromCanonical(meeting, detail, publicMeeting, policy, previousPublicDetail);
    if (!repaired) throw new Error(`reviewed public detail could not be rebuilt for ${record.meeting_id}`);
    publicDetailsById.set(record.meeting_id, repaired);
    changed = true;
    if (!selected.some((item) => item.meeting_id === record.meeting_id)) selected.push(record);
    outcomes.public_detail_repairs += 1;
  }

  if (!rankNeedsRepair && !firstNeedsRepair && !lastNeedsRepair && !detailNeedsRepair && !publicNeedsRepair && !publicDetailNeedsRepair) {
    outcomes.already_preserved += 1;
  }
}

writeJson(ARTIFACT_PATH, {
  schema_version: 'reviewed-calendar-official-observation-artifact-v1',
  generated_at: generatedAt,
  source_id: 'reviewed-calendar-public-observations',
  records: selected,
});

if (changed) {
  const sortRows = (rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  writeJson(CANONICAL_PATH, { ...canonical, generated_at: generatedAt, meetings: sortRows(canonicalById.values()) });
  writeJson(CANONICAL_DETAILS_PATH, { ...canonicalDetails, generated_at: generatedAt, details: sortRows(canonicalDetailsById.values()) });
  writeJson(PUBLIC_PATH, { ...publicList, generated_at: generatedAt, meetings: sortRows(publicById.values()) });
  writeJson(PUBLIC_DETAILS_PATH, { ...publicDetails, generated_at: generatedAt, details: sortRows(publicDetailsById.values()) });
}

const finalCanonical = readJson(CANONICAL_PATH);
const finalCanonicalDetails = readJson(CANONICAL_DETAILS_PATH);
const finalPublic = readJson(PUBLIC_PATH);
const finalPublicDetails = readJson(PUBLIC_DETAILS_PATH);
const finalCanonicalById = new Map((finalCanonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalCanonicalDetailsById = new Map((finalCanonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const finalPublicById = new Map((finalPublic.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalPublicDetailsById = new Map((finalPublicDetails.details ?? []).map((row) => [row.meeting_id, row]));

for (const record of reviewedById.values()) {
  const meeting = finalCanonicalById.get(record.meeting_id);
  const publicMeeting = finalPublicById.get(record.meeting_id);
  const policy = choosePolicy(record.authority_id, policyDataset);
  const minimumPublicRank = capRank(record.capability_rank, policy.max_public_rank ?? 'C');
  if (!meeting || rank(meeting.capability_rank) < rank(record.capability_rank)) {
    throw new Error(`reviewed canonical rank was not preserved for ${record.meeting_id}`);
  }
  if (!publicMeeting || rank(publicMeeting.effective_public_rank) < rank(minimumPublicRank)) {
    throw new Error(`reviewed public rank was not preserved for ${record.meeting_id}`);
  }
  if (rank(record.capability_rank) >= rank('B') && !meeting.first_race_time_local) {
    throw new Error(`reviewed first-race time was not preserved for ${record.meeting_id}`);
  }
  if (rank(record.capability_rank) >= rank('B+') && !meeting.last_race_time_local) {
    throw new Error(`reviewed last-race time was not preserved for ${record.meeting_id}`);
  }
  if (rank(record.capability_rank) >= rank('A')) {
    const canonicalDetail = finalCanonicalDetailsById.get(record.meeting_id);
    const publicDetail = finalPublicDetailsById.get(record.meeting_id);
    if (!canonicalDetail || !(canonicalDetail.timetable_rows ?? []).length || !publicDetail || !(publicDetail.timetable_rows ?? []).length) {
      throw new Error(`reviewed race detail was not preserved for ${record.meeting_id}`);
    }
  }
}

console.log(JSON.stringify({ manifest: MANIFEST_PATH, artifact: ARTIFACT_PATH, changed, outcomes }));
