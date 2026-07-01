import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildJraFinalNormalizedHandoff } from './timetable/jra-final-normalized-handoff-core.mjs';

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
const readiness = readinessRegistry.records.find((record) => record.authority_source_key === control.source_key);
const protectedFiles = ['data/candidates/japan-jra-candidates.json','data/generated/timetable/public/meeting-list.json','data/generated/timetable/public/meeting-details.json'];
const before = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));

function finalFixture({ approved = true, generatedAt = '2026-07-02T07:30:00.000Z', optional = true } = {}) {
  const final = structuredClone(planned);
  final.schema_version = 'jra-final-program-intake-v1';
  final.source_stage = 'final_program';
  final.generated_at = generatedAt;
  final.review_status = approved ? 'approved' : 'needs_review';
  final.review = {
    status: approved ? 'approved' : 'needs_review',
    reviewer: approved ? 'jra-handoff-validator' : null,
    reviewed_at: approved ? '2026-07-02T08:00:00.000Z' : null
  };
  final.records = final.records.map((record) => ({
    ...record,
    source_stage: 'final_program',
    source: {
      ...record.source,
      checked_at: generatedAt,
      acquisition_method: 'reviewed_final_program_fixture'
    },
    timetable_rows: record.timetable_rows.map((row, index) => ({
      ...row,
      race_name: optional ? `Reviewed Race ${index + 1}` : null,
      distance_m: optional ? 1200 + index * 100 : null,
      surface: optional ? (index % 2 ? 'Dirt' : 'Turf') : null,
      course_label: optional ? (index % 2 ? 'Dirt Course' : 'Turf Course') : null
    }))
  }));
  return final;
}

const build = (final) => buildJraFinalNormalizedHandoff({ planned, final, control, readinessRegistry, authorityInventory });
const expectBlocked = (label, final, marker) => {
  try { build(final); fail(`${label} was not blocked.`); }
  catch (error) { if (!String(error.message).includes(marker)) fail(`${label} returned ${error.message}.`); }
};

const verified = build(finalFixture());
if (verified.schema_version !== 'jra-final-normalized-handoff-v1') fail('handoff schema mismatch.');
if (!verified.confirmation.candidate_generation.permitted) fail('approved final fixture did not pass confirmation.');
if (verified.normalized_meetings.records.length !== 6 || verified.normalized_details.details.length !== 6) fail('handoff counts must be 6/6.');
if (verified.normalized_meetings.refresh_window.from !== '2026-07-04' || verified.normalized_meetings.refresh_window.to !== '2026-07-05') fail('handoff refresh window mismatch.');
if (verified.target_contract.candidate_review_state !== 'needs_review' || verified.target_contract.automatic_repository_write_allowed !== false) fail('target contract boundary mismatch.');

const meetingIds = verified.normalized_meetings.records.map((record) => record.meeting_id);
const detailIds = verified.normalized_details.details.map((record) => record.meeting_id);
if (JSON.stringify(meetingIds) !== JSON.stringify(detailIds)) fail('meeting/detail ID parity failed.');
for (const meeting of verified.normalized_meetings.records) {
  if (meeting.capability_rank !== readiness.technical_rank) fail(`${meeting.meeting_id} rank mismatch.`);
  if (!meeting.continuous_from_one || meeting.missing_fields.length) fail(`${meeting.meeting_id} verified metadata state is invalid.`);
  if (new URL(meeting.official_source_url).hostname !== 'www.jra.go.jp') fail(`${meeting.meeting_id} host is not canonical.`);
}
for (const detail of verified.normalized_details.details) {
  if (detail.timetable_rows.length !== 12 || !detail.timetable_rows.every((row) => row.metadata_status === 'verified')) fail(`${detail.meeting_id} verified rows are invalid.`);
  if (detail.source_trace.source_snapshot_path !== null || detail.source_trace.normalized_from_path !== null) fail(`${detail.meeting_id} claims repository paths.`);
}

const partial = build(finalFixture({ optional: false }));
const expectedMissingFields = [
  ['race_name', 'race_name'],
  ['distance', 'distance'],
  ['surface', 'surface'],
  ['course', 'course']
].filter(([, readinessKey]) => readiness.confirmed_fields?.[readinessKey] === true).map(([field]) => field);
if (!partial.normalized_meetings.records.every((record) => JSON.stringify(record.missing_fields) === JSON.stringify(expectedMissingFields))) {
  fail('partial missing_fields do not follow Calendar Readiness.');
}
const expectedPartialStatus = expectedMissingFields.length ? 'partial' : 'verified';
if (!partial.normalized_details.details.every((detail) => detail.timetable_rows.every((row) => row.metadata_status === expectedPartialStatus))) {
  fail('partial row status does not follow Calendar Readiness.');
}

expectBlocked('unreviewed fixture', finalFixture({ approved: false }), 'human_review_required');
expectBlocked('pre-cutoff fixture', finalFixture({ generatedAt: '2026-07-02T06:59:00.000Z' }), 'final_confirmation_too_early');
const badHost = finalFixture();
badHost.records[0].source.official_url = 'https://example.com/final';
expectBlocked('invalid-host fixture', badHost, 'allowed JRA host');

for (const key of ['network_fetch_performed','repository_write_performed','candidate_generated','candidate_approved','canonical_written','public_projection_written']) {
  if (verified.boundaries[key] !== false) fail(`boundary ${key} must be false.`);
}

const temp = mkdtempSync(path.join(os.tmpdir(), 'whr-jra-handoff-'));
try {
  const finalPath = path.join(temp, 'final.json');
  const outputPath = path.join(temp, 'handoff.json');
  writeFileSync(finalPath, JSON.stringify(finalFixture()));
  const run = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-normalized-handoff.mjs','--final',finalPath,'--output',outputPath], { cwd: root, encoding: 'utf8' });
  if (run.status !== 0 || !existsSync(outputPath)) fail(`external handoff CLI failed: ${run.stderr || run.stdout}`);
  const forbiddenPath = path.join(root, 'data/generated/timetable/jra-final-normalized-handoff.json');
  const forbidden = spawnSync(process.execPath, ['scripts/timetable/build-jra-final-normalized-handoff.mjs','--final',finalPath,'--output',forbiddenPath], { cwd: root, encoding: 'utf8' });
  if (forbidden.status === 0 || existsSync(forbiddenPath)) fail('CLI allowed direct repository output.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}

const after = Object.fromEntries(protectedFiles.map((file) => [file, hash(file)]));
if (JSON.stringify(before) !== JSON.stringify(after)) fail('validation modified candidate or public data.');

if (errors.length) {
  console.error(`JRA_FINAL_NORMALIZED_HANDOFF: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('JRA_FINAL_NORMALIZED_HANDOFF: pass');
console.log('VERIFIED_MEETINGS: 6');
console.log('VERIFIED_DETAILS: 6');
console.log(`PARTIAL_STATUS: ${expectedPartialStatus}`);
console.log('DIRECT_REPOSITORY_OUTPUT: blocked');
console.log('CANDIDATE_OR_PUBLIC_DATA_CHANGED: false');
