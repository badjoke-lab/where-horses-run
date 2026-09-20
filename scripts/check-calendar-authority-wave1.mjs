import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  attachPublicationSnapshotV1,
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

assert.equal(
  (canonicalMeetings.meetings ?? []).some((record) =>
    'acquisition_attempt' in record || 'evidence_support' in record || 'evidence_changes' in record),
  false,
  'legacy canonical records must not gain inferred authority metadata',
);
assert.equal(
  (canonicalDetails.details ?? []).some((record) => 'evidence_support' in record || 'evidence_changes' in record),
  false,
  'legacy canonical details must not gain inferred evidence metadata',
);

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
  failed_attempt_retains_stronger_evidence: true,
  publication_snapshot_id: publicMeetings.publication_snapshot.snapshot_id,
}, null, 2));
console.log('CALENDAR_AUTHORITY_WAVE1: pass');
