import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildCandidateDiff, renderCandidateDiffHtml } from './timetable/candidate-diff-page.mjs';
import { buildScheduledCandidateRunLog } from './timetable/scheduled-candidate-run-log.mjs';
import { validateHumanReviewDecision } from './timetable/human-review-decision.mjs';

const SOURCE_DIR = 'artifacts/review-source/123456789';
const OUTPUT_DIR = 'artifacts/m5-human-review';
const SOURCE_RUN_ID = '123456789';
const SOURCE_HEAD_SHA = 'a'.repeat(40);
const ARTIFACT_NAME = `m5-tjk-scheduled-dry-run-${SOURCE_RUN_ID}-1`;
const RUN_AT = '2026-08-16T06:35:11Z';
const CANDIDATE_PATH = `artifacts/m5-scheduled/turkey/${SOURCE_RUN_ID}-1/candidate.json`;

function jsonBytes(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function runDecision({ decision = 'approve', expectedSha, reviewer = 'human-reviewer', reasonCode = 'official-source-reviewed', output = `${OUTPUT_DIR}/${decision}.json` } = {}) {
  return spawnSync(process.execPath, [
    'scripts/create-m5-human-review-decision.mjs',
    '--source-dir', SOURCE_DIR,
    '--source-run-id', SOURCE_RUN_ID,
    '--source-workflow-name', 'Calendar TJK current/future candidates',
    '--source-head-sha', SOURCE_HEAD_SHA,
    '--source-head-branch', 'main',
    '--source-event', 'schedule',
    '--source-artifact-name', ARTIFACT_NAME,
    '--reviewer', reviewer,
    '--decision', decision,
    '--reason-code', reasonCode,
    '--reviewed-at', '2026-08-16T07:00:00Z',
    '--expected-candidate-sha256', expectedSha,
    '--output', output,
  ], { encoding: 'utf8' });
}

fs.rmSync('artifacts/review-source', { recursive: true, force: true });
fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(SOURCE_DIR, { recursive: true });

try {
  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: RUN_AT,
    adapter_id: 'tjk-scheduled-current-future-rank-c-v1',
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    source_id: 'tjk-daily-programme',
    technical_capability_rank: 'A+',
    candidate_rank: 'C',
    publication_ceiling: 'C',
    candidate_window: { start_date: '2026-08-16', end_date_exclusive: '2026-08-17', timezone: 'Europe/Istanbul' },
    records: [{
      candidate_id: 'candidate-tjk-source-venue-5-2026-08-16',
      meeting_id: 'tjk-source-venue-5-2026-08-16',
      country_id: 'turkey',
      authority_id: 'turkiye-jokey-kulubu',
      racing_system_id: 'tjk-national-racing-system',
      source_venue_id: '5',
      source_venue_label: 'Ankara',
      public_racecourse_identity_status: 'unregistered-not-authorized-by-scheduled-discovery',
      date: '2026-08-16',
      timezone: 'Europe/Istanbul',
      candidate_rank: 'C',
      technical_capability_rank: 'A+',
      publication_ceiling: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: 'tjk-daily-programme',
        official_url: 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=16%2F08%2F2026&SehirAdi=Ankara&SehirId=5',
        discovered_from: 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami',
        discovery_method: 'official-page-discovered-link',
        checked_at: RUN_AT,
        extraction_method: 'official_page_discovered_venue_identity_only',
      },
      confidence: 'high',
      review_status: 'pending',
      notes: 'Review-only contract fixture.',
    }],
    review: {
      status: 'pending',
      reviewed_at: null,
      reviewer: null,
      summary: 'Human review required.',
      promotion_target: 'separate-human-reviewed-promotion-unit',
    },
    publication_effect: 'none',
  };

  const candidateContent = jsonBytes(candidate);
  const candidateSha = sha256(candidateContent);
  fs.writeFileSync(path.resolve(`${SOURCE_DIR}/candidate.json`), candidateContent);

  const runLog = buildScheduledCandidateRunLog({
    country_id: candidate.country_id,
    authority_id: candidate.authority_id,
    source_id: candidate.source_id,
    adapter_id: candidate.adapter_id,
    adapter_version: SOURCE_HEAD_SHA,
    run_mode: 'dry_run',
    window_start: '2026-08-16',
    window_end: '2026-08-16',
    timezone: 'Europe/Istanbul',
    run_at: RUN_AT,
    source_reference: 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami',
    eligibility: 'eligible',
    status: 'success_candidate_generated',
    run_id: SOURCE_RUN_ID,
    attempt: 1,
    started_at: RUN_AT,
    completed_at: '2026-08-16T06:35:13Z',
    candidate_count: 1,
    candidate_artifact_path: CANDIDATE_PATH,
    candidate_sha256: candidateSha,
  });
  fs.writeFileSync(path.resolve(`${SOURCE_DIR}/run-log.json`), jsonBytes(runLog));

  const baseline = JSON.parse(fs.readFileSync('data/generated/timetable/canonical/meetings.json', 'utf8'));
  const details = JSON.parse(fs.readFileSync('data/generated/timetable/canonical/meeting-details.json', 'utf8'));
  const diff = buildCandidateDiff(candidate, baseline, details);
  const diffHtml = renderCandidateDiffHtml(diff, { title: 'M5 TJK scheduled candidate review diff' });
  fs.writeFileSync(path.resolve(`${SOURCE_DIR}/candidate-diff.html`), diffHtml);

  const approve = runDecision({ expectedSha: candidateSha, decision: 'approve' });
  assert.equal(approve.status, 0, approve.stderr || approve.stdout);
  const approvedDecision = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/approve.json`, 'utf8'));
  validateHumanReviewDecision(approvedDecision);
  assert.equal(approvedDecision.review.decision, 'approved_for_separate_handoff');
  assert.equal(approvedDecision.review.candidate_approved_for_canonical_promotion, false);
  assert.equal(approvedDecision.candidate.review_status_at_decision, 'pending');
  assert.equal(approvedDecision.candidate.sha256, candidateSha);
  assert.equal(approvedDecision.diff.baseline_commit_sha, SOURCE_HEAD_SHA);
  assert.equal(approvedDecision.diff.baseline_only_implies_deletion, false);
  for (const key of ['candidate_mutated', 'promotion_invoked', 'canonical_write', 'public_projection_write', 'merge', 'deploy']) {
    assert.equal(approvedDecision.effects[key], false, `${key} must remain false`);
  }

  const candidateAfter = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/candidate.json`, 'utf8'));
  assert.equal(candidateAfter.review.status, 'pending');
  assert.equal(candidateAfter.records[0].review_status, 'pending');

  const reject = runDecision({ expectedSha: candidateSha, decision: 'reject', reasonCode: 'source-needs-manual-recheck' });
  assert.equal(reject.status, 0, reject.stderr || reject.stdout);
  const rejectedDecision = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/reject.json`, 'utf8'));
  assert.equal(rejectedDecision.review.decision, 'rejected');
  assert.equal(rejectedDecision.effects.canonical_write, false);

  const wrongHash = runDecision({ expectedSha: 'b'.repeat(64), output: `${OUTPUT_DIR}/wrong-hash.json` });
  assert.notEqual(wrongHash.status, 0);
  assert.match(wrongHash.stderr, /expected candidate SHA-256 does not match/);
  assert.equal(fs.existsSync(`${OUTPUT_DIR}/wrong-hash.json`), false);

  const botReviewer = runDecision({ expectedSha: candidateSha, reviewer: 'github-actions[bot]', output: `${OUTPUT_DIR}/bot.json` });
  assert.notEqual(botReviewer.status, 0);
  assert.match(botReviewer.stderr, /reviewer must be a human actor|human GitHub actor/);
  assert.equal(fs.existsSync(`${OUTPUT_DIR}/bot.json`), false);

  const originalDiff = fs.readFileSync(`${SOURCE_DIR}/candidate-diff.html`, 'utf8');
  fs.writeFileSync(`${SOURCE_DIR}/candidate-diff.html`, `${originalDiff}\n<!-- tampered -->\n`);
  const tamperedDiff = runDecision({ expectedSha: candidateSha, output: `${OUTPUT_DIR}/tampered.json` });
  assert.notEqual(tamperedDiff.status, 0);
  assert.match(tamperedDiff.stderr, /does not byte-match/);
  assert.equal(fs.existsSync(`${OUTPUT_DIR}/tampered.json`), false);
  fs.writeFileSync(`${SOURCE_DIR}/candidate-diff.html`, originalDiff);

  const workflow = fs.readFileSync('.github/workflows/m5-human-review.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
  assert.doesNotMatch(workflow, /^\s*push:/m);
  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /pull-requests:\s*write/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /source_run_id/);
  assert.match(workflow, /expected_candidate_sha256/);
  assert.match(workflow, /github\.actor/);
  assert.match(workflow, /actions\/download-artifact@v4/);
  assert.match(workflow, /run-id:/);
  assert.match(workflow, /github-token:/);
  assert.match(workflow, /create-m5-human-review-decision\.mjs/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow, /promote:timetable|promote-approved|canonical_write:\s*true|public_projection_write:\s*true|auto-merge|deploy/i);

  console.log('M5 human review workflow check passed.');
  console.log('- approval produces a separate handoff decision while candidate stays pending');
  console.log('- rejection is non-destructive and cannot imply canonical deletion');
  console.log('- source run, candidate SHA-256, baseline head SHA and byte-equal diff rebuild are bound together');
  console.log('- wrong hash, bot reviewer and tampered diff fail closed');
  console.log('- workflow is manual for decisions and has read-only repository/actions permissions');
} finally {
  fs.rmSync('artifacts/review-source', { recursive: true, force: true });
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
