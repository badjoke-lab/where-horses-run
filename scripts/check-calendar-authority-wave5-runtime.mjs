import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const viewModel = fs.readFileSync('src/lib/timetable/publicTimetableViewModel.ts', 'utf8');
const diagnosticsEndpoint = fs.readFileSync('src/pages/calendar/diagnostics.json.ts', 'utf8');
const diagnosticsClient = fs.readFileSync('public/calendar-diagnostics.js', 'utf8');
const runtimeBoundary = fs.readFileSync('scripts/check-calendar-runtime-import-boundary.mjs', 'utf8');

for (const required of [
  "../../../data/generated/timetable/public/meeting-list.json",
  "../../../data/generated/timetable/public/meeting-details.json",
  "const publicMeetingRows: readonly PublicTimetableMeetingRow[] = meetingListDataset.meetings",
  "const publicMeetingDetails: readonly PublicTimetableMeetingDetail[] = meetingDetailsDataset.details",
  "getPublicTimetableSnapshotId",
]) {
  assert.ok(viewModel.includes(required), 'runtime view model missing direct final-public marker: ' + required);
}

for (const forbidden of [
  'japan-a-plus-overrides.json',
  'tjkPublicSupplement',
  'baneiReviewedSupplement',
  'reviewedPublicCorrections',
  'reviewedPublicDetailCorrections',
  'reviewedPublicSupplements',
  'mergePublicMeetingRowsMonotonic',
  'mergePublicMeetingDetailsMonotonic',
  'maxRank(',
]) {
  assert.ok(!viewModel.includes(forbidden), 'runtime view model still changes publication truth: ' + forbidden);
}

const generatedImports = [...viewModel.matchAll(/data\/generated\/timetable\/[^'"]+/g)].map((match) => match[0]);
assert.deepEqual(
  [...new Set(generatedImports)].sort(),
  [
    'data/generated/timetable/public/meeting-details.json',
    'data/generated/timetable/public/meeting-list.json',
  ],
  'runtime view model may import only the final correlated public pair',
);

const publicList = JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-list.json', 'utf8'));
const publicDetails = JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-details.json', 'utf8'));
assert.equal(
  publicList.publication_snapshot?.snapshot_id,
  publicDetails.publication_snapshot?.snapshot_id,
  'runtime public pair must share one publication snapshot',
);

assert.match(diagnosticsEndpoint, /export const prerender\s*=\s*true/, 'operator diagnostics endpoint must remain prerendered');
assert.match(diagnosticsEndpoint, /publication_snapshot_id/, 'diagnostics must report the same final-public snapshot identity');
assert.match(diagnosticsEndpoint, /public: coverage/, 'diagnostics must aggregate final-public field coverage');
assert.doesNotMatch(diagnosticsEndpoint, /timetable_rows:\s*canonicalDetail/, 'diagnostics must not expose canonical timetable rows');
assert.doesNotMatch(diagnosticsClient, /effective_public_rank\s*=/, 'client diagnostics must not rewrite public rank');
assert.doesNotMatch(diagnosticsClient, /timetable_rows\s*=/, 'client diagnostics must not rewrite public timetable rows');

assert.ok(!runtimeBoundary.includes("'data/generated/timetable/public/japan-a-plus-overrides.json'"), 'Japan override artifact must not remain an allowed runtime publication input');
assert.ok(runtimeBoundary.includes('OPERATOR_DIAGNOSTICS_EXCEPTION: prerendered-aggregate-only'), 'runtime boundary must document the bounded diagnostics exception');

for (const script of [
  'scripts/check-public-timetable-view.mjs',
  'scripts/check-calendar-runtime-import-boundary.mjs',
]) {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(result.status, 0, script + ' failed:\n' + result.stdout + '\n' + result.stderr);
}

console.log('CALENDAR_AUTHORITY_WAVE5_RUNTIME: pass');
console.log('RUNTIME_TIMETABLE_INPUTS: final-public-snapshot-only');
console.log('RUNTIME_TRUTH_CHANGING_OVERLAYS: 0');
console.log('PUBLIC_SNAPSHOT: ' + (publicList.publication_snapshot?.snapshot_id ?? 'missing'));
