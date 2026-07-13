import crypto from 'node:crypto';
import fs from 'node:fs';
import { buildHkjcDetailReviewedImportPackage } from './timetable/hkjc-detail-reviewed-import-core.mjs';
import { approveHkjcCandidateV1, sha256JsonV1 } from './timetable/hkjc-rank-upgrade-operations-core.mjs';

const fixtures = JSON.parse(fs.readFileSync('data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json', 'utf8'));
const input = structuredClone(fixtures.valid_inputs.find((entry) => entry.id === 'reviewed-public-safe-a-plus')?.input);
if (!input) throw new Error('reviewed A+ fixture missing');
const text = `${JSON.stringify(input, null, 2)}\n`;
const batchId = 'hkjc-rank-upgrade-approval-proof';
const pkg = buildHkjcDetailReviewedImportPackage({
  input,
  inputFileName: 'hkjc-reviewed-a-plus-fixture.json',
  inputSha256: crypto.createHash('sha256').update(text).digest('hex'),
  batchId,
  campaignId: 'hkjc-rank-upgrade-operations',
  jobId: 'hkjc-rank-upgrade-approval-proof-job',
});
const candidate = pkg.normalized_artifacts.candidate;
const manifest = pkg.normalized_artifacts.manifest;
const approved = approveHkjcCandidateV1({
  candidate,
  manifest,
  approval: {
    schema_version: 'calendar-hkjc-detail-promotion-approval-v1',
    batch_id: batchId,
    decision: 'approved',
    reviewer: 'fixture-reviewer',
    reviewed_at: '2026-07-13T04:15:00Z',
    candidate_sha256: sha256JsonV1(candidate),
    manifest_sha256: sha256JsonV1(manifest),
  },
});
if (approved.review.status !== 'approved' || approved.review.promotion_target !== 'canonical-timetable-v0') throw new Error('approved envelope differs');
if (!approved.records.every((record) => record.review_status === 'approved' && record.source.extraction_method === 'reviewed_snapshot')) throw new Error('approved record normalization differs');
console.log('CALENDAR_HKJC_RANK_UPGRADE_APPROVAL_STAGE: pass');
