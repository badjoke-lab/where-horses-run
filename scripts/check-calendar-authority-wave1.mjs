import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  attachPublicationSnapshotV1,
  mergeEvidenceSupportV1,
  validateCalendarAuthorityMetadataV1,
  validatePublicationSnapshotPairV1,
} from './timetable/calendar-authority-metadata.mjs';

const root = process.cwd();
const paths = {
  canonicalMeetings: 'data/generated/timetable/canonical/meetings.json',
  canonicalDetails: 'data/generated/timetable/canonical/meeting-details.json',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json',
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function authorityMetadata(record) {
  return Object.fromEntries(
    ['acquisition_attempt', 'acquisition_completion', 'evidence_support', 'evidence_changes']
      .filter((key) => key in record)
      .map((key) => [key, record[key]]),
  );
}

function withoutPublicationSnapshot(dataset) {
  const copy = structuredClone(dataset);
  delete copy.publication_snapshot;
  return copy;
}

const canonicalMeetings = readJson(paths.canonicalMeetings);
const canonicalDetails = readJson(paths.canonicalDetails);
const publicMeetings = readJson(paths.publicMeetings);
const publicDetails = readJson(paths.publicDetails);

assert.equal(canonicalMeetings.schema_version, 'canonical-timetable-v0');
assert.equal(canonicalDetails.schema_version, 'canonical-meeting-details-v0');
assert.equal(publicMeetings.schema_version, 'public-timetable-meeting-list-v0');
assert.equal(publicDetails.schema_version, 'public-timetable-meeting-details-v0');

for (const record of canonicalMeetings.meetings ?? []) {
  assert.deepEqual(validateCalendarAuthorityMetadataV1(authorityMetadata(record), record.meeting_id), []);
}
for (const record of canonicalDetails.details ?? []) {
  assert.deepEqual(validateCalendarAuthorityMetadataV1(authorityMetadata(record), record.meeting_id), []);
}

const legacyRecord = {
  meeting_id: 'legacy-racecourse-2026-09-20',
  source_trace: { source_id: 'legacy-source' },
  freshness: { last_checked_date: '2026-09-19', generated_at: '2026-09-19T00:00:00Z' },
};
const legacyBeforeValidation = structuredClone(legacyRecord);
assert.deepEqual(validateCalendarAuthorityMetadataV1(authorityMetadata(legacyRecord), legacyRecord.meeting_id), []);
assert.deepEqual(legacyRecord, legacyBeforeValidation, 'validating a legacy record must not manufacture authority metadata');
assert.deepEqual(authorityMetadata(legacyRecord), {}, 'missing legacy authority metadata must remain unknown');

const verifiedAt = '2026-09-18T10:00:00Z';
const strongerEvidenceWithFailedAttempt = {
  acquisition_attempt: {
    attempted_at: '2026-09-20T10:00:00Z',
    status: 'network_error',
    source_id: 'official-detail-source',
    route_id: 'detail-route',
    error_code: 'fetch_failed',
  },
  acquisition_completion: {
    disposition: 'retry_required',
    observed_rank: 'A+',
    technical_capability_rank: 'A+',
    higher_rank_open: true,
    reason: 'The current attempt failed; previously accepted evidence remains valid.',
  },
  evidence_support: {
    timetable: {
      source_id: 'official-detail-source',
      official_source_url: 'https://example.test/programme',
      observed_at: verifiedAt,
      successfully_verified_at: verifiedAt,
      acquisition_method: 'automatic',
    },
    race_names: {
      source_id: 'official-detail-source',
      official_source_url: 'https://example.test/programme',
      observed_at: verifiedAt,
      successfully_verified_at: verifiedAt,
      acquisition_method: 'automatic',
    },
  },
};
assert.deepEqual(validateCalendarAuthorityMetadataV1(strongerEvidenceWithFailedAttempt), []);
assert.equal(strongerEvidenceWithFailedAttempt.acquisition_completion.observed_rank, 'A+');
assert.equal(strongerEvidenceWithFailedAttempt.evidence_support.timetable.successfully_verified_at, verifiedAt);
assert.notEqual(
  strongerEvidenceWithFailedAttempt.evidence_support.timetable.successfully_verified_at,
  strongerEvidenceWithFailedAttempt.acquisition_attempt.attempted_at,
  'a failed attempt must not advance successful verification time',
);

const provenance = (sourceId, verifiedAtValue = verifiedAt) => ({
  source_id: sourceId,
  official_source_url: `https://example.test/${sourceId}`,
  observed_at: verifiedAtValue,
  successfully_verified_at: verifiedAtValue,
  acquisition_method: 'automatic',
});
const originalEvidenceSupport = {
  timetable: provenance('row-set-source'),
  race_times: provenance('time-source'),
  distances: provenance('original-distance-source'),
  race_overrides: {
    'Race 2': {
      race_names: provenance('race-2-name-source'),
      distances: provenance('race-2-distance-correction'),
    },
    'Race 3': {
      surfaces: provenance('race-3-surface-source'),
    },
  },
};
assert.deepEqual(validateCalendarAuthorityMetadataV1({ evidence_support: originalEvidenceSupport }), []);
assert.notDeepEqual(originalEvidenceSupport.timetable, originalEvidenceSupport.race_times, 'timetable and race_times provenance must be independently representable');
const mergedEvidenceSupport = mergeEvidenceSupportV1(originalEvidenceSupport, {
  race_overrides: {
    'Race 2': {
      distances: provenance('newer-race-2-distance-correction', '2026-09-20T12:00:00Z'),
      courses: provenance('race-2-course-source'),
    },
  },
});
assert.deepEqual(mergedEvidenceSupport.distances, originalEvidenceSupport.distances, 'a race override must not replace the group default');
assert.deepEqual(mergedEvidenceSupport.race_overrides['Race 2'].race_names, originalEvidenceSupport.race_overrides['Race 2'].race_names, 'updating one group must preserve other groups for the same race');
assert.deepEqual(mergedEvidenceSupport.race_overrides['Race 3'], originalEvidenceSupport.race_overrides['Race 3'], 'updating one race must preserve other race overrides');
assert.equal(mergedEvidenceSupport.race_overrides['Race 2'].distances.source_id, 'newer-race-2-distance-correction');
assert.equal(mergedEvidenceSupport.race_overrides['Race 2'].courses.source_id, 'race-2-course-source');
assert.deepEqual(validateCalendarAuthorityMetadataV1({ evidence_support: {
  race_overrides: { 'Race 4': { race_times: provenance('race-4-time-source') } },
} }), [], 'a race override must be valid without a group default');
assert.ok(validateCalendarAuthorityMetadataV1({ evidence_support: {
  race_overrides: { 'Race 2': { timetable: provenance('invalid-race-timetable-source') } },
} }).some((error) => error.includes('unsupported field timetable')), 'timetable must remain a meeting-detail row-set group');

assert.ok(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: { attempted_at: '2026-09-20', status: 'network_error' },
}).some((error) => error.includes('ISO date-time')), 'date-only acquisition timestamps must fail');
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: { attempted_at: '2026-09-20T10:00:00.123Z', status: 'success' },
}), []);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: { attempted_at: '2026-09-20T10:00:00+09:00', status: 'success' },
}), []);
assert.ok(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: { attempted_at: '2026-02-30T10:00:00Z', status: 'success' },
}).some((error) => error.includes('ISO date-time')), 'impossible acquisition timestamps must fail');

const reviewedCorrection = {
  evidence_changes: [{
    target: { meeting_id: 'example-racecourse-2026-09-20', scope: 'field', field: 'race_time', race_label: 'Race 2' },
    action: 'correct',
    reason_type: 'reviewed_correction',
    reason: 'Reviewed official notice corrects the previously accepted post time.',
    evidence: {
      source_id: 'official-correction-notice',
      official_source_url: 'https://example.test/correction',
      observed_at: '2026-09-20T11:00:00Z',
      successfully_verified_at: '2026-09-20T11:05:00Z',
      acquisition_method: 'reviewed',
      review: {
        reviewed_at: '2026-09-20T11:10:00Z',
        reviewer: 'calendar-operator',
        evidence_reference: 'data/reviews/example.json',
      },
    },
  }],
};
assert.deepEqual(validateCalendarAuthorityMetadataV1(reviewedCorrection), []);
const missingReview = structuredClone(reviewedCorrection);
delete missingReview.evidence_changes[0].evidence.review;
assert.ok(validateCalendarAuthorityMetadataV1(missingReview).some((error) => error.includes('review is required')));

function runRetainedAttemptFixture(detailStatus, includeAttempt = true) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), `whr-wave1-${detailStatus}-`));
  try {
    const meetingId = `hkjc-retained-${detailStatus}-2026-09-20`;
    const files = Object.fromEntries(['artifact', 'canonical', 'details', 'public', 'public-details', 'policies']
      .map((name) => [name, path.join(temp, `${name}.json`)]));
    const oldVerifiedAt = '2026-09-19T08:00:00Z';
    const oldEvidenceSupport = {
      timetable: provenance('retained-programme', oldVerifiedAt),
      race_times: provenance('retained-programme', oldVerifiedAt),
      race_names: provenance('retained-programme', oldVerifiedAt),
      distances: provenance('retained-programme', oldVerifiedAt),
      surfaces: provenance('retained-programme', oldVerifiedAt),
      courses: provenance('retained-programme', oldVerifiedAt),
    };
    const oldMeeting = {
      meeting_id: meetingId,
      country_id: 'hong-kong',
      authority_id: 'hkjc',
      racing_system_id: 'hong-kong-hkjc-system',
      racecourse_id: 'sha-tin-racecourse',
      date: '2026-09-20',
      timezone: 'Asia/Hong_Kong',
      capability_rank: 'A+',
      display_status: 'displayable',
      first_race_time_local: '12:00',
      last_race_time_local: '13:00',
      source_trace: { source_id: 'retained-programme', source_status: 'verified', official_source_url: 'https://example.test/retained-programme' },
      freshness: { last_checked_date: '2026-09-19', generated_at: oldVerifiedAt },
      evidence_support: oldEvidenceSupport,
    };
    const oldDetail = {
      meeting_id: meetingId,
      country_id: oldMeeting.country_id,
      authority_id: oldMeeting.authority_id,
      racecourse_id: oldMeeting.racecourse_id,
      date: oldMeeting.date,
      timezone: oldMeeting.timezone,
      capability_rank: 'A+',
      source_trace: oldMeeting.source_trace,
      freshness: oldMeeting.freshness,
      evidence_support: oldEvidenceSupport,
      timetable_rows: [
        { label: 'Race 1', post_time_local: '12:00', race_name: 'One', distance_m: 1200, surface: 'turf', course_label: 'A' },
        { label: 'Race 2', post_time_local: '13:00', race_name: 'Two', distance_m: 1400, surface: 'turf', course_label: 'A' },
      ],
    };
    const incomingRows = detailStatus === 'conflict'
      ? [{ label: 'Race 1', post_time_local: '12:05' }, { label: 'Race 2', post_time_local: '13:05' }]
      : [];
    const currentAttempt = {
      attempted_at: '2026-09-20T10:00:00Z',
      status: 'network_error',
      source_id: 'current-detail-source',
      route_id: 'current-detail-route',
      error_code: 'fetch_failed',
    };
    const incoming = {
      meeting_id: meetingId,
      country_id: oldMeeting.country_id,
      authority_id: oldMeeting.authority_id,
      racing_system_id: oldMeeting.racing_system_id,
      racecourse_id: oldMeeting.racecourse_id,
      date: oldMeeting.date,
      timezone: oldMeeting.timezone,
      capability_rank: detailStatus === 'conflict' ? 'A' : 'C',
      first_race_time_local: incomingRows[0]?.post_time_local ?? null,
      last_race_time_local: incomingRows.at(-1)?.post_time_local ?? null,
      timetable_rows: incomingRows,
      official_source_url: 'https://example.test/current-detail-source',
      ...(includeAttempt ? { acquisition_attempt: currentAttempt } : {}),
      detail_observation: { status: detailStatus, conflicts: detailStatus === 'conflict' ? ['post_time_local'] : [] },
    };
    fs.writeFileSync(files.artifact, JSON.stringify({ generated_at: currentAttempt.attempted_at, records: [incoming] }));
    fs.writeFileSync(files.canonical, JSON.stringify({ schema_version: 'canonical-timetable-v0', generated_at: oldVerifiedAt, meetings: [oldMeeting] }));
    fs.writeFileSync(files.details, JSON.stringify({ schema_version: 'canonical-meeting-details-v0', generated_at: oldVerifiedAt, details: [oldDetail] }));
    fs.writeFileSync(files.public, JSON.stringify({ schema_version: 'public-timetable-meeting-list-v0', generated_at: oldVerifiedAt, meetings: [] }));
    fs.writeFileSync(files['public-details'], JSON.stringify({ schema_version: 'public-timetable-meeting-details-v0', generated_at: oldVerifiedAt, details: [] }));
    fs.writeFileSync(files.policies, JSON.stringify({ policies: [], default_policy: { id: 'test', max_public_rank: 'A+', detail_fields: {} } }));
    const result = spawnSync(process.execPath, [
      'scripts/timetable/apply-official-rolling-observations.mjs',
      `--artifact=${files.artifact}`,
      `--canonical=${files.canonical}`,
      `--canonical-details=${files.details}`,
      `--public=${files.public}`,
      `--public-details=${files['public-details']}`,
      `--policies=${files.policies}`,
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const retainedMeeting = JSON.parse(fs.readFileSync(files.canonical, 'utf8')).meetings[0];
    const retainedDetail = JSON.parse(fs.readFileSync(files.details, 'utf8')).details[0];
    assert.equal(retainedMeeting.capability_rank, 'A+');
    if (includeAttempt) assert.deepEqual(retainedMeeting.acquisition_attempt, currentAttempt);
    else assert.equal('acquisition_attempt' in retainedMeeting, false, 'a protected path must not synthesize an absent acquisition attempt');
    assert.equal(retainedMeeting.acquisition_completion.disposition, 'retry_required');
    assert.deepEqual(retainedMeeting.evidence_support, oldEvidenceSupport);
    assert.deepEqual(retainedDetail, oldDetail);
    assert.equal(retainedMeeting.evidence_support.timetable.successfully_verified_at, oldVerifiedAt);
    const summary = JSON.parse(result.stdout.trim());
    assert.equal(summary.outcomes[detailStatus === 'conflict' ? 'ignored' : 'protected_higher_rank'], 1);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

runRetainedAttemptFixture('source_error');
runRetainedAttemptFixture('conflict');
runRetainedAttemptFixture('source_error', false);

assert.deepEqual(validatePublicationSnapshotPairV1(publicMeetings, publicDetails), []);
const tamperedPublicDetails = structuredClone(publicDetails);
tamperedPublicDetails.details[0].date = '2099-01-01';
assert.ok(validatePublicationSnapshotPairV1(publicMeetings, tamperedPublicDetails).some((error) => error.includes('does not match')));

const legacyList = withoutPublicationSnapshot(publicMeetings);
const legacyDetails = withoutPublicationSnapshot(publicDetails);
const stamped = attachPublicationSnapshotV1(legacyList, legacyDetails, legacyList.generated_at);
assert.deepEqual(withoutPublicationSnapshot(stamped.meetingListDataset), legacyList);
assert.deepEqual(withoutPublicationSnapshot(stamped.meetingDetailsDataset), legacyDetails);
assert.deepEqual(validatePublicationSnapshotPairV1(stamped.meetingListDataset, stamped.meetingDetailsDataset), []);

const schema = readJson('data/static/calendar-authority-metadata-v1.schema.json');
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.$defs?.publicationSnapshot?.properties?.schema_version?.const, 'calendar-publication-snapshot-v1');
assert.deepEqual(
  schema.$defs?.acquisitionCompletion?.properties?.disposition?.enum,
  ['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable'],
);

console.log(JSON.stringify({
  schema_version: 'calendar-authority-wave1-validation-v1',
  canonical_meeting_count: canonicalMeetings.meetings.length,
  canonical_detail_count: canonicalDetails.details.length,
  public_meeting_count: publicMeetings.meetings.length,
  public_detail_count: publicDetails.details.length,
  current_records_parse: true,
  snapshot_addition_preserves_public_values: true,
  legacy_unknowns_remain_unknown: true,
  legitimate_authority_metadata_allowed: true,
  race_override_merge_preserves_unrelated_provenance: true,
  protected_attempt_paths_checked: 3,
  strict_rfc3339_dates: true,
  failed_attempt_retains_stronger_evidence: true,
  publication_snapshot_id: publicMeetings.publication_snapshot.snapshot_id,
}, null, 2));
console.log('CALENDAR_AUTHORITY_WAVE1: pass');
