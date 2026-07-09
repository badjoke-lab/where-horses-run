import fs from 'node:fs';
import path from 'node:path';
import { buildPublicProjectionV1 } from './timetable/pipeline-v1/public-projection-core.mjs';
import { loadCalendarReadinessV1, calendarReadinessPathsV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const executorFixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
const policyData = readJson('src/data/publicationDisplayPolicies.json');
const sourceAliases = readJson('data/static/timetable-source-aliases-v1.json');
const readiness = loadCalendarReadinessV1(root);
const selectedScenario = executorFixture.scenarios.find((scenario) => scenario.collection_mode === 'selected_meetings');
const candidate = selectedScenario?.detail_candidate?.records?.[0];

if (!candidate) fail('Banei selected-meeting A+ candidate fixture missing.');
if (calendarReadinessPathsV1.banei_detail !== 'data/static/calendar-readiness-banei-detail-v1.json') fail('Banei detail readiness path is not exported by loader.');

const detailReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/nar-banei-race-list-deba-table');
if (!detailReadiness) fail('Banei detail-source Readiness record missing from loaded registry.');
else {
  if (detailReadiness.system_id !== 'japan-banei-system') fail('Banei detail Readiness system differs.');
  if (detailReadiness.technical_rank !== 'A+' || detailReadiness.public_ceiling !== 'A+') fail('Banei detail Readiness must be A+ / A+.');
  if (detailReadiness.readiness !== 'prototype_ready' || detailReadiness.automation_mode !== 'semi_automatic') fail('Banei detail Readiness operating state differs.');
  if (!exact(detailReadiness.racecourse_ids, ['obihiro-racecourse'])) fail('Banei detail Readiness scope differs.');
  for (const field of ['meeting_date', 'racecourse', 'first_race_time', 'last_race_time', 'per_race_post_times', 'race_name', 'distance', 'surface', 'course']) {
    if (detailReadiness.confirmed_fields?.[field] !== true) fail(`Banei detail Readiness field not confirmed: ${field}`);
  }
}

const legacyScheduleReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/banei-official-schedule');
if (!legacyScheduleReadiness) fail('legacy Banei schedule Readiness missing.');
else {
  if (legacyScheduleReadiness.public_ceiling !== 'C' || legacyScheduleReadiness.readiness !== 'link_only') {
    fail('Banei detail supplement must not rewrite legacy schedule Readiness.');
  }
}

const baneiPolicy = policyData.policies.find((policy) => policy.id === 'japan-banei-a-plus');
if (!baneiPolicy) fail('Banei publication policy missing.');
else {
  if (baneiPolicy.max_public_rank !== 'A+') fail('Banei policy public maximum differs.');
  for (const key of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
    if (baneiPolicy.a_plus_fields?.[key] !== true) fail(`Banei A+ policy field disabled: ${key}`);
  }
}

function canonicalFromCandidate(record) {
  const generatedAt = '2026-07-09T05:00:00Z';
  const officialUrl = record.source.official_url;
  const sourceId = record.source.source_id;
  const sourceTrace = {
    source_id: sourceId,
    route_id: null,
    source_status: 'verified',
    official_source_url: officialUrl,
    source_label: 'Official source',
    extraction_method: 'adapter_candidate',
    source_snapshot_path: null,
    normalized_from_path: null,
  };
  const freshness = {
    last_checked_date: '2026-07-09',
    generated_at: generatedAt,
    stale_after_date: null,
    freshness_note: 'Banei bilingual public-display QA fixture only.',
  };
  return {
    meeting: {
      meeting_id: record.meeting_id,
      country_id: record.country_id,
      authority_id: record.authority_id,
      racecourse_id: record.racecourse_id,
      date: record.date,
      timezone: record.timezone,
      capability_rank: record.capability_rank,
      display_status: 'displayable',
      first_race_time_local: record.first_race_time_local,
      last_race_time_local: record.last_race_time_local,
      source_trace: structuredClone(sourceTrace),
      freshness: structuredClone(freshness),
      notes: 'Synthetic Banei public-display QA fixture; not canonical promotion input.',
    },
    detail: {
      meeting_id: record.meeting_id,
      country_id: record.country_id,
      authority_id: record.authority_id,
      racecourse_id: record.racecourse_id,
      date: record.date,
      timezone: record.timezone,
      capability_rank: record.capability_rank,
      source_trace: structuredClone(sourceTrace),
      freshness: structuredClone(freshness),
      timetable_rows: record.timetable_rows.map((row) => ({
        ...structuredClone(row),
        metadata_status: 'verified',
        source_label: 'Official source',
      })),
    },
  };
}

function legacyScheduleMeeting() {
  return {
    meeting_id: 'banei-obihiro-racecourse-2026-07-03-legacy-schedule-qa',
    country_id: 'japan',
    authority_id: 'banei-tokachi',
    racecourse_id: 'obihiro-racecourse',
    date: '2026-07-03',
    timezone: 'Asia/Tokyo',
    capability_rank: 'C',
    display_status: 'partial',
    first_race_time_local: null,
    last_race_time_local: null,
    source_trace: {
      source_id: 'banei-official-schedule',
      route_id: null,
      source_status: 'partial',
      official_source_url: 'https://www.banei-keiba.or.jp/race_schedule.php',
      source_label: 'Official source',
      extraction_method: 'fixture',
      source_snapshot_path: null,
      normalized_from_path: null,
    },
    freshness: {
      last_checked_date: '2026-07-09',
      generated_at: '2026-07-09T05:00:00Z',
      stale_after_date: null,
      freshness_note: 'Legacy schedule-source isolation fixture.',
    },
    notes: 'Legacy schedule-source isolation fixture.',
  };
}

function buildProjection(customPolicyData = policyData) {
  const converted = canonicalFromCandidate(candidate);
  return buildPublicProjectionV1({
    canonicalMeetings: {
      schema_version: 'canonical-timetable-v0',
      generated_at: '2026-07-09T05:00:00Z',
      input_sources: ['fixture:banei-public-display-qa'],
      meetings: [converted.meeting, legacyScheduleMeeting()],
    },
    canonicalDetails: {
      schema_version: 'canonical-meeting-details-v0',
      generated_at: '2026-07-09T05:00:00Z',
      input_sources: ['fixture:banei-public-display-qa'],
      details: [converted.detail],
    },
    policyData: customPolicyData,
    readinessRegistry: readiness,
    sourceAliases,
  });
}

let projection = null;
try {
  projection = buildProjection();
} catch (error) {
  fail(`Banei A+ fixture projection failed: ${error.message}`);
}

if (projection) {
  const meetingId = candidate.meeting_id;
  const meeting = projection.meetingListDataset.meetings.find((entry) => entry.meeting_id === meetingId);
  const detail = projection.meetingDetailsDataset.details.find((entry) => entry.meeting_id === meetingId);
  const decision = projection.audit.decisions.find((entry) => entry.meeting_id === meetingId);
  const legacyDecision = projection.audit.decisions.find((entry) => entry.meeting_id === legacyScheduleMeeting().meeting_id);

  if (!meeting || !detail || !decision) fail('Banei A+ public projection output missing.');
  else {
    if (projection.meetingListDataset.meetings.length !== 1) fail(`Banei list projection must contain exactly one visible meeting row, got ${projection.meetingListDataset.meetings.length}.`);
    if (projection.meetingDetailsDataset.details.length !== 1) fail('Banei detail projection count differs.');
    if (meeting.effective_public_rank !== 'A+' || detail.effective_public_rank !== 'A+') fail('Banei detail-source fixture must project at A+.');
    if (decision.readiness_id !== 'japan--japan-banei-system--nar-banei-race-list-deba-table') fail(`Banei A+ decision uses wrong Readiness record: ${decision.readiness_id}`);
    if (decision.policy_id !== 'japan-banei-a-plus') fail(`Banei decision policy differs: ${decision.policy_id}`);
    if (meeting.detail_path !== `/timetable/meetings/${meetingId}/`) fail('Banei meeting detail path differs.');

    const listForbidden = ['timetable_rows', 'race_name', 'distance_m', 'surface', 'course_label'];
    for (const key of listForbidden) if (key in meeting) fail(`Banei list row leaks detail field ${key}.`);

    for (const flag of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
      if (detail[flag] !== true) fail(`Banei A+ detail flag disabled: ${flag}`);
    }
    if (detail.timetable_rows.length !== candidate.timetable_rows.length) fail('Banei A+ projected row count differs from fixture.');
    for (const [index, row] of detail.timetable_rows.entries()) {
      const source = candidate.timetable_rows[index];
      for (const key of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
        if (row[key] !== source[key]) fail(`Banei row ${index} field ${key} changed: ${row[key]} != ${source[key]}`);
      }
      if (row.distance_m !== 200) fail(`Banei row ${index} distance must remain 200m.`);
      if (row.surface !== 'Dirt') fail(`Banei row ${index} Banei surface label changed.`);
      if (row.course_label !== 'Banei Straight Course') fail(`Banei row ${index} Banei course label changed.`);
    }
  }

  if (!legacyDecision) fail('legacy Banei schedule-source decision missing.');
  else {
    if (legacyDecision.include_in_public_list !== false) fail('legacy Banei schedule-source link-only fixture leaked into public list.');
    if (!String(legacyDecision.exclusion_reason).startsWith('readiness:link_only')) fail(`legacy Banei schedule exclusion differs: ${legacyDecision.exclusion_reason}`);
  }

  const serialized = JSON.stringify({ meeting: projection.meetingListDataset, detail: projection.meetingDetailsDataset }).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
    if (serialized.includes(`"${forbidden}"`)) fail(`forbidden public key present: ${forbidden}`);
  }
}

if (candidate) {
  const aPolicy = structuredClone(policyData);
  const policy = aPolicy.policies.find((entry) => entry.id === 'japan-banei-a-plus');
  policy.max_public_rank = 'A';
  let aProjection = null;
  try { aProjection = buildProjection(aPolicy); } catch (error) { fail(`Banei A downgrade fixture failed: ${error.message}`); }
  const aDetail = aProjection?.meetingDetailsDataset.details.find((entry) => entry.meeting_id === candidate.meeting_id);
  if (!aDetail || aDetail.effective_public_rank !== 'A') fail('Banei A downgrade did not project at A.');
  else {
    if (aDetail.show_race_name || aDetail.show_distance || aDetail.show_surface || aDetail.show_course) fail('Banei A downgrade kept A+ display flags.');
    for (const row of aDetail.timetable_rows) {
      const keys = Object.keys(row).sort();
      if (!exact(keys, ['label', 'post_time_local'])) fail(`Banei A downgrade row leaks fields: ${keys.join(', ')}`);
    }
  }

  const noNamePolicy = structuredClone(policyData);
  const noName = noNamePolicy.policies.find((entry) => entry.id === 'japan-banei-a-plus');
  noName.a_plus_fields.show_race_name = false;
  let noNameProjection = null;
  try { noNameProjection = buildProjection(noNamePolicy); } catch (error) { fail(`Banei race-name-off fixture failed: ${error.message}`); }
  const noNameDetail = noNameProjection?.meetingDetailsDataset.details.find((entry) => entry.meeting_id === candidate.meeting_id);
  if (!noNameDetail || noNameDetail.effective_public_rank !== 'A+') fail('Banei race-name-off fixture must remain A+.');
  else {
    if (noNameDetail.show_race_name !== false) fail('Banei race-name-off flag differs.');
    if (!noNameDetail.show_distance || !noNameDetail.show_surface || !noNameDetail.show_course) fail('Banei race-name-off fixture disabled unrelated A+ fields.');
    if (noNameDetail.timetable_rows.some((row) => 'race_name' in row)) fail('Banei race_name leaked when field switch is off.');
    if (noNameDetail.timetable_rows.some((row) => row.distance_m !== 200 || row.surface !== 'Dirt' || row.course_label !== 'Banei Straight Course')) {
      fail('Banei race-name-off fixture changed Banei-specific distance/surface/course labels.');
    }
  }
}

const listComponent = readText('src/components/TimetableMeetingList.astro');
for (const phrase of ["const localizedDetailPath", "lang === 'ja' ? `/ja${detailPath}` : detailPath", '{record.detail_path && <a href={localizedDetailPath(record.detail_path)}>{text.detail}</a>}']) {
  if (!listComponent.includes(phrase)) fail(`TimetableMeetingList bilingual detail-link boundary missing ${phrase}.`);
}

const enDetailPage = readText('src/pages/timetable/meetings/[meeting_id].astro');
const jaDetailPage = readText('src/pages/ja/timetable/meetings/[meeting_id].astro');
for (const phrase of ['getPublicTimetableMeetingRows', 'getPublicTimetableMeetingDetail', 'Public-safe race timetable', 'Race name', 'Distance', 'Surface', 'Course', 'Open official source']) {
  if (!enDetailPage.includes(phrase)) fail(`English detail page missing ${phrase}.`);
}
for (const phrase of ['getPublicTimetableMeetingRows', 'getPublicTimetableMeetingDetail', 'lang="ja"', '公開可能なレース時刻表', 'レース名', '距離', '馬場', 'コース', '公式ソースを開く', 'alternatePath={`/timetable/meetings/${meeting.meeting_id}/`}']) {
  if (!jaDetailPage.includes(phrase)) fail(`Japanese detail page missing ${phrase}.`);
}
for (const pageText of [enDetailPage, jaDetailPage]) {
  for (const forbiddenImport of ['data/candidates/', 'data/generated/timetable/canonical/', 'raw_html', 'source_body']) {
    if (pageText.includes(forbiddenImport)) fail(`meeting detail page contains forbidden runtime dependency marker ${forbiddenImport}.`);
  }
}

const docs = readText('docs/calendar/banei-bilingual-public-display-qa.md');
for (const phrase of [
  'separate Banei detail-source Readiness',
  'legacy schedule-source Readiness remains link-only',
  'one meeting per list row',
  'meeting detail page only',
  'Banei Straight Course',
  '200m',
  'A downgrade',
  'race-name-only switch',
  'English and Japanese meeting detail routes',
  'review fixture is not promoted or published',
]) {
  if (!docs.includes(phrase)) fail(`Banei public-display QA contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_BILINGUAL_PUBLIC_DISPLAY_QA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_BILINGUAL_PUBLIC_DISPLAY_QA: pass');
console.log('BANEI_DETAIL_READINESS: A+ / A+');
console.log('LEGACY_SCHEDULE_READINESS: C / link_only');
console.log('VISIBLE_LIST_ROWS: 1');
console.log('A_PLUS_DETAIL_ONLY: pass');
console.log('BANEI_DISTANCE_200M: preserved');
console.log('BANEI_SURFACE_LABEL: Dirt preserved');
console.log('BANEI_COURSE_LABEL: Banei Straight Course preserved');
console.log('A_DOWNGRADE: pass');
console.log('RACE_NAME_ONLY_SWITCH: pass');
console.log('EN_DETAIL_ROUTE: pass');
console.log('JA_DETAIL_ROUTE: pass');
console.log('COMMITTED_PUBLIC_JSON_MODIFIED: false');
