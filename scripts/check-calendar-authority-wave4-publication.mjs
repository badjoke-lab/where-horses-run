import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildPublicProjectionV1,
  reconcilePublicProjectionV1,
} from './timetable/pipeline-v1/public-projection-core.mjs';

const policyData = {
  schema_version: 'publication-display-policies-v0',
  default_policy: {
    id: 'default',
    priority: 0,
    match: {},
    max_public_rank: 'C',
    include_in_public_list: true,
    detail_fields: {
      show_race_name: false,
      show_distance: false,
      show_surface: false,
      show_course: false,
    },
    show_live_label: false,
    show_replay_label: false,
  },
  policies: [{
    id: 'fixture-a-plus',
    priority: 100,
    match: { authority_ids: ['fixture-authority'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    detail_fields: {
      show_race_name: true,
      show_distance: true,
      show_surface: true,
      show_course: true,
    },
    show_live_label: false,
    show_replay_label: false,
  }],
};

const readinessRegistry = {
  schema_version: 'calendar-readiness-registry-v1',
  records: [{
    readiness_id: 'fixture-readiness',
    authority_source_key: 'fixture-country/fixture-authority/fixture-source',
    racecourse_ids: ['fixture-racecourse'],
    coverage_scope: 'authority_wide',
    public_ceiling: 'A',
    readiness: 'prototype_ready',
    automation_mode: 'semi_automatic',
    source_status: 'verified',
    confirmed_fields: {
      meeting_date: true,
      racecourse: true,
      first_race_time: true,
      last_race_time: true,
      per_race_post_times: true,
      race_name: true,
      distance: true,
      surface: false,
      course: true,
    },
  }],
};

const sourceAliases = {
  schema_version: 'timetable-source-aliases-v1',
  aliases: [],
};

const meeting = {
  meeting_id: 'fixture-meeting-2026-09-21',
  country_id: 'fixture-country',
  authority_id: 'fixture-authority',
  racing_system_id: 'fixture-system',
  racecourse_id: 'fixture-racecourse',
  date: '2026-09-21',
  timezone: 'UTC',
  capability_rank: 'A+',
  display_status: 'displayable',
  first_race_time_local: '10:00',
  last_race_time_local: '10:30',
  source_trace: {
    source_id: 'fixture-source',
    source_status: 'verified',
    official_source_url: 'https://example.test/programme',
  },
  freshness: {
    last_checked_date: '2026-09-21',
    generated_at: '2026-09-21T00:00:00Z',
  },
};

const detail = {
  meeting_id: meeting.meeting_id,
  country_id: meeting.country_id,
  authority_id: meeting.authority_id,
  racecourse_id: meeting.racecourse_id,
  date: meeting.date,
  timezone: meeting.timezone,
  capability_rank: 'A+',
  source_trace: meeting.source_trace,
  freshness: meeting.freshness,
  timetable_rows: [
    {
      label: 'Race 1',
      post_time_local: '10:00',
      race_name: 'Opening',
      distance_m: 1200,
      surface: 'Turf',
      course_label: 'Outer',
    },
    {
      label: 'Race 2',
      post_time_local: '10:30',
      race_name: 'Feature',
      distance_m: 1600,
      surface: 'Turf',
      course_label: 'Inner',
    },
  ],
};

const canonicalMeetings = {
  schema_version: 'canonical-timetable-v0',
  generated_at: '2026-09-21T00:00:00Z',
  input_sources: [],
  meetings: [meeting],
};
const canonicalDetails = {
  schema_version: 'canonical-meeting-details-v0',
  generated_at: '2026-09-21T00:00:00Z',
  input_sources: [],
  details: [detail],
};

const full = buildPublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases,
});
assert.equal(full.meetingListDataset.meetings.length, 1);
assert.equal(full.meetingDetailsDataset.details.length, 1);

const publicMeeting = full.meetingListDataset.meetings[0];
const publicDetail = full.meetingDetailsDataset.details[0];
assert.equal(publicMeeting.capability_rank, 'A+');
assert.equal(publicMeeting.max_public_rank, 'A+', 'max public rank must follow verified canonical capability rather than authority ceilings');
assert.equal(publicMeeting.effective_public_rank, 'A+', 'effective public rank must preserve verified capability when public detail structure exists');
assert.equal(publicMeeting.detail_path, `/timetable/meetings/${meeting.meeting_id}/`);

assert.equal(publicDetail.effective_public_rank, 'A+');
assert.equal(publicDetail.show_race_name, true, 'A publication may expose an independently approved rich field');
assert.equal(publicDetail.show_distance, true);
assert.equal(publicDetail.show_surface, false, 'Readiness confirmation must independently deny an unconfirmed field');
assert.equal(publicDetail.show_course, true);
assert.equal(publicDetail.timetable_rows[0].race_name, 'Opening');
assert.equal(publicDetail.timetable_rows[0].distance_m, 1200);
assert.equal('surface' in publicDetail.timetable_rows[0], false);
assert.equal(publicDetail.timetable_rows[0].course_label, 'Outer');

const structureFallback = buildPublicProjectionV1({
  canonicalMeetings: { ...canonicalMeetings, meetings: [{ ...meeting, meeting_id: 'fixture-no-detail-2026-09-21' }] },
  canonicalDetails: { ...canonicalDetails, details: [] },
  policyData,
  readinessRegistry,
  sourceAliases,
});
assert.equal(structureFallback.meetingListDataset.meetings[0].max_public_rank, 'A+');
assert.equal(structureFallback.meetingListDataset.meetings[0].effective_public_rank, 'B+', 'missing public detail structure may lower only to the strongest structurally publishable rank');

assert.equal(
  full.meetingListDataset.publication_snapshot.snapshot_id,
  full.meetingDetailsDataset.publication_snapshot.snapshot_id,
  'list/detail must share one publication snapshot',
);

const reviewedSourceMeeting = {
  ...meeting,
  meeting_id: 'fixture-reviewed-2026-09-21',
  source_trace: {
    ...meeting.source_trace,
    source_id: 'reviewed-public:data/static/fixture-reviewed.json',
  },
};
const reviewedSourceDetail = {
  ...detail,
  meeting_id: reviewedSourceMeeting.meeting_id,
};
const reviewedProjection = buildPublicProjectionV1({
  canonicalMeetings: { ...canonicalMeetings, meetings: [reviewedSourceMeeting] },
  canonicalDetails: { ...canonicalDetails, details: [reviewedSourceDetail] },
  policyData,
  readinessRegistry,
  sourceAliases,
});
assert.equal(reviewedProjection.meetingListDataset.meetings.length, 1, 'reviewed wrapper source must resolve through the underlying authority Readiness record');
assert.equal(reviewedProjection.audit.decisions[0].canonical_source_id, 'fixture-source');
assert.equal(reviewedProjection.audit.decisions[0].source_alias_id, reviewedSourceMeeting.source_trace.source_id);

const unrelatedPublic = {
  meeting_id: 'unrelated-public-meeting',
  country_id: 'other-country',
  authority_id: 'other-authority',
  racecourse_id: 'other-racecourse',
  date: '2026-09-21',
  timezone: 'UTC',
  capability_rank: 'C',
  max_public_rank: 'C',
  effective_public_rank: 'C',
  first_race_time_local: null,
  last_race_time_local: null,
  policy_id: 'existing',
  source_status: 'verified',
  official_source_url: 'https://example.test/other',
  last_checked_date: '2026-09-21',
  detail_path: null,
  show_live_label: false,
  show_replay_label: false,
};
const existingMeetingList = {
  schema_version: 'public-timetable-meeting-list-v0',
  generated_at: '2026-09-20T00:00:00Z',
  meetings: [unrelatedPublic],
};
const existingMeetingDetails = {
  schema_version: 'public-timetable-meeting-details-v0',
  generated_at: '2026-09-20T00:00:00Z',
  details: [],
};

const scoped = reconcilePublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases,
  existingMeetingList,
  existingMeetingDetails,
  scopeMeetingIds: new Set([meeting.meeting_id]),
  generatedAt: '2026-09-21T01:00:00Z',
});
assert.ok(scoped.meetingListDataset.meetings.some((row) => row.meeting_id === unrelatedPublic.meeting_id), 'scoped projection must preserve unrelated public rows');
assert.ok(scoped.meetingListDataset.meetings.some((row) => row.meeting_id === meeting.meeting_id), 'scoped projection must add/update its canonical target');

const excluded = reconcilePublicProjectionV1({
  canonicalMeetings,
  canonicalDetails,
  policyData,
  readinessRegistry,
  sourceAliases,
  existingMeetingList: scoped.meetingListDataset,
  existingMeetingDetails: scoped.meetingDetailsDataset,
  scopeMeetingIds: new Set([meeting.meeting_id]),
  excludedMeetingIds: new Set([meeting.meeting_id]),
  generatedAt: '2026-09-21T02:00:00Z',
});
assert.ok(!excluded.meetingListDataset.meetings.some((row) => row.meeting_id === meeting.meeting_id), 'explicit publication exclusion must remove the target meeting');
assert.ok(!excluded.meetingDetailsDataset.details.some((row) => row.meeting_id === meeting.meeting_id), 'explicit publication exclusion must remove the target detail');
assert.ok(excluded.meetingListDataset.meetings.some((row) => row.meeting_id === unrelatedPublic.meeting_id), 'exclusion must not disturb unrelated public rows');

for (const file of [
  'scripts/timetable/apply-official-rolling-observations.mjs',
  'scripts/timetable/apply-reviewed-calendar-observations.mjs',
  'scripts/timetable/run-japan-zero-based-30d.mjs',
  'scripts/timetable/enforce-reviewed-calendar-exclusions.mjs',
]) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /reconcilePublicProjectionV1/, `${file} must delegate final public output to the shared Wave 4 producer`);
  assert.doesNotMatch(source, /attachPublicationSnapshotV1/, `${file} must not stamp public snapshots independently`);
}

const officialSource = fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs', 'utf8');
assert.doesNotMatch(officialSource, /function makePublicMeeting/, 'official rolling must not retain a competing public meeting producer');
assert.doesNotMatch(officialSource, /function makePublicDetail/, 'official rolling must not retain a competing public detail producer');
assert.doesNotMatch(officialSource, /projectPublicTimetableRows/, 'official rolling must not bypass the shared producer with a local row projection');

const reviewedSource = fs.readFileSync('scripts/timetable/apply-reviewed-calendar-observations.mjs', 'utf8');
assert.doesNotMatch(reviewedSource, /publicNeedsRepair/, 'reviewed supplements must reconcile canonical evidence before shared publication');
assert.doesNotMatch(reviewedSource, /publicDetailFromCanonical/, 'reviewed supplements must not maintain an independent public-detail producer');
assert.match(reviewedSource, /source_id: previous\?\.source_trace\?\.source_id \?\? record\.source_id/, 'reviewed reconciliation must retain the canonical source identity used by publication readiness');

const japanSource = fs.readFileSync('scripts/timetable/run-japan-zero-based-30d.mjs', 'utf8');
assert.match(japanSource, /excludedMeetingIds: excludedPublicIds/, 'Japan must route only explicitly authorized removals into the shared producer');
const japanSafetySource = fs.readFileSync('scripts/timetable/japan-mother-set-safety.mjs', 'utf8');
assert.match(japanSafetySource, /export function canReconcileMeetingAbsence\(\) \{[\s\S]*?return false;/, 'absence compatibility hook must fail closed until explicit negative evidence exists');
assert.doesNotMatch(japanSafetySource, /assessMotherSetCompleteness\(sourceCompletenessRows, required\)\.complete/, 'mother-set completeness must not authorize public removal');

const exclusionSource = fs.readFileSync('scripts/timetable/enforce-reviewed-calendar-exclusions.mjs', 'utf8');
assert.match(exclusionSource, /excludedMeetingIds: excludedIds/, 'reviewed exclusions must feed explicit removals into the shared producer');

const coreSource = fs.readFileSync('scripts/timetable/pipeline-v1/public-projection-core.mjs', 'utf8');
assert.match(coreSource, /policy\.detail_fields/, 'shared producer must use field-level detail_fields policy');
assert.doesNotMatch(coreSource, /policy\.a_plus_fields/, 'deprecated A+-only field policy must not remain in the shared producer');
assert.doesNotMatch(coreSource, /showAPlus/, 'A+ rank must not gate independent rich-field publication');

console.log('CALENDAR_AUTHORITY_WAVE4_PUBLICATION: pass');
console.log('PUBLIC_PRODUCER: shared');
console.log('FIELD_LEVEL_PUBLICATION_AT_A: pass');
console.log('SCOPED_RECONCILIATION: pass');
console.log('EXPLICIT_PUBLIC_EXCLUSION: pass');
