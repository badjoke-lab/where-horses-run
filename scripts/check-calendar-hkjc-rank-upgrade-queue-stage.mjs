import crypto from 'node:crypto';
import fs from 'node:fs';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { buildHkjcDetailReviewedImportPackage } from './timetable/hkjc-detail-reviewed-import-core.mjs';
import {
  buildHkjcOperatorRetryQueueV1,
  buildHkjcReviewQueueV1,
  validateHkjcOperatorRetryQueueV1,
  validateHkjcRetryResultV1,
} from './timetable/hkjc-rank-upgrade-operations-core.mjs';

const fixtures = JSON.parse(fs.readFileSync('data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json', 'utf8'));
const input = structuredClone(fixtures.valid_inputs.find((entry) => entry.id === 'reviewed-public-safe-a-plus')?.input);
if (!input) throw new Error('reviewed A+ fixture missing');
const meeting = input.meetings[0];
const inputText = `${JSON.stringify(input, null, 2)}\n`;
const pkg = buildHkjcDetailReviewedImportPackage({
  input,
  inputFileName: 'hkjc-reviewed-a-plus-fixture.json',
  inputSha256: crypto.createHash('sha256').update(inputText).digest('hex'),
  batchId: 'hkjc-rank-upgrade-queue-proof',
  campaignId: 'hkjc-rank-upgrade-operations',
  jobId: 'hkjc-rank-upgrade-queue-proof-job',
});
const candidate = pkg.normalized_artifacts.candidate;
const manifest = pkg.normalized_artifacts.manifest;
const canonicalMeetings = [{
  meeting_id: meeting.meeting_id,
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  racecourse_id: meeting.racecourse_id,
  date: meeting.date,
  timezone: 'Asia/Hong_Kong',
  capability_rank: 'C',
}];
const registry = loadCalendarAcquisitionRegistryV1(process.cwd());
const routePolicy = JSON.parse(fs.readFileSync('data/static/calendar-route-runner-policy-v1.json', 'utf8'));
const generatedAt = '2026-07-13T04:00:00Z';
const retryQueue = buildHkjcOperatorRetryQueueV1({
  meetingIds: [meeting.meeting_id],
  generatedAt,
  canonicalMeetings,
  registry,
  routePolicy,
});
const retryErrors = validateHkjcOperatorRetryQueueV1(retryQueue, { canonicalMeetings, registry, routePolicy });
if (retryErrors.length) throw new Error(`Retry Queue validation failed: ${retryErrors.join('; ')}`);
const resultErrors = validateHkjcRetryResultV1({ retryQueue, candidate, manifest });
if (resultErrors.length) throw new Error(`Retry result reconciliation failed: ${resultErrors.join('; ')}`);
const reviewQueue = buildHkjcReviewQueueV1({
  manifest,
  manifestRef: `data/generated/timetable/hkjc-detail-batches/${manifest.batch_id}/collection-result-manifest.json`,
  generatedAt,
});
if (reviewQueue.entries.length !== 1 || reviewQueue.entries[0].review_state !== 'review_ready' || reviewQueue.entries[0].promotion_state !== 'not_ready') {
  throw new Error('Review Queue state differs');
}
console.log('CALENDAR_HKJC_RANK_UPGRADE_QUEUE_STAGE: pass');
console.log(`MEETING_ID: ${meeting.meeting_id}`);
console.log(`RETRY_CURRENT_RANK: ${retryQueue.entries[0].current_reviewed_rank}`);
console.log(`CANDIDATE_RANK: ${candidate.records[0].capability_rank}`);
console.log(`REVIEW_STATE: ${reviewQueue.entries[0].review_state}`);
