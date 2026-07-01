import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildJraFinalReviewPackage } from './timetable/jra-final-review-package-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const hash = (file) => createHash('sha256').update(read(file)).digest('hex');
const planned = parse('data/generated/timetable/jra-planned-program-intake.json');
const control = parse('data/static/jra-pilot-control.json');
const readinessRegistry = parse('data/static/calendar-readiness-registry.json');
const authorityInventory = parse('data/static/authority-source-inventory.json');
const protectedFiles = ['data/candidates/japan-jra-candidates.json','data/generated/timetable/public/meeting-list.json','data/generated/timetable/public/meeting-details.json'];
const before = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));

function finalFixture({ approved = false, generatedAt = '2026-07-02T07:30:00.000Z' } = {}) {
  const final = structuredClone(planned);
  final.schema_version = 'jra-final-program-intake-v1';
  final.work_id = 'WHR-CAL-JAPAN-JRA';
  final.generated_at = generatedAt;
  final.source_stage = 'final_program';
  final.review_status = approved ? 'approved' : 'needs_review';
  final.promotion_eligible = false;
  final.review = {
    status: approved ? 'approved' : 'needs_review',
    reviewer: approved ? 'jra-final-review-package-validator' : null,
    reviewed_at: approved ? '2026-07-02T08:00:00.000Z' : null,
    summary: approved ? 'Approved in-memory review-package fixture.' : 'In-memory fixture awaiting review.'
  };
  final.records = final.records.map((record) => ({
    ...record,
    source_stage: 'final_program',
    promotion_eligible: false,
    source: {
      ...record.source,
      checked_at: generatedAt,
      acquisition_method: 'reviewed_final_program_fixture'
    }
  }));
  return final;
}

function packageFor(final, label = 'final.json') {
  const text = `${JSON.stringify(final, null, 2)}\n`;
  return buildJraFinalReviewPackage({
    planned,
    final,
    control,
    readinessRegistry,
    authorityInventory,
    finalFixtureSha256: createHash('sha256').update(text).digest('hex'),
    finalFixtureLabel: label
  });
}

const needsReview = packageFor(finalFixture());
if (needsReview.schema_version !== 'jra-final-review-package-v1') fail('review package schema is incorrect.');
if (needsReview.mode !== 'external_review_only') fail('review package mode is incorrect.');
if (needsReview.decision.structurally_valid !== true) fail('valid needs-review input must be structurally valid.');
if (needsReview.decision.final_confirmation_pass !== false) fail('needs-review input must not pass final confirmation.');
if (needsReview.decision.normalized_handoff_included !== false || needsReview.normalized_handoff !== null) fail('needs-review input must not include a normalized handoff.');
if (!needsReview.decision.blockers.includes('human_review_required')) fail('needs-review package is missing the human review blocker.');
if (JSON.stringify(needsReview.next_actions) !== JSON.stringify(['complete_human_review','regenerate_review_package'])) fail('needs-review next actions are incorrect.');

const approvedFinal = finalFixture({ approved: true });
const approved = packageFor(approvedFinal, 'approved-final.json');
if (!approved.decision.final_confirmation_pass || !approved.decision.candidate_handoff_ready) fail('approved final input must be handoff-ready.');
if (approved.decision.blockers.length !== 0) fail(`approved package has blockers: ${approved.decision.blockers.join(', ')}.`);
if (approved.normalized_handoff?.schema_version !== 'jra-final-normalized-handoff-v1') fail('approved package is missing normalized handoff output.');
if (approved.normalized_handoff?.normalized_meetings?.records?.length !== 6) fail('approved package meeting count is incorrect.');
if (approved.normalized_handoff?.normalized_details?.details?.length !== 6) fail('approved package detail count is incorrect.');
if (approved.input.final_fixture_label !== 'approved-final.json') fail('review package input label is incorrect.');
if (!/^[a-f0-9]{64}$/.test(approved.input.final_fixture_sha256)) fail('review package input digest is invalid.');
if (!approved.next_actions.includes('prepare_separate_normalized_data_pull_request')) fail('approved next actions omit the separate normalized-data pull request.');
if (!approved.next_actions.includes('retain_candidate_needs_review_state')) fail('approved next actions omit candidate review state.');

const preCutoff = packageFor(finalFixture({ generatedAt: '2026-07-02T06:59:00.000Z' }));
if (!preCutoff.decision.blockers.includes('final_confirmation_too_early')) fail('pre-cutoff package is missing its timing blocker.');
if (preCutoff.normalized_handoff !== null) fail('pre-cutoff package must not include a handoff.');
if (JSON.stringify(preCutoff.next_actions) !== JSON.stringify(['resolve_confirmation_blockers','regenerate_review_package'])) fail('pre-cutoff next actions are incorrect.');

const invalid = finalFixture({ approved: true });
invalid.records[0].source.official_url = 'https://example.com/final';
try {
  packageFor(invalid);
  fail('structurally invalid final input was not rejected.');
} catch (error) {
  if (!String(error.message).includes('allowed JRA host')) fail(`invalid final input returned unexpected error: ${error.message}`);
}

for (const reviewPackage of [needsReview, approved, preCutoff]) {
  for (const key of ['network_fetch_performed','source_body_stored','repository_write_performed','candidate_generated','candidate_approved','canonical_written','public_projection_written','pull_request_created','scheduled_operation_active']) {
    if (reviewPackage.boundaries?.[key] !== false) fail(`review package boundary ${key} must be false.`);
  }
}

const temp = mkdtempSync(path.join(os.tmpdir(), 'whr-jra-final-review-'));
try {
  const pendingPath = path.join(temp, 'pending.json');
  const approvedPath = path.join(temp, 'approved.json');
  const pendingOutput = path.join(temp, 'pending-review.json');
  const approvedOutput = path.join(temp, 'approved-review.json');
  writeFileSync(pendingPath, `${JSON.stringify(finalFixture(), null, 2)}\n`);
  writeFileSync(approvedPath, `${JSON.stringify(approvedFinal, null, 2)}\n`);

  for (const [input, output, expectedReady] of [[pendingPath, pendingOutput, false],[approvedPath, approvedOutput, true]]) {
    const result = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-review-package.mjs','--final',input,'--output',output], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0 || !existsSync(output)) {
      fail(`review package CLI failed: ${result.stderr || result.stdout}`);
      continue;
    }
    const payload = JSON.parse(readFileSync(output, 'utf8'));
    if (payload.decision.candidate_handoff_ready !== expectedReady) fail(`CLI handoff readiness mismatch for ${path.basename(input)}.`);
  }

  const dryRun = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-review-package.mjs','--final',approvedPath,'--dry-run'], { cwd: root, encoding: 'utf8' });
  if (dryRun.status !== 0 || !dryRun.stdout.includes('candidate_handoff_ready')) fail('review package CLI dry-run failed.');

  const repoInput = path.join(root, 'data/generated/timetable/jra-final-program-intake.json');
  writeFileSync(repoInput, `${JSON.stringify(approvedFinal, null, 2)}\n`);
  const repoInputRun = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-review-package.mjs','--final',repoInput,'--dry-run'], { cwd: root, encoding: 'utf8' });
  rmSync(repoInput, { force: true });
  if (repoInputRun.status === 0) fail('review package CLI allowed repository-local final input.');

  const repoOutput = path.join(root, 'data/generated/timetable/jra-final-review-package.json');
  const repoOutputRun = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-review-package.mjs','--final',approvedPath,'--output',repoOutput], { cwd: root, encoding: 'utf8' });
  if (repoOutputRun.status === 0 || existsSync(repoOutput)) fail('review package CLI allowed repository-local output.');
} finally {
  rmSync(path.join(root, 'data/generated/timetable/jra-final-program-intake.json'), { force: true });
  rmSync(path.join(root, 'data/generated/timetable/jra-final-review-package.json'), { force: true });
  rmSync(temp, { recursive: true, force: true });
}

const after = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));
if (JSON.stringify(before) !== JSON.stringify(after)) fail('review package validation modified candidate or public data.');

for (const sourcePath of ['scripts/timetable/jra-final-review-package-core.mjs','scripts/timetable/build-jra-final-review-package.mjs']) {
  const source = read(sourcePath);
  for (const forbidden of ['fetch(', 'axios', 'data/candidates/japan-jra-candidates.json', 'data/generated/timetable/public/meeting-list.json']) {
    if (source.includes(forbidden)) fail(`${sourcePath} contains forbidden marker ${forbidden}.`);
  }
}

if (errors.length) {
  console.error(`JRA_FINAL_REVIEW_PACKAGE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JRA_FINAL_REVIEW_PACKAGE: pass');
console.log('PENDING_INPUT_HANDOFF_INCLUDED: false');
console.log('APPROVED_INPUT_HANDOFF_INCLUDED: true');
console.log('REPOSITORY_INPUT_OR_OUTPUT: blocked');
console.log('CANDIDATE_OR_PUBLIC_DATA_CHANGED: false');
