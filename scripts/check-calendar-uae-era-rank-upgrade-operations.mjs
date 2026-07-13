import fs from 'node:fs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import {
  approveUaeEraCandidateV1,
  buildUaeEraRankUpgradeArtifactsV1,
  buildUaeEraRetryQueueV1,
  buildUaeEraReviewQueueV1,
  sha256UaeJsonV1,
  validateUaeSelectedIdentityV1,
} from './timetable/uae-era-rank-upgrade-core.mjs';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const fixtures = JSON.parse(fs.readFileSync('data/fixtures/calendar-uae-era-rank-upgrade-fixtures-v1.json', 'utf8'));
const canonical = JSON.parse(fs.readFileSync('data/generated/timetable/canonical/meetings.json', 'utf8'));
const canonicalDetails = JSON.parse(fs.readFileSync('data/generated/timetable/canonical/meeting-details.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('data/static/calendar-acquisition-registry.json', 'utf8'));
const compatibility = JSON.parse(fs.readFileSync('data/static/calendar-runner-compatibility-contract-v1.json', 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const job = fixtures.job;
const batchId = 'uae-al-ain-rank-upgrade-proof';
const generatedAt = '2026-07-13T06:10:00Z';
let artifacts = null;
try {
  artifacts = buildUaeEraRankUpgradeArtifactsV1({
    job,
    batchId,
    generatedAt,
    canonicalMeetings: canonical.meetings,
    evidenceByMeetingId: fixtures.evidence_by_meeting_id,
    runnerUsed: 'github_actions',
  });
} catch (error) {
  fail(`artifact build failed: ${error.message}`);
}

if (artifacts) {
  const record = artifacts.candidate.records[0];
  if (artifacts.candidate.records.length !== 1) fail('expected one UAE candidate');
  if (record?.meeting_id !== 'era-al-ain-racecourse-2026-04-10') fail('UAE candidate meeting differs');
  if (record?.capability_rank !== 'A') fail('UAE candidate must be Rank A');
  if (record?.first_race_time_local !== '17:00' || record?.last_race_time_local !== '21:30') fail('UAE candidate time boundary differs');
  if (record?.timetable_rows?.length !== 10) fail('UAE candidate race row count differs');
  if (record?.timetable_rows?.some((row) => Object.keys(row).some((key) => !['label', 'post_time_local'].includes(key)))) fail('UAE public A rows contain extra fields');
  if (artifacts.coverage.coverage_claim !== 'source_window_complete' || artifacts.coverage.source_errors.length !== 0) fail('UAE coverage differs');
  if (artifacts.manifest.rank_counts.A !== 1 || artifacts.manifest.records_discovered !== 1) fail('UAE Manifest rank/count differs');
  if (artifacts.report.network_fetch !== true || artifacts.report.canonical_write !== 'disabled' || artifacts.report.public_write !== 'disabled') fail('UAE report boundary differs');
  const identityErrors = validateUaeSelectedIdentityV1({ job, candidate: artifacts.candidate });
  if (identityErrors.length) fail(`selected identity validation failed: ${identityErrors.join('; ')}`);
}

let retryQueue = null;
let reviewQueue = null;
try {
  retryQueue = buildUaeEraRetryQueueV1({ job, canonicalMeetings: canonical.meetings, generatedAt });
  reviewQueue = buildUaeEraReviewQueueV1({ manifest: artifacts.manifest, generatedAt });
} catch (error) {
  fail(`Queue build failed: ${error.message}`);
}
if (retryQueue) {
  const entry = retryQueue.entries[0];
  if (entry.current_reviewed_rank !== 'C' || entry.collection_target_rank !== 'A') fail('UAE retry rank gap differs');
  if (entry.primary_runner !== 'github_actions' || entry.fallback_runner !== null || entry.retry_scope.mode !== 'selected_meetings') fail('UAE retry route differs');
}
if (reviewQueue) {
  const entry = reviewQueue.entries[0];
  if (entry.review_state !== 'review_ready' || entry.promotion_state !== 'not_ready') fail('UAE Review Queue state differs');
}

const profile = registry.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!profile) fail('UAE Acquisition Registry profile missing');
else {
  if (profile.profile_status !== 'active') fail('UAE profile must be active');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null) fail('UAE runner profile differs');
  if (profile.supports_selected_meetings !== true || profile.supports_rank_upgrade_retry !== true || profile.supports_source_visible_horizon !== true) fail('UAE operational modes differ');
  if (profile.technical_capability_rank !== 'A' || profile.public_ceiling !== 'A') fail('UAE rank/ceiling differs');
}
const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
if (!executor) fail('UAE Actions executor missing');
else {
  if (executor.executor_id !== 'uae-era-actions' || executor.entry_point !== 'scripts/timetable/run-uae-era-actions-job.mjs') fail('UAE Actions executor identity differs');
  if (JSON.stringify(executor.supported_collection_modes) !== JSON.stringify(['source_visible_horizon', 'selected_meetings'])) fail('UAE Actions executor modes differ');
}

const readiness = loadCalendarReadinessV1(process.cwd());
const readinessRecord = readiness.records.find((record) => record.authority_source_key === 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable');
if (!readinessRecord || readinessRecord.technical_rank !== 'A' || readinessRecord.public_ceiling !== 'A') fail('UAE detail Readiness differs');
const source = loadAuthoritySourceInventoryV1(process.cwd()).records.find((record) => record.country_id === 'united-arab-emirates' && record.official_source_id === 'era-racecard-public-timetable');
if (!source || source.capability_rank !== 'A') fail('UAE detail Authority/Source differs');

let approved = null;
if (artifacts) {
  const approval = {
    schema_version: 'calendar-uae-era-promotion-approval-v1',
    batch_id: batchId,
    decision: 'approved',
    reviewer: 'fixture-reviewer',
    reviewed_at: '2026-07-13T06:20:00Z',
    candidate_sha256: sha256UaeJsonV1(artifacts.candidate),
    manifest_sha256: sha256UaeJsonV1(artifacts.manifest),
  };
  try {
    approved = approveUaeEraCandidateV1({ candidate: artifacts.candidate, manifest: artifacts.manifest, approval });
  } catch (error) {
    fail(`UAE approval failed: ${error.message}`);
  }
  const stale = { ...approval, candidate_sha256: '0'.repeat(64) };
  let staleRejected = false;
  try { approveUaeEraCandidateV1({ candidate: artifacts.candidate, manifest: artifacts.manifest, approval: stale }); }
  catch (error) { staleRejected = error.message.includes('candidate SHA-256'); }
  if (!staleRejected) fail('stale UAE approval was not rejected');
}

if (approved) {
  try {
    const promotion = promoteApprovedCandidateV1({
      candidate: approved,
      meetingsDataset: canonical,
      detailsDataset: canonicalDetails,
      authorityInventory: loadAuthoritySourceInventoryV1(process.cwd()),
      readinessRegistry: readiness,
      inputPath: `data/candidates/uae-era-detail-${batchId}-approved.json`,
    });
    const meeting = promotion.meetingsDataset.meetings.find((row) => row.meeting_id === 'era-al-ain-racecourse-2026-04-10');
    const detail = promotion.detailsDataset.details.find((row) => row.meeting_id === 'era-al-ain-racecourse-2026-04-10');
    if (meeting?.capability_rank !== 'A' || meeting.first_race_time_local !== '17:00' || meeting.last_race_time_local !== '21:30') fail('UAE promotion meeting differs');
    if (detail?.timetable_rows?.length !== 10) fail('UAE promotion detail differs');
    if (!promotion.summary.promoted_meeting_ids.includes('era-al-ain-racecourse-2026-04-10')) fail('UAE promotion summary missing meeting');
  } catch (error) {
    fail(`UAE promotion proposal failed: ${error.message}`);
  }
}

const serialized = JSON.stringify({ artifacts, retryQueue, reviewQueue }).toLowerCase();
for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) fail(`forbidden field retained: ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_RANK_UPGRADE_OPERATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_RANK_UPGRADE_OPERATIONS: pass');
console.log('IMPLEMENTATION_UNIT: UAE-DETAIL-RECOVERY-02');
console.log('PROOF: era-al-ain-racecourse-2026-04-10 C -> A');
console.log('TIMETABLE: 10 races / 17:00-21:30');
console.log('RETRY_QUEUE: selected_meetings / github_actions');
console.log('REVIEW_QUEUE: review_ready / promotion_not_ready');
console.log('APPROVAL_BINDING: candidate_sha256 + manifest_sha256');
console.log('CANONICAL_PUBLIC_WRITE: false');
