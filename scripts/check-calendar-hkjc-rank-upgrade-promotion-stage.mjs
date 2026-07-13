import crypto from 'node:crypto';
import fs from 'node:fs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import { buildHkjcDetailReviewedImportPackage } from './timetable/hkjc-detail-reviewed-import-core.mjs';
import {
  approveHkjcCandidateV1,
  sha256JsonV1,
} from './timetable/hkjc-rank-upgrade-operations-core.mjs';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const fixtures = JSON.parse(fs.readFileSync('data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json', 'utf8'));
const input = structuredClone(fixtures.valid_inputs.find((entry) => entry.id === 'reviewed-public-safe-a-plus')?.input);
if (!input) throw new Error('reviewed A+ fixture missing');
const meeting = input.meetings[0];
const inputText = `${JSON.stringify(input, null, 2)}\n`;
const batchId = 'hkjc-rank-upgrade-promotion-proof';
const pkg = buildHkjcDetailReviewedImportPackage({
  input,
  inputFileName: 'hkjc-reviewed-a-plus-fixture.json',
  inputSha256: crypto.createHash('sha256').update(inputText).digest('hex'),
  batchId,
  campaignId: 'hkjc-rank-upgrade-operations',
  jobId: 'hkjc-rank-upgrade-promotion-proof-job',
});
const candidate = pkg.normalized_artifacts.candidate;
const manifest = pkg.normalized_artifacts.manifest;
const approval = {
  schema_version: 'calendar-hkjc-detail-promotion-approval-v1',
  batch_id: batchId,
  decision: 'approved',
  reviewer: 'fixture-reviewer',
  reviewed_at: '2026-07-13T04:15:00Z',
  candidate_sha256: sha256JsonV1(candidate),
  manifest_sha256: sha256JsonV1(manifest),
};
const approvedCandidate = approveHkjcCandidateV1({ candidate, manifest, approval });
const promotion = promoteApprovedCandidateV1({
  candidate: approvedCandidate,
  meetingsDataset: {
    schema_version: 'canonical-timetable-v0',
    generated_at: '2026-07-10T16:00:00Z',
    input_sources: [],
    meetings: [{
      meeting_id: meeting.meeting_id,
      country_id: 'hong-kong',
      authority_id: 'hkjc',
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: 'Asia/Hong_Kong',
      capability_rank: 'C',
      display_status: 'partial',
      first_race_time_local: null,
      last_race_time_local: null,
      source_trace: {
        source_id: 'hkjc-fixture-list',
        route_id: null,
        source_status: 'verified',
        official_source_url: input.source_evidence.official_source_url,
        source_label: 'Hong Kong Jockey Club',
        extraction_method: 'adapter',
        source_snapshot_path: null,
        normalized_from_path: 'data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json'
      },
      freshness: {
        last_checked_date: '2026-07-10',
        generated_at: '2026-07-10T16:00:00Z',
        stale_after_date: null,
        freshness_note: 'Fixture-only canonical C state for promotion proof.'
      },
      notes: 'Fixture-only canonical C state for promotion proof.'
    }],
  },
  detailsDataset: {
    schema_version: 'canonical-meeting-details-v0',
    generated_at: '2026-07-10T16:00:00Z',
    input_sources: [],
    details: [],
  },
  authorityInventory: loadAuthoritySourceInventoryV1(process.cwd()),
  readinessRegistry: loadCalendarReadinessV1(process.cwd()),
  inputPath: `data/candidates/hkjc-detail-${batchId}-approved.json`,
});
const promoted = promotion.meetingsDataset.meetings.find((row) => row.meeting_id === meeting.meeting_id);
const detail = promotion.detailsDataset.details.find((row) => row.meeting_id === meeting.meeting_id);
if (promoted?.capability_rank !== 'A+' || promoted.first_race_time_local !== '18:30' || promoted.last_race_time_local !== '19:00') {
  throw new Error('promoted meeting differs');
}
if (detail?.timetable_rows?.length !== 2) throw new Error('promoted detail rows differ');
if (promotion.summary.promoted_meeting_count !== 1 || promotion.summary.promoted_detail_count !== 1) throw new Error('promotion summary differs');
console.log('CALENDAR_HKJC_RANK_UPGRADE_PROMOTION_STAGE: pass');
console.log(`MEETING_ID: ${meeting.meeting_id}`);
console.log(`TECHNICAL_RANK: ${promoted.capability_rank}`);
console.log('PUBLIC_CEILING: A');
