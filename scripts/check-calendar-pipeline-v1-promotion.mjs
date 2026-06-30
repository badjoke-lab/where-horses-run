import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { promoteApprovedCandidateV1, promotionTargetV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const clone = (value) => structuredClone(value);
const stable = (value) => JSON.stringify(value);
const hash = (file) => createHash('sha256').update(read(file)).digest('hex');

function expectThrow(label, action, marker) {
  try {
    action();
    fail(`${label} did not throw`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(marker)) fail(`${label} threw unexpected error: ${message}`);
  }
}

const sample = parse('data/candidates/pipeline-v1.sample.json');
const authorityInventory = parse('data/static/authority-source-inventory.json');
const readinessRegistry = parse('data/static/calendar-readiness-registry.json');
const publicPaths = [
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json'
];
const publicBefore = Object.fromEntries(publicPaths.map((file) => [file, hash(file)]));
const emptyMeetings = {
  schema_version: 'canonical-timetable-v0',
  generated_at: '2026-06-01T00:00:00.000Z',
  input_sources: [],
  meetings: []
};
const emptyDetails = {
  schema_version: 'canonical-meeting-details-v0',
  generated_at: '2026-06-01T00:00:00.000Z',
  input_sources: [],
  details: []
};

const approved = clone(sample);
approved.review = {
  status: 'approved',
  reviewed_at: '2026-07-01T01:00:00.000Z',
  reviewer: 'pipeline-v1-test-reviewer',
  summary: 'Approved contract fixture for canonical promotion validation.',
  promotion_target: promotionTargetV1
};
approved.records = approved.records.map((record) => ({ ...record, review_status: 'approved' }));

const baseArgs = {
  candidate: approved,
  meetingsDataset: emptyMeetings,
  detailsDataset: emptyDetails,
  authorityInventory,
  readinessRegistry,
  inputPath: 'data/candidates/pipeline-v1.sample.json'
};

let first;
try {
  first = promoteApprovedCandidateV1(baseArgs);
} catch (error) {
  fail(`valid approved candidate failed: ${error instanceof Error ? error.message : error}`);
}

if (first) {
  if (first.meetingsDataset.meetings.length !== 1) fail('valid promotion must create one canonical meeting');
  if (first.detailsDataset.details.length !== 1) fail('valid A+ promotion must create one canonical detail');
  if (first.summary.public_projection_written !== false) fail('promotion summary must state public projection was not written');
  if (first.meetingsDataset.generated_at !== approved.review.reviewed_at) fail('canonical generated_at must equal reviewed_at');
  if (!first.meetingsDataset.input_sources.includes(baseArgs.inputPath)) fail('canonical input_sources must include candidate path');
  const meeting = first.meetingsDataset.meetings[0];
  if (meeting.source_trace.extraction_method !== 'normalizer') fail('fixture_parser must map to canonical normalizer provenance');
  if (meeting.source_trace.source_id !== 'hkjc-fixture-list') fail('canonical source identity must be retained');
  if (meeting.display_status !== 'displayable') fail('A/A+ meeting must be displayable in canonical data');
  const detail = first.detailsDataset.details[0];
  if (detail.timetable_rows.some((row) => row.surface !== null || row.course_label !== null)) fail('unconfirmed HKJC surface/course fields must remain null');

  try {
    const second = promoteApprovedCandidateV1({
      ...baseArgs,
      meetingsDataset: first.meetingsDataset,
      detailsDataset: first.detailsDataset
    });
    if (stable(second.meetingsDataset) !== stable(first.meetingsDataset)) fail('promotion is not idempotent for canonical meetings');
    if (stable(second.detailsDataset) !== stable(first.detailsDataset)) fail('promotion is not idempotent for canonical details');
  } catch (error) {
    fail(`second idempotent promotion failed: ${error instanceof Error ? error.message : error}`);
  }

  const lowerRank = clone(approved);
  lowerRank.generated_at = '2026-07-01T01:30:00.000Z';
  lowerRank.review.reviewed_at = '2026-07-01T02:00:00.000Z';
  lowerRank.records[0].capability_rank = 'B';
  lowerRank.records[0].first_race_time_local = '12:45';
  lowerRank.records[0].last_race_time_local = null;
  lowerRank.records[0].timetable_rows = [];
  try {
    const lowered = promoteApprovedCandidateV1({
      ...baseArgs,
      candidate: lowerRank,
      meetingsDataset: first.meetingsDataset,
      detailsDataset: first.detailsDataset
    });
    if (lowered.detailsDataset.details.length !== 0) fail('lower-rank promotion must remove stale A/A+ canonical detail');
    if (!lowered.summary.removed_detail_ids.includes(lowerRank.records[0].meeting_id)) fail('removed detail must be reported');
  } catch (error) {
    fail(`reviewed lower-rank promotion failed: ${error instanceof Error ? error.message : error}`);
  }
}

expectThrow('needs-review envelope', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: sample }), 'not approved');

const falseApproval = clone(approved);
falseApproval.review.reviewer = null;
expectThrow('false approval metadata', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: falseApproval }), 'requires reviewer');

const wrongTarget = clone(approved);
wrongTarget.review.promotion_target = 'public-timetable-v1';
expectThrow('wrong promotion target', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: wrongTarget }), 'promotion_target');

const partialApproval = clone(approved);
partialApproval.records[0].review_status = 'needs_review';
expectThrow('mixed review state', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: partialApproval }), 'approved records only');

const wrongSystem = clone(approved);
wrongSystem.records[0].racing_system_id = 'invented-system';
expectThrow('wrong racing system', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: wrongSystem }), 'racing_system_id differs');

const wrongRacecourse = clone(approved);
wrongRacecourse.records[0].racecourse_id = 'happy-valley-racecourse';
wrongRacecourse.records[0].meeting_id = 'hkjc-happy-valley-racecourse-2026-06-07';
expectThrow('outside readiness racecourse scope', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: wrongRacecourse }), 'outside reviewed readiness scope');

const unconfirmedField = clone(approved);
unconfirmedField.records[0].timetable_rows[0].surface = 'Turf';
expectThrow('unconfirmed programme field', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: unconfirmedField }), 'unconfirmed surface');

const wrongHost = clone(approved);
wrongHost.records[0].source.official_url = 'https://example.com/racecard';
expectThrow('wrong official host', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: wrongHost }), 'hostname differs');

const staleSource = clone(approved);
staleSource.records[0].source.checked_at = '2026-06-01T00:00:00.000Z';
expectThrow('source check older than reviewed registry', () => promoteApprovedCandidateV1({ ...baseArgs, candidate: staleSource }), 'predates reviewed source records');

const limitedAuthority = clone(authorityInventory);
const limitedReadiness = clone(readinessRegistry);
limitedAuthority.records.find((record) => record.official_source_id === 'hkjc-fixture-list').capability_rank = 'A';
limitedReadiness.records.find((record) => record.authority_source_key === 'hong-kong/hkjc/hkjc-fixture-list').technical_rank = 'A';
expectThrow('candidate rank above technical rank', () => promoteApprovedCandidateV1({
  ...baseArgs,
  authorityInventory: limitedAuthority,
  readinessRegistry: limitedReadiness
}), 'exceeds reviewed maximum');

const blockedReadiness = clone(readinessRegistry);
const blockedRecord = blockedReadiness.records.find((record) => record.authority_source_key === 'hong-kong/hkjc/hkjc-fixture-list');
blockedRecord.readiness = 'blocked';
blockedRecord.automation_mode = 'blocked';
expectThrow('blocked readiness', () => promoteApprovedCandidateV1({ ...baseArgs, readinessRegistry: blockedReadiness }), 'does not permit canonical promotion');

const identityCollisionMeetings = clone(emptyMeetings);
identityCollisionMeetings.meetings.push({
  meeting_id: approved.records[0].meeting_id,
  country_id: 'japan',
  authority_id: 'jra',
  racecourse_id: 'tokyo-racecourse',
  date: approved.records[0].date,
  timezone: 'Asia/Tokyo',
  capability_rank: 'C',
  display_status: 'partial',
  first_race_time_local: null,
  last_race_time_local: null,
  source_trace: {},
  freshness: {}
});
expectThrow('meeting identity collision', () => promoteApprovedCandidateV1({ ...baseArgs, meetingsDataset: identityCollisionMeetings }), 'identity collision');

const publicAfter = Object.fromEntries(publicPaths.map((file) => [file, hash(file)]));
if (stable(publicBefore) !== stable(publicAfter)) fail('promotion validation modified public projection files');

const cli = read('scripts/timetable/promote-approved-candidate-v1.mjs');
const core = read('scripts/timetable/pipeline-v1/promotion-core.mjs');
if (cli.includes('data/generated/timetable/public/')) fail('promotion CLI must not reference public projection output paths');
if (core.includes('writeFileSync') || core.includes('renameSync')) fail('promotion core must remain pure and perform no file writes');
for (const marker of ['canonicalMeetingsPath', 'canonicalDetailsPath', 'PUBLIC_PROJECTION_WRITTEN: false']) {
  if (!cli.includes(marker)) fail(`promotion CLI missing ${marker}`);
}

if (errors.length) {
  console.error(`CALENDAR_PIPELINE_V1_PROMOTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_PIPELINE_V1_PROMOTION: pass');
console.log('PROMOTION_TARGET: canonical-timetable-v0');
console.log('IDEMPOTENT: true');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
