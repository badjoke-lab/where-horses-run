import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import {
  buildHkjcOperatorRetryQueueV1,
  buildHkjcReviewQueueV1,
  validateHkjcRetryResultV1,
} from './hkjc-rank-upgrade-operations-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const meetingIdsArg = argument('meeting-ids');
const generatedAt = argument('generated-at');
const candidateArg = argument('candidate');
const manifestArg = argument('manifest');
const outputArg = argument('output-dir');

if (!meetingIdsArg || !generatedAt || !candidateArg || !manifestArg || !outputArg) {
  throw new Error('--meeting-ids=<comma-list>, --generated-at=<ISO>, --candidate=<path>, --manifest=<path>, and --output-dir=<path> are required');
}

function externalPath(value, label) {
  const absolute = path.resolve(value);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) throw new Error(`${label} must be outside the repository`);
  return absolute;
}

const meetingIds = meetingIdsArg.split(',').map((value) => value.trim()).filter(Boolean);
const candidatePath = externalPath(candidateArg, 'candidate');
const manifestPath = externalPath(manifestArg, 'manifest');
const outputDir = externalPath(outputArg, 'output-dir');
const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const canonical = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meetings.json'), 'utf8'));
const routePolicy = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-route-runner-policy-v1.json'), 'utf8'));
const registry = loadCalendarAcquisitionRegistryV1(root);

const retryQueue = buildHkjcOperatorRetryQueueV1({
  meetingIds,
  generatedAt,
  canonicalMeetings: canonical.meetings,
  registry,
  routePolicy,
});
const resultErrors = validateHkjcRetryResultV1({ retryQueue, candidate, manifest });
if (resultErrors.length) throw new Error(`HKJC retry result reconciliation failed: ${resultErrors.join('; ')}`);
const manifestRef = `data/generated/timetable/hkjc-detail-batches/${manifest.batch_id}/collection-result-manifest.json`;
const reviewQueue = buildHkjcReviewQueueV1({ manifest, manifestRef, generatedAt });

fs.mkdirSync(outputDir, { recursive: true });
const files = {
  'rank-aware-retry-queue.json': retryQueue,
  'review-queue.json': reviewQueue,
  'candidates.json': candidate,
  'collection-result-manifest.json': manifest,
};
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-rank-upgrade-review-summary-v1',
  work_id: 'WHR-CAL-HKJC-DETAIL-RECOVERY',
  implementation_unit: 'HKJC-DETAIL-RECOVERY-02',
  batch_id: manifest.batch_id,
  selected_meeting_ids: meetingIds,
  retry_entry_count: retryQueue.entries.length,
  review_queue_entry_count: reviewQueue.entries.length,
  rank_counts: manifest.rank_counts,
  coverage_claim: manifest.coverage_claim,
  manifest_ref: manifestRef,
  candidate_review_state: candidate.review.status,
  promotion_state: reviewQueue.entries[0].promotion_state,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
