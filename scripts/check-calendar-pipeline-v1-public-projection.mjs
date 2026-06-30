import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildPublicProjectionV1, publicProjectionRanksV1 } from './timetable/pipeline-v1/public-projection-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const clone = (value) => structuredClone(value);
const stable = (value) => JSON.stringify(value);
const hash = (file) => createHash('sha256').update(read(file)).digest('hex');
const rankIndex = (rank) => publicProjectionRanksV1.indexOf(rank);

const paths = {
  canonicalMeetings: 'data/generated/timetable/canonical/meetings.json',
  canonicalDetails: 'data/generated/timetable/canonical/meeting-details.json',
  policy: 'src/data/publicationDisplayPolicies.json',
  readiness: 'data/static/calendar-readiness-registry.json',
  aliases: 'data/static/timetable-source-aliases-v1.json',
  authority: 'data/static/authority-source-inventory.json',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json'
};

const canonicalMeetings = parse(paths.canonicalMeetings);
const canonicalDetails = parse(paths.canonicalDetails);
const policyData = parse(paths.policy);
const readinessRegistry = parse(paths.readiness);
const sourceAliases = parse(paths.aliases);
const authorityInventory = parse(paths.authority);
const publicBefore = {
  meetings: hash(paths.publicMeetings),
  details: hash(paths.publicDetails)
};

let first;
try {
  first = buildPublicProjectionV1({
    canonicalMeetings,
    canonicalDetails,
    policyData,
    readinessRegistry,
    sourceAliases
  });
} catch (error) {
  fail(`valid public projection failed: ${error instanceof Error ? error.message : error}`);
}

if (first) {
  try {
    const second = buildPublicProjectionV1({
      canonicalMeetings,
      canonicalDetails,
      policyData,
      readinessRegistry,
      sourceAliases
    });
    if (stable(first) !== stable(second)) fail('public projection is not deterministic');
  } catch (error) {
    fail(`second public projection failed: ${error instanceof Error ? error.message : error}`);
  }

  const expectedGeneratedAt = [canonicalMeetings.generated_at, canonicalDetails.generated_at]
    .sort((left, right) => Date.parse(left) - Date.parse(right))
    .at(-1);
  if (first.meetingListDataset.generated_at !== expectedGeneratedAt) fail('meeting-list generated_at is not derived from canonical inputs');
  if (first.meetingDetailsDataset.generated_at !== expectedGeneratedAt) fail('meeting-details generated_at is not derived from canonical inputs');
  if (first.meetingListDataset.generated_at !== first.meetingDetailsDataset.generated_at) fail('public datasets must share one deterministic generated_at');

  const decisionById = new Map(first.audit.decisions.map((decision) => [decision.meeting_id, decision]));
  const meetingById = new Map(first.meetingListDataset.meetings.map((meeting) => [meeting.meeting_id, meeting]));
  const detailById = new Map(first.meetingDetailsDataset.details.map((detail) => [detail.meeting_id, detail]));

  for (const decision of first.audit.decisions) {
    if (rankIndex(decision.max_public_rank) > rankIndex(decision.readiness_public_ceiling)) {
      fail(`${decision.meeting_id} exceeds Calendar Readiness Public Ceiling`);
    }
    if (rankIndex(decision.effective_public_rank) > rankIndex(decision.max_public_rank)) {
      fail(`${decision.meeting_id} effective rank exceeds maximum public rank`);
    }
  }

  for (const meeting of first.meetingListDataset.meetings) {
    const decision = decisionById.get(meeting.meeting_id);
    if (!decision?.include_in_public_list) fail(`${meeting.meeting_id} is public without an include decision`);
    if (meeting.max_public_rank !== decision.max_public_rank) fail(`${meeting.meeting_id} max_public_rank differs from audit`);
    if (meeting.effective_public_rank !== decision.effective_public_rank) fail(`${meeting.meeting_id} effective_public_rank differs from audit`);
    const hasDetail = detailById.has(meeting.meeting_id);
    if (Boolean(meeting.detail_path) !== hasDetail) fail(`${meeting.meeting_id} detail_path does not match projected detail`);
  }

  for (const detail of first.meetingDetailsDataset.details) {
    const meeting = meetingById.get(detail.meeting_id);
    if (!meeting) fail(`${detail.meeting_id} public detail has no public meeting row`);
    if (!['A', 'A+'].includes(detail.effective_public_rank)) fail(`${detail.meeting_id} detail is below public rank A`);
    for (const row of detail.timetable_rows) {
      const allowed = new Set(['label', 'post_time_local']);
      if (detail.show_race_name) allowed.add('race_name');
      if (detail.show_distance) allowed.add('distance_m');
      if (detail.show_surface) allowed.add('surface');
      if (detail.show_course) allowed.add('course_label');
      for (const key of Object.keys(row)) {
        if (!allowed.has(key)) fail(`${detail.meeting_id} row exposes disallowed field ${key}`);
      }
    }
  }

  const jraId = 'jra-hanshin-racecourse-2026-06-06';
  const jraDecision = decisionById.get(jraId);
  const jraDetail = detailById.get(jraId);
  if (!jraDecision) fail('missing JRA audit decision fixture');
  else {
    if (jraDecision.policy_max_public_rank !== 'A+') fail('JRA policy fixture must remain A+ for ceiling intersection test');
    if (jraDecision.readiness_public_ceiling !== 'A') fail('JRA readiness fixture must cap public output at A');
    if (jraDecision.max_public_rank !== 'A' || jraDecision.effective_public_rank !== 'A') fail('JRA A+ canonical record must project at A');
  }
  if (!jraDetail) fail('JRA A projection must retain timetable detail');
  else if (jraDetail.timetable_rows.some((row) => Object.keys(row).some((key) => !['label', 'post_time_local'].includes(key)))) {
    fail('JRA A projection must strip all A+ programme-summary fields');
  }

  const hkjcId = 'hkjc-happy-valley-racecourse-2026-06-10';
  const hkjcDecision = decisionById.get(hkjcId);
  const hkjcDetail = detailById.get(hkjcId);
  if (!hkjcDecision) fail('missing HKJC audit decision fixture');
  else {
    if (hkjcDecision.canonical_source_id !== 'hkjc-fixture-list') fail('HKJC legacy source alias did not resolve');
    if (hkjcDecision.readiness_public_ceiling !== 'A') fail('HKJC readiness fixture must cap public output at A');
    if (hkjcDecision.effective_public_rank !== 'A') fail('HKJC A+ canonical record must project at A');
  }
  if (!hkjcDetail) fail('HKJC authority-wide projection must retain Happy Valley detail');
  else if (hkjcDetail.timetable_rows.some((row) => Object.keys(row).some((key) => !['label', 'post_time_local'].includes(key)))) {
    fail('HKJC A projection must strip all A+ programme-summary fields');
  }

  const uaeDecision = decisionById.get('era-meydan-racecourse-2026-04-01');
  if (!uaeDecision || uaeDecision.max_public_rank !== 'C' || uaeDecision.effective_public_rank !== 'C') {
    fail('UAE legacy source must project at reviewed C ceiling');
  }

  for (const id of ['banei-obihiro-racecourse-2026-05-30', 'nar-kasamatsu-racecourse-2026-05-30']) {
    const decision = decisionById.get(id);
    if (!decision) fail(`missing legacy link-only decision ${id}`);
    else if (decision.include_in_public_list || !String(decision.exclusion_reason).startsWith('readiness:link_only')) {
      fail(`${id} link-only readiness must be excluded from public meeting rows`);
    }
    if (meetingById.has(id)) fail(`${id} link-only record leaked into public meeting rows`);
  }

  const raisedReadiness = clone(readinessRegistry);
  const hkjcReadiness = raisedReadiness.records.find((record) => record.authority_source_key === 'hong-kong/hkjc/hkjc-fixture-list');
  hkjcReadiness.public_ceiling = 'A+';
  try {
    const raised = buildPublicProjectionV1({ canonicalMeetings, canonicalDetails, policyData, readinessRegistry: raisedReadiness, sourceAliases });
    const raisedDecision = raised.audit.decisions.find((decision) => decision.meeting_id === hkjcId);
    const raisedDetail = raised.meetingDetailsDataset.details.find((detail) => detail.meeting_id === hkjcId);
    if (raisedDecision?.effective_public_rank !== 'A+') fail('raised HKJC ceiling fixture did not reach A+');
    if (!raisedDetail?.show_race_name || !raisedDetail?.show_distance) fail('confirmed HKJC A+ race name and distance were not enabled');
    if (raisedDetail?.show_surface || raisedDetail?.show_course) fail('unconfirmed HKJC surface/course fields were enabled');
    if (raisedDetail?.timetable_rows.some((row) => 'surface' in row || 'course_label' in row)) fail('unconfirmed HKJC A+ fields leaked into rows');
  } catch (error) {
    fail(`raised Public Ceiling fixture failed: ${error instanceof Error ? error.message : error}`);
  }
}

if (sourceAliases.schema_version !== 'timetable-source-aliases-v1') fail('source alias schema version is invalid');
const readinessKeys = new Set(readinessRegistry.records.map((record) => record.authority_source_key));
const authorityKeys = new Set(authorityInventory.records.map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
const aliasKeys = new Set();
for (const alias of sourceAliases.aliases) {
  const legacyKey = `${alias.country_id}/${alias.authority_id}/${alias.legacy_source_id}`;
  const targetKey = `${alias.country_id}/${alias.authority_id}/${alias.canonical_source_id}`;
  if (aliasKeys.has(legacyKey)) fail(`duplicate legacy source alias ${legacyKey}`);
  aliasKeys.add(legacyKey);
  if (!readinessKeys.has(targetKey)) fail(`source alias target lacks readiness record ${targetKey}`);
  if (!authorityKeys.has(targetKey)) fail(`source alias target lacks authority/source record ${targetKey}`);
}

const publicAfter = {
  meetings: hash(paths.publicMeetings),
  details: hash(paths.publicDetails)
};
if (stable(publicBefore) !== stable(publicAfter)) fail('pure projection validation modified committed public JSON');

const core = read('scripts/timetable/pipeline-v1/public-projection-core.mjs');
const writer = read('scripts/timetable/build-public-timetable-view.mjs');
for (const forbidden of ['new Date(', 'Date.now(', 'data/candidates/', 'source_snapshot_path', 'normalized_from_path']) {
  if (core.includes(forbidden)) fail(`projection core contains forbidden dependency or nondeterminism: ${forbidden}`);
}
for (const forbidden of ['data/candidates/', 'hkjc-racecard-source-snapshot.json', 'normalized-timetable.json', 'timetables.json']) {
  if (writer.includes(forbidden)) fail(`projection writer reads non-canonical input: ${forbidden}`);
}
for (const required of ['canonicalMeetings', 'canonicalDetails', 'readinessRegistry', 'sourceAliases', 'PUBLIC_PROJECTION_WRITE_MODE: deterministic-public-only']) {
  if (!writer.includes(required)) fail(`projection writer missing ${required}`);
}

if (errors.length) {
  console.error(`CALENDAR_PIPELINE_V1_PUBLIC_PROJECTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_PIPELINE_V1_PUBLIC_PROJECTION: pass public_meetings=${first.meetingListDataset.meetings.length} public_details=${first.meetingDetailsDataset.details.length}`);
console.log(`DETERMINISTIC_GENERATED_AT: ${first.meetingListDataset.generated_at}`);
console.log('PUBLIC_CEILING_ENFORCED: true');
console.log('COMMITTED_PUBLIC_JSON_MODIFIED: false');
