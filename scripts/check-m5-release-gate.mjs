import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  assert.equal(fs.existsSync(path), true, `missing M5 release input: ${path}`);
  return fs.readFileSync(path, 'utf8');
}

const design = read('docs/runbooks/m5-scheduled-candidate-generation-design.md');
assert.match(design, /TJK is therefore eligible/);
assert.match(design, /reviewed_input_only/);
assert.match(design, /SOREC is therefore \*\*not eligible for scheduled candidate generation\*\*/);
assert.match(design, /must not approve, promote, publish, merge, or deploy/);

const runLog = read('scripts/timetable/scheduled-candidate-run-log.mjs');
assert.match(runLog, /scheduled-candidate-run-log-v1/);
assert.match(runLog, /const DRY_RUN_MODE = 'dry_run'/);
for (const effect of [
  'candidate_approved: false',
  'promotion_invoked: false',
  'canonical_write: false',
  'public_projection_write: false',
  'merge: false',
  'deploy: false',
]) {
  assert.match(runLog, new RegExp(effect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(runLog, /raw_html/);
assert.match(runLog, /racecard/);
assert.match(runLog, /odds/);
assert.match(runLog, /results/);
assert.match(runLog, /access_token/);

const diff = read('scripts/timetable/candidate-diff-page.mjs');
assert.match(diff, /review_only: true/);
assert.match(diff, /approval_effect: 'none'/);
assert.match(diff, /publication_effect: 'none'/);
assert.match(diff, /Baseline-only means not present in this candidate partition\. It is not a deletion instruction\./);
assert.match(diff, /removal_implied: false/);

const autoPrRunbook = read('docs/runbooks/m5-auto-candidate-pr-generation.md');
assert.match(autoPrRunbook, /#559|559/);
assert.match(autoPrRunbook, /review/i);
assert.match(autoPrRunbook, /force-push|force push/i);
assert.match(autoPrRunbook, /merge/i);

const tjkWorkflow = read('.github/workflows/calendar-tjk-current-future-candidates.yml');
assert.match(tjkWorkflow, /schedule:/);
assert.match(tjkWorkflow, /workflow_dispatch:/);
assert.match(tjkWorkflow, /contents: read/);
assert.match(tjkWorkflow, /run-m5-tjk-scheduled-dry-run\.mjs/);
assert.match(tjkWorkflow, /git diff --exit-code/);
assert.doesNotMatch(tjkWorkflow, /contents:\s*write/);
assert.doesNotMatch(tjkWorkflow, /pull-requests:\s*write/);

const humanWorkflow = read('.github/workflows/m5-human-review.yml');
assert.match(humanWorkflow, /workflow_dispatch:/);
assert.match(humanWorkflow, /actions: read/);
assert.match(humanWorkflow, /contents: read/);
assert.match(humanWorkflow, /create-m5-human-review-decision\.mjs/);
assert.doesNotMatch(humanWorkflow, /contents:\s*write/);
assert.doesNotMatch(humanWorkflow, /pull-requests:\s*write/);

const humanDecision = read('scripts/timetable/human-review-decision.mjs');
assert.match(humanDecision, /timetable-human-review-decision-v1/);
assert.match(humanDecision, /approved_for_separate_handoff/);
assert.match(humanDecision, /candidate_approved_for_canonical_promotion/);
assert.match(humanDecision, /canonical_write/);
assert.match(humanDecision, /public_projection_write/);

const freshness = read('src/lib/timetable/publicFreshnessState.mjs');
assert.match(freshness, /DEFAULT_STALE_AFTER_DAYS = 1/);
assert.match(freshness, /status: 'unknown'/);
assert.match(freshness, /status: rawAgeDays > staleAfterDays \? 'stale' : 'current'/);

const meetingList = read('src/components/TimetableMeetingList.astro');
assert.match(meetingList, /hasStaleRecords/);
assert.match(meetingList, /Some checks are stale\. Confirm with official sources\./);
assert.match(meetingList, /古い確認を含みます。公式ソースで確認してください。/);
assert.match(meetingList, /record\.official_source_url/);
assert.match(meetingList, /group\.records\.map\(\(record\) => \(/);
assert.match(meetingList, /<li class="meeting-row">/);
assert.doesNotMatch(meetingList, /race_name|distance_m|surface|course_label/);

const releaseNote = read('docs/runbooks/m5-release-note.md');
assert.match(releaseNote, /PR-091 is a \*\*runbook only\*\*/);
assert.match(releaseNote, /31895655101/);
assert.match(releaseNote, /9249724016/);
assert.match(releaseNote, /08f9fbc056230316953ba0fd5f43f3ccb1462164f61e993e15dcd9796f63a332/);
assert.match(releaseNote, /candidate count: `3`/);
assert.match(releaseNote, /candidate rank: `C`/);
assert.match(releaseNote, /KRA.*reviewed-input-only/i);
assert.match(releaseNote, /SOREC.*blocked/i);
assert.match(releaseNote, /PR #559 remains open and review-only/);
assert.match(releaseNote, /fully automatic unreviewed publishing/);

const releaseWorkflow = read('.github/workflows/m5-release-gate.yml');
assert.match(releaseWorkflow, /contents: read/);
assert.match(releaseWorkflow, /check-m5-release-gate\.mjs/);
assert.match(releaseWorkflow, /git diff --exit-code/);
assert.doesNotMatch(releaseWorkflow, /contents:\s*write/);
assert.doesNotMatch(releaseWorkflow, /pull-requests:\s*write/);
assert.doesNotMatch(releaseWorkflow, /deploy/i);

console.log('M5 release gate passed.');
console.log('- PR-088 through PR-094 contracts are present');
console.log('- TJK scheduled execution remains Rank C review-only');
console.log('- KRA remains reviewed-input-only; SOREC remains blocked');
console.log('- PR-091 is documented as runbook-only and PR #559 remains review-only');
console.log('- human review does not authorize Canonical/public promotion');
console.log('- stale-data visibility is present without expanding timetable detail');
console.log('- release workflow has no repository/publication write capability');
